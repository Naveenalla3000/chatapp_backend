const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);
const MessageModel = mongoose.model("MessageModel", chatMessageSchema);
module.exports = {
  MessageModel,
};
