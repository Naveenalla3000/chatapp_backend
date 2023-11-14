const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    name: {
      type: Schema.Types.ObjectId,
      ref: "userModel",
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "ChatMessage",
      },
      participants: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
  },
  { timestamps: true }
);
const ChatModel = mongoose.model("ChatModel", chatSchema);  
module.exports = {
    ChatModel
};

