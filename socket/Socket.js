const { cookie } = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { ErrorHandler } = require("../middlewares/ErrorMiddleWare/ErrorHandler");
const { UserModel } = require("../models/UserModel/UserModel");
const {
  ChatEventEnum,
  AvailableChatEvents,
} = require("../constants/Constants");

const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies?.access_token;
      if (!token) {
        token = socket.handshake.auth?.access_token;
      }
      if (!token) {
        return ErrorHandler("Un-Authoried handshake. Token is misssing", 401);
      }
      const decoded = jwt.verify(token, process.env.EXPRESS_ACCESS_TOKEN);
      if (!decoded) {
        return ErrorHandler("Un-Authoried handshake. Token is invalid", 401);
      }
      const userId = decoded._id;
      const user = await UserModel.findById(userId);
      if (!user) {
        return ErrorHandler("Un-Authoried handshake. User not found", 401);
      }
      socket.user = user;
      socket.join(user._id.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT);
      console.log("User connected 🔗. userId: ", user._id.toString());

      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("user has disconnected 🚫. userId: " + socket.user?._id);
        if (socket.user?._id) {
          socket.leave(socket.user._id);
        }
      });
    } catch (error) {
      console.log(error);
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error.message ? error.message : "Something went wrong"
      );
    }
  });
};

/**
 *
 * @param {import("express").Request} req - Request object to access the `io` instance set at the entry point
 * @param {string} roomId - Room where the event should be emitted
 * @param {AvailableChatEvents[0]} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */

const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload);
};

module.exports = { initializeSocketIO, emitSocketEvent };