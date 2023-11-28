require("dotenv").config();
const {
  CatchAsyncError,
} = require("../../middlewares/AsyncMiddleware/CatchAsyncErrors");
const {
  ErrorHandler,
} = require("../../middlewares/ErrorMiddleWare/ErrorHandler");
const {
  setToken,
  refreshTokenOptions,
  accessTokenOptions,
} = require("../../middlewares/JwtMiddleware/JwtMiddleWare");
const { UserModel } = require("../../models/UserModel/UserModel");
const jwt = require("jsonwebtoken");

const {
  getUserByIdService,
} = require("../../services/UserServices/UserServices");
const axios = require("axios");
const { ChatModel } = require("../../models/ChatModel/ChatModel");
const { MessageModel } = require("../../models/ChatModel/MessageModel");
const { UserRolesEnum } = require("../../constants/Constants");

const registerNewUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    const isEmailExist = await UserModel.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler("Email Already Exists", 400));
    }

    // Creating a welcome message
    const content = `Welcome, ${name}`;
    const message = await MessageModel.create({
      sender: "ADMIN",
      content,
    });
    if (!message) {
      return next(new ErrorHandler("Unable to create message", 400));
    }

    // Creating a new chat and associating the welcome message
    const chat = await ChatModel.create({});
    if (!chat) {
      return next(new ErrorHandler("Unable to create chat", 400));
    }
    chat.messages.push(message._id);
    await chat.save();

    // Creating the new user and associating the chat
    const newUser = await UserModel.create({
      _id: chat._id,
      name,
      email,
      password,
      chatId: chat._id,
      chats: [{ userId: chat._id }],
    });

    // Check if admin exists, create if not
    let admin = await UserModel.findOne({
      email: process.env.EXPRESS_ADMIN_EMAIL.toString(),
    }).select("-password");
    if (!admin) {
      admin = await UserModel.create({
        name: process.env.EXPRESS_ADMIN_NAME.toString(),
        email: process.env.EXPRESS_ADMIN_EMAIL.toString(),
        password: process.env.EXPRESS_ADMIN_PASSWORD.toString(),
        role: UserRolesEnum.ADMIN,
      });
    }

    // Update admin and user information and save
    admin.chats.push({ userId: chat._id });
    newUser.helperId = admin._id;
    newUser.helperName = admin.name;
    newUser.lastMessageContent = content;
    newUser.onlineStatus = "online";
    await newUser.save();
    await admin.save();

    // Clear password before sending the response
    newUser.password = undefined;

    return res.status(201).json({
      status: true,
      newUser,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const loginUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password, recaptchValue } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    // const resData = await axios({
    //   method: "POST",
    //   url: `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.EXPRESS_GOOGLE_RECAPTCHA_SECRET}&response=${recaptchValue}`,
    // });
    // if(!resData?.data?.success){
    //   return next(new ErrorHandler("Invalid Captcha", 400));
    // }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User Not Found", 400));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Incorrect Password", 400));
    }
    user.password = undefined;
    setToken(user, 200, res);
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const logoutUser = CatchAsyncError(async (req, res, next) => {
  try {
    res.cookie("refresh_token", "", { maxAge: 1 });
    res.cookie("access_token", "", { maxAge: 1 });
    res.user = null;
    req.cookies = null;
    req.user = null;
    res.status(200).json({
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateAccessToken = CatchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token) {
      return next(new ErrorHandler("Please Login First", 400));
    }
    const decoded = jwt.verify(
      refresh_token,
      process.env.EXPRESS_REFRESH_TOKEN.toString()
    );
    if (!decoded) {
      return next(new ErrorHandler("Invalid Refresh Token, Please login", 400));
    }
    const user = await UserModel.findById(decoded._id).select("-password");
    if (!user) {
      return next(
        new ErrorHandler("Please Login to access this resource", 400)
      );
    }
    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_ACCESS_TOKEN,
      { expiresIn: parseInt(process.env.EXPRESS_ACCESS_TOKEN_TOKEN_EXPIRES_IN) }
    );
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_REFRESH_TOKEN,
      {
        expiresIn: parseInt(
          process.env.EXPRESS_ACCESS_REFRESH_TOKEN_EXPIRES_IN
        ),
      }
    );
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.user = user;
    next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateAccessTokenForRefresh = CatchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token) {
      return next(new ErrorHandler("Please Login First", 400));
    }
    const decoded = jwt.verify(
      refresh_token,
      process.env.EXPRESS_REFRESH_TOKEN.toString()
    );
    if (!decoded) {
      return next(new ErrorHandler("Invalid Refresh Token, Please login", 400));
    }
    const user = await UserModel.findById(decoded._id).select("-password");
    if (!user) {
      return next(
        new ErrorHandler("Please Login to access this resource", 400)
      );
    }
    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_ACCESS_TOKEN,
      { expiresIn: parseInt(process.env.EXPRESS_ACCESS_TOKEN_TOKEN_EXPIRES_IN) }
    );
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_REFRESH_TOKEN,
      {
        expiresIn: parseInt(
          process.env.EXPRESS_ACCESS_REFRESH_TOKEN_EXPIRES_IN
        ),
      }
    );
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.user = user;
    res.status(200).json({
      success: true,
      message: "Token Updated Successfully",
      user,
      access_token: accessToken,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const getUserInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id || "";
    getUserByIdService(userId, res);
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const updatePassword = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id || "";
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    if (newPassword !== confirmNewPassword) {
      return next(
        new ErrorHandler("Password and Confirm Password does not match", 400)
      );
    }
    const user = await UserModel.findById(userId);

    if (!user) {
      return next(new ErrorHandler("User Not Found", 400));
    }
    const isPasswordMatched = await user.comparePassword(oldPassword);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Incorrect Old Password", 400));
    }
    user.password = newPassword;
    await user.save();
    user.password = undefined;
    res.status(200).json({
      success: true,
      message: "Password Updated Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

module.exports = {
  registerNewUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  updateAccessTokenForRefresh,
  getUserInfo,
  updatePassword,
};
