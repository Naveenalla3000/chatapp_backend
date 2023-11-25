const mongoose = require("mongoose");
const {
  CatchAsyncError,
} = require("../../middlewares/AsyncMiddleware/CatchAsyncErrors");
const {
  ErrorHandler,
} = require("../../middlewares/ErrorMiddleWare/ErrorHandler");
const { ChatModel } = require("../../models/ChatModel/ChatModel");
const { UserModel } = require("../../models/UserModel/UserModel");
const { MessageModel } = require("../../models/ChatModel/MessageModel");

const getAllAssignedChats = CatchAsyncError(async (req, res, next) => {
  try {
    const reqId = req.user._id.toString();
    const chats = await UserModel.findById(reqId).select("chats");
    if (!chats) {
      return next(new ErrorHandler("No chats found", 404));
    }
    const assignedChats = chats.chats;
    if (!assignedChats) {
      return next(new ErrorHandler("No assigned chats found", 404));
    }
    const allChatIdsORAllUserIds = assignedChats.map((chat) => chat.userId);
    if (!allChatIdsORAllUserIds) {
      return next(new ErrorHandler("No chats found", 404));
    }
    const allChats = await ChatModel.find({
      _id: { $in: allChatIdsORAllUserIds },
    });
    const allUsers = await UserModel.find({
      _id: { $in: allChatIdsORAllUserIds },
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "All Asigned chats",
      allUsers,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const getASpecificChat = CatchAsyncError(async (req, res, next) => {
  try {
    const reqId = req.user._id.toString();
    const { chatId } = req.body;
    if (!chatId) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return next(new ErrorHandler("Invalid Chat Id", 400));
    }
    const chats = await UserModel.findById(reqId).select("chats");
    if (!chats) {
      return next(new ErrorHandler("No chats found", 404));
    }
    const assignedChats = chats.chats;
    const allChatIdsORAllUserIds = assignedChats.map((chat) => chat.userId);
    if (!allChatIdsORAllUserIds.includes(chatId)) {
      return next(new ErrorHandler("You are not assigned to this chat", 400));
    }
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return next(new ErrorHandler("No chat found", 404));
    }
    const messageIds = chat.messages.map((message) => message._id);
    if (!messageIds) {
      return next(new ErrorHandler("No messagesIds found", 404));
    }
    const messages = await MessageModel.find({
      _id: { $in: messageIds },
    });
    if (!messages) {
      return next(new ErrorHandler("No messages found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Asigned Chat messages",
      chatId,
      messages,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateChat = CatchAsyncError(async (req, res, next) => {
  try {
    const { chatId, content } = req.body;
    const senderId = req.user._id.toString();
    if (!chatId || !senderId || !content) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return next(new ErrorHandler("Invalid Chat Id", 400));
    }
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return next(new ErrorHandler("Invalid Sender Id", 400));
    }
    // if himself updating his own chat
    if (senderId === chatId && chatId === req.user?._id.toString()) {
      const chat = await ChatModel.findById(chatId);
      if (!chat) {
        return next(new ErrorHandler("No chat found", 404));
      }
      const message = await MessageModel.create({
        sender: senderId,
        content,
      });
      if (!message) {
        return next(new ErrorHandler("Unable to create message", 400));
      }
      const receiver = await UserModel.findById(chatId);
      receiver.lastMessageContent = content;
      await receiver.save();
      chat.messages.push(message._id);
      await chat.save();
      res.status(201).json({
        success: true,
        message: `Chat updated by ${senderId}`,
        chatId,
        message,
      });

      // if someone else {ADMIN || HELPER } updating the chat
    } else {
      const sendingUser = await UserModel.findById(senderId);
      if (!sendingUser) {
        return next(new ErrorHandler("No user found", 404));
      }
      const chats = await UserModel.findById(senderId).select("chats");
      if (!chats) {
        return next(new ErrorHandler("No chats found at user", 404));
      }
      const assignedChats = chats.chats;
      if (!assignedChats) {
        return next(new ErrorHandler("No assigned chats found", 404));
      }
      const allChatIdsORAllUserIds = assignedChats.map((chat) => chat.userId);
      if (!allChatIdsORAllUserIds) {
        return next(new ErrorHandler("No chats found", 404));
      }
      if (!allChatIdsORAllUserIds.includes(chatId)) {
        return next(new ErrorHandler("You are not assigned to this chat", 400));
      }
      const chat = await ChatModel.findById(chatId);
      if (!chat) {
        return next(new ErrorHandler("No chat found", 404));
      }
      const message = await MessageModel.create({
        sender: senderId,
        content,
      });
      if (!message) {
        return next(new ErrorHandler("Unable to create message", 400));
      }
      chat.messages.push(message._id);
      await chat.save();
      const receiver = await UserModel.findById(chatId);
      receiver.lastMessageContent = content;
      await receiver.save();
      res.status(201).json({
        success: true,
        message: `Chat updated by ${senderId}`,
        chatId,
        message,
      });
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

module.exports = {
  getAllAssignedChats,
  getASpecificChat,
  updateChat,
};
