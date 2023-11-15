const express = require("express");
const {
  registerNewUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
} = require("../../controllers/UserController/UserController");
const {
  isAutheticated,
} = require("../../middlewares/AuthMiddleware/AuthUserMiddleware/AuthUserMiddleware");
const userRouter = express.Router();

userRouter.post("/register", registerNewUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", updateAccessToken, isAutheticated, logoutUser);
userRouter.get("/refresh", updateAccessToken);
userRouter.get("/me", updateAccessToken, isAutheticated, getUserInfo);

module.exports = {
  userRouter,
};
