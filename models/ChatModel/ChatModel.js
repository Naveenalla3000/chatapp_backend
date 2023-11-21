const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    name: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "MessageModel",
      },
      participants: [
        {
          type: Schema.Types.ObjectId,
          ref: "UserModel",
        },
      ],
      admin: {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
      },
  },
  { timestamps: true }
);
const ChatModel = mongoose.model("ChatModel", chatSchema);  
module.exports = {
    ChatModel
};

