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
} = require("../../controllers/ChatController/ChatController");

const chatRouter = express.Router();

chatRouter.get(
  "/get-users",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("HELPER", "ADMIN"),
  getAllAssignedChats
);
chatRouter.get(
  "/get-chat",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("HELPER", "ADMIN"),
  getASpecificChat
);
chatRouter.post(
  "/send-message",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("USER", "HELPER", "ADMIN"),
  updateChat
);

module.exports = {
  chatRouter,
};
