require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { UserRolesEnum } = require("../../constants/Constants");

const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: [true, "Email already taken"],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      trim: true,
    },
    role: {
      type: String,
      enum: UserRolesEnum,
      default: UserRolesEnum.USER,
      required: [true, "User Role must be provide"],
    },
    chatId: {
      type: String,
    },
    helperId: {
      type: String,
    },
    helperName: {
      type: String,
    },
    lastMessageContent: {
      type: String,
    },
    onlineStatus: {
      type: String,
    },
    chats: [
      {
        userId: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password") && user.password) {
    user.password = await bcrypt.hash(
      user.password,
      parseInt(process.env.EXPRESS_SALT_ROUNDS)
    );
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  const user = this;
  return await bcrypt.compare(enteredPassword, user.password);
};

const UserModel = mongoose.model("UserModel", userSchema);

module.exports = {
  UserModel,
};
