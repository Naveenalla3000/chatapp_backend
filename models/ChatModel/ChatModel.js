const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageModel",
    },
    messages: [
      {
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MessageModel",
        },
      },
    ],
  },
  { timestamps: true }
);
const ChatModel = mongoose.model("ChatModel", chatSchema);
module.exports = {
  ChatModel,
};
