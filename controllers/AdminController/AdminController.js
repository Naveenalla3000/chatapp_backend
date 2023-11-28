const mongoose = require("mongoose");
const { UserRolesEnum } = require("../../constants/Constants");
const {
  CatchAsyncError,
} = require("../../middlewares/AsyncMiddleware/CatchAsyncErrors");
const {
  ErrorHandler,
} = require("../../middlewares/ErrorMiddleWare/ErrorHandler");
const { UserModel } = require("../../models/UserModel/UserModel");

const changeHelper = CatchAsyncError(async (req, res, next) => {
  try {
    const { helperId, chatOrUserId } = req.body;
    if (!helperId || !chatOrUserId) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }
    if (!mongoose.Types.ObjectId.isValid(helperId)) {
      return next(new ErrorHandler("Invalid helperId", 400));
    }
    if (!mongoose.Types.ObjectId.isValid(chatOrUserId)) {
      return next(new ErrorHandler("Invalid userId", 400));
    }
    if (helperId === chatOrUserId) {
      return next(new ErrorHandler("Helper and user cannot be same", 400));
    }
    const helper = await UserModel.findById(helperId);
    if (!helper) {
      return next(new ErrorHandler("Helper not found", 404));
    }
    if (helper.role !== UserRolesEnum.HELPER) {
      return next(
        new ErrorHandler("Selected helper(user) is not a helper", 400)
      );
    }
    const user = await UserModel.findById(chatOrUserId);
    if (!user) {
      return next(
        new ErrorHandler(`User with id ${chatOrUserId} not found`, 404)
      );
    }
    if (user.role !== UserRolesEnum.USER) {
      return next(
        new ErrorHandler("Selected user(admin/helper) is not a user", 400)
      );
    }
    const chats = await UserModel.findById(helperId).select("chats");
    const assignedChats = chats.chats;
    const allChatIdsORAllUserIds = assignedChats.map((chat) => chat.userId);
    if (allChatIdsORAllUserIds.includes(chatOrUserId)) {
      return next(
        new ErrorHandler("This helper is already assigned to this user", 400)
      );
    }
    // updaitng the previousHelper
    const previousHelperId = user.helperId;
    const previousHelper = await UserModel.findById(previousHelperId).select(
      "-password"
    );
    if (!previousHelperId) {
      return next(new ErrorHandler("Previous helper not found", 404));
    }
    const admin = await UserModel.findOne({
      email: process.env.EXPRESS_ADMIN_EMAIL.toString(),
    }).select("-password");

    if (
      previousHelperId &&
      previousHelperId.toString() !== admin._id.toString()
    ) {
      previousHelper.chats = previousHelper.chats.filter(
        (chat) =>
          chat.userId.toString() !== user._id.toString() ||
          chat.userId.toString() === previousHelperId.toString()
      );
      await previousHelper.save();
    }
    // updating the newHelper
    const updatedHelper = await UserModel.findByIdAndUpdate(
      helperId,
      {
        $push: {
          chats: {
            userId: chatOrUserId,
          },
        },
      },
      { new: true }
    );
    if (!updatedHelper) {
      return next(new ErrorHandler("Helper not found", 404));
    }
    // updating the user
    user.helperId = helperId;
    user.helperName = helper.name;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Helper assigned successfully",
      user,
      helper: updatedHelper,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message), 400);
  }
});

