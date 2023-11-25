require('dotenv').config();
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { ErrorHandler } = require("../middlewares/ErrorMiddleWare/ErrorHandler");
const { UserModel } = require("../models/UserModel/UserModel");
const {
  ChatEventEnum,
  AvailableChatEvents,
} = require("../constants/Constants");

/**
 * @description This function is responsible to allow user to join the chat represented by chatId (chatId). event happens when user switches between the chats
 * @param {Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} socket
 */

const mountJoinChatEvent = (socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);
    console.log(
      `--------------------------------------------------------------------------------------------\n`
    );
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
  });
};

/**
 * @description This function is responsible to emit the typing event to the other participants of the chat
 * @param {Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} socket
 */
const mountParticipantTypingEvent = (socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};

/**
 * @description This function is responsible to emit the stopped typing event to the other participants of the chat
 * @param {Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} socket
 */
const mountParticipantStoppedTypingEvent = (socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

/**
 *
 * @param {Server<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} io
 */
const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies?.access_token;
      if (!token) {
        token = socket.handshake.auth?.access_token;
      }
      if (!token) {
        throw new Error("Un-Authoried handshake. Token is misssing", 401);
      }
      const decoded = jwt.verify(token, process.env.EXPRESS_ACCESS_TOKEN.toString());
      if (!decoded) {
        throw new Error("Un-Authoried handshake. Token is invalid", 401);
      }
      const userId = decoded?._id;
      const user = await UserModel.findById(userId).select("-password");
      if (!user) {
        throw new Error("Un-Authoried handshake. User is invalid", 401);
      }
      socket.user = user; // mount te user object to the socket
      // We are creating a room with user id so that if user is joined but does not have any active chat going on.
       // still we want to emit some socket events to the user.
       // so that the client can catch the event and show the notifications.
      socket.join(user._id.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT);  // emit the connected event so that client is aware
      console.log("User connected 🗼 userId: ", user._id.toString());
      console.log(
        `--------------------------------------------------------------------------------------------\n`
      );

      // Common events that needs to be mounted on the initialization
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("<< user has disconnected 🚫. userId: " + socket.user?._id+" >>");
        console.log(
          `--------------------------------------------------------------------------------------------\n`
        );
        if (socket.user?._id) {
          socket.leave(socket.user._id);
        }
      });
    } catch (error) {
      console.log("<< Socket "+error.message+" >>");
      console.log(
        `--------------------------------------------------------------------------------------------\n`
      );
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