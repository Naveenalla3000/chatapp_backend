require("dotenv").config();
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/UserModel/UserModel");
const {
  ChatEventEnum,
  AvailableChatEvents,
} = require("../constants/Constants");
const { ErrorHandler } = require("../middlewares/ErrorMiddleWare/ErrorHandler");

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

const userSocketMap = {} // userId : socketId

const getRecipientSocketId = (recipientId)=>{
  return userSocketMap[recipientId];
}


/**
 *
 * @param {Server<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} io
 */
const initializeSocketIO = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = socket.handshake.query;
      let token = cookies?.access_token;
      if (!token) {
        throw new Error("Un-Authoried handshake. Token is misssing", 401);
      }
      const decoded = jwt.verify(
        token,
        process.env.EXPRESS_ACCESS_TOKEN.toString()
      );
      // console.log("decoded", decoded);
      if (!decoded) {
        throw new Error("Un-Authoried handshake. Token is invalid", 401);
      }
      const userId = decoded?._id;
      if (!userId) {
        throw new Error("Un-Authoried handshake. User is invalid", 401);
      }
      const user = await UserModel.findById(userId).select("-password");
      if (!user) {
        throw new Error("Un-Authoried handshake. User is invalid", 401);
      }
      socket.user = user; // mount te user object to the socket
      // We are creating a room with user id so that if user is joined but does not have any active chat going on.
      // still we want to emit some socket events to the user.
      // so that the client can catch the event and show the notifications.
      // console.log(socket);

      // map the userId to the socketId so that we can emit the events to the specific user
      if(userId && user && userId !== "undefined" && decoded){
        userSocketMap[userId] = socket.id;
      }
      io.emit("getOnlineUsers",Object.keys(userSocketMap));  //[6565122685898c43e332d6f6,6565122585898c43e332d6ee]
      // console.log("online users hash map "+Object.keys(userSocketMap));
      socket.join(user._id.toString());
      // console.log(socket);
      socket.emit(ChatEventEnum.CONNECTED_EVENT); // emit the connected event so that client is aware
      console.log("<< User connected 🗼 userId: ", user._id.toString()+" >>");
      console.log(
        `--------------------------------------------------------------------------------------------\n`
      );

      // Common events that needs to be mounted on the initialization
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);


      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        const disconnectedUserId = userId.toString();
        console.log(
          `<< user has disconnected 🚫 userId: ${disconnectedUserId} >>`
        );
        console.log(
          `--------------------------------------------------------------------------------------------\n`
        );
        socket.leave(disconnectedUserId);
        delete userSocketMap[disconnectedUserId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
        // console.log("online users hash map at deletion " + Object.keys(userSocketMap));
      });
    } catch (error) {
      console.log("<< Socket " + error.message + " >>");
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
 * @param {string} chatId - Chat where the event should be emitted
 * @param {AvailableChatEvents[0]} event - Event that should be emitted
 * @param {any} payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */

const emitSocketEvent = (req, chatId, event, payload) => {
  req.app.get("io").in(chatId).emit(event, payload);
};

module.exports = { initializeSocketIO, emitSocketEvent,getRecipientSocketId };
