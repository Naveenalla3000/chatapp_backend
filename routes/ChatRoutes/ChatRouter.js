const express = require("express");
const {
  updateAccessToken,
} = require("../../controllers/UserController/UserController");
const {
  isAutheticated,
} = require("../../middlewares/AuthMiddleware/AuthUserMiddleware/AuthUserMiddleware");
const {
  authorizeRoles,
} = require("../../middlewares/AuthMiddleware/AuthRolesMiddleware/AuthRolesMiddleware");
const {
  getAllAssignedChats,
  getASpecificChat,
  updateChat,
  getLastMessageOfUser,
} = require("../../controllers/ChatController/ChatController");

const chatRouter = express.Router();

chatRouter.get(
  "/get-users",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("HELPER", "ADMIN", "USER"),
  getAllAssignedChats
);

chatRouter.get(
  "/get-chat/:chatId",
  updateAccessToken,
  isAutheticated,
  // authorizeRoles("HELPER", "ADMIN", "USER"),
  getASpecificChat
);

chatRouter.post(
  "/send-message",
  updateAccessToken,
  isAutheticated,
  // authorizeRoles("USER", "HELPER", "ADMIN"),
  updateChat
);

chatRouter.get(
  "/get-lastMessage/:chatId",
  updateAccessToken,
  isAutheticated,
  // authorizeRoles("USER", "HELPER", "ADMIN"),
  getLastMessageOfUser
);

module.exports = {
  chatRouter,
};