const changeRole = CatchAsyncError(async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid userId", 400));
    }

    if (role !== UserRolesEnum.USER && role !== UserRolesEnum.HELPER) {
      return next(new ErrorHandler("Invalid role", 400));
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (user.role === role) {
      return next(new ErrorHandler("User already has this role", 400));
    }

    const admin = await UserModel.findOne({
      email: process.env.EXPRESS_ADMIN_EMAIL.toString(),
    });

    // Update user to helper
    if (role === UserRolesEnum.HELPER) {
      if (user.role !== UserRolesEnum.USER) {
        return next(new ErrorHandler("User is not a user", 400));
      }
      const previousHelperId = user.helperId;
      const previousHelper = await UserModel.findById(previousHelperId).select(
        "-password"
      );
      if (
        previousHelperId &&
        previousHelperId.toString() !== admin._id.toString()
      ) {
        previousHelper.chats = previousHelper.chats.filter(
          (chat) =>
            chat.userId.toString() !== user._id.toString() ||
            chat.userId.toString() === previousHelperId.toString()
        );
        await previousHelper.save();
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          role: UserRolesEnum.HELPER,
          helperId: admin._id,
          helperName: admin.name,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "User updated to helper successfully",
        user: updatedUser,
      });
    }

    // Update helper to user
    if (role === UserRolesEnum.USER) {
      if (user.role !== UserRolesEnum.HELPER) {
        return next(new ErrorHandler("User is not a helper", 400));
      }

      const chats = await UserModel.findById(userId).select("chats");
      const assignedChats = chats.chats;

      //allUserIdsExcept_UserId=>(himself)
      const allChatIdsORAllUserIds = assignedChats
        .filter((chat) => chat.userId && chat.userId !== userId)
        .map((chat) => chat.userId);

      // If assignedChats have only himself
      if (allChatIdsORAllUserIds.length === 0) {
        const updatedUser = await UserModel.findByIdAndUpdate(
          userId,
          {
            role: UserRolesEnum.USER,
            helperId: admin._id,
            helperName: admin.name,
          },
          { new: true }
        );

        return res.status(200).json({
          success: true,
          message: "Helper updated to user successfully",
          user: updatedUser,
        });
      } else {
        // If assignedChats are not empty and     contains himself and other
        const alreadyAssignedUsers = await UserModel.find({
          _id: { $in: allChatIdsORAllUserIds },
        });
        const alreadyAssignedUserIds = alreadyAssignedUsers.map((user) =>
          user._id.toString()
        );

        // Update the alreadyAssignedUser with adminId and admin name
        await UserModel.updateMany(
          { _id: { $in: alreadyAssignedUserIds } },
          {
            helperId: admin._id,
            helperName: admin.name,
          },
          { new: true }
        );

        await UserModel.findByIdAndUpdate(
          userId,
          {
            role: UserRolesEnum.USER,
            helperId: admin._id,
            helperName: admin.name,
            chats: [],
          },
          { new: true }
        );

        // const updatedUserChats = await UserModel.findById(userId).select(
        //   "chats"
        // );
        //const updatedAssignedChats = updatedUserChats.chats;
        //const allUpdatedChatIds = updatedAssignedChats.map(
        //  (chat) => chat.userId
        //);
        //if (
        //  !allUpdatedChatIds.includes(userId) ||
        // allUpdatedChatIds.length === 0
        //) {
        const updateUser = await UserModel.findByIdAndUpdate(
          userId,
          {
            $push: { chats: { userId } },
          },
          { new: true }
        );

        if (!updateUser) {
          return next(new ErrorHandler("Updated User not found", 404));
        }

        return res.status(200).json({
          success: true,
          message: "Helper updated to user successfully",
          user: updateUser,
        });
      }
    }
    return next(new ErrorHandler("Invalid role", 400));
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler(error.message, 500));
  }
});

const getAllHelpers = CatchAsyncError(async (req, res, next) => {
  try {
    const helpers = await UserModel.find({ role: UserRolesEnum.HELPER }).select(
      { name: 1, _id: 1, chats: 1 }
    );

    if (helpers.length === 0) {
      return next(new ErrorHandler("No helpers found", 404));
    }

    const helpersWithNoOfAssignedUsers = helpers.map((helper) => ({
      _id: helper._id,
      name: helper.name,
      noOfAssignedUsers: helper.chats ? helper.chats.length - 1 : 0,
    }));

    res.status(200).json({
      success: true,
      message: "All helpers fetched successfully",
      helpers: helpersWithNoOfAssignedUsers,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message), 400);
  }
});

const getHelperInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const { helperId } = req.body;
    if (!helperId) {
      return next(new ErrorHandler("Please enter all fields", 400));
    }
    if (!mongoose.Types.ObjectId.isValid(helperId)) {
      return next(new ErrorHandler("Invalid helperId", 400));
    }
    const helper = await UserModel.findById(helperId).select("-password");
    if (!helper) {
      return next(new ErrorHandler("Helper not found", 404));
    }
    if (helper.role !== UserRolesEnum.HELPER) {
      return next(
        new ErrorHandler("Selected helper(user) is not a helper", 400)
      );
    }
    const chats = await UserModel.findById(helperId).select("chats");
    const assignedChats = chats.chats;
    const allChatIdsORAllUserIds = assignedChats
      .filter((chat) => chat.userId && chat.userId !== helperId)
      .map((chat) => chat.userId);
    if (allChatIdsORAllUserIds.length === 0) {
      // return res.status(200).json({
      //   success: true,
      //   message: "Helper info fetched successfully",
      //   helper:[]
      // });
      return next(new ErrorHandler("No users found", 200));
      // For dom convenience statusCode is altering to 200 from 404 return next(new ErrorHandler("No users found", 404));
    }
    const users = await UserModel.find({
      _id: { $in: allChatIdsORAllUserIds },
    }).select({ name: 1, email: 1 });
    if (!users) {
      return next(new ErrorHandler("No users found", 404));
    }
    return res.status(200).json({
      success: true,
      message: "Helper info fetched successfully",
      users,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message), 400);
  }
});

module.exports = {
  changeHelper,
  changeRole,
  getAllHelpers,
  getHelperInfo,
};
