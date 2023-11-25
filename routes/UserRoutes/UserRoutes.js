const express = require("express");
const {
  registerNewUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  updatePassword,
  updateAccessTokenForRefresh,
} = require("../../controllers/UserController/UserController");
const {
  isAutheticated,
} = require("../../middlewares/AuthMiddleware/AuthUserMiddleware/AuthUserMiddleware");
const userRouter = express.Router();

userRouter.post("/register", registerNewUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", updateAccessToken, isAutheticated, logoutUser);
userRouter.get("/refresh", updateAccessTokenForRefresh);
userRouter.get("/me", updateAccessToken, isAutheticated, getUserInfo);
userRouter.post(
  "/update-password",
  updateAccessToken,
  isAutheticated,
  updatePassword
);

module.exports = {
  userRouter,
};
