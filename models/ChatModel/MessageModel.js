import * as mongoose from 'mongoose'
const chatMessageSchema = new Schema(
    {
      sender: {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
      },
      content: {
        type: String,
      },
      chat: {
        type: Schema.Types.ObjectId,
        ref: "ChatModel",
      },
    },
    { timestamps: true }
  );
const MessageModel = mongoose.model("MessageModel", chatMessageSchema);  
module.exports = {
    MessageModel
};