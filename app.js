require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const app = express();
const { loggerRoute, Approuter, unknownRotes } = require("./routes/AppRoute");
const { userRouter } = require("./routes/UserRoutes/UserRoutes.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const socketio = require("socket.io");
const { initializeSocketIO } = require("./socket/Socket.js");
const { ErrorMiddleware } = require("./middlewares/ErrorMiddleWare/Error.js");
const { chatRouter } = require("./routes/ChatRoutes/ChatRouter.js");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
const server = http.createServer(app);
const io = socketio(server, {
  pingTimeout: parseInt(process.env.EXPRESS_PING_TIMEOUT) || 6000,
  cors: {
    origin: process.env.EXPRESS_CORS_ORIGIN,
    methods: ["*"],
    credentials: true,
  },
});
app.set("io", io);
app.use(
  cors({
    origin: process.env.EXPRESS_CORS_ORIGIN,
    methods: ["*"],
    credentials: true,
  })
);

// logger router
app.use("/", loggerRoute);

// health_test router
app.use("/api/v1/test", Approuter);

//user routers
app.use("/api/v1/user", userRouter);

//chat routes
app.use("/api/v1/chat", chatRouter);

//unknown routes
app.all("*", unknownRotes);

// ErrorHandler
app.use(ErrorMiddleware);

//socket Initializing
initializeSocketIO(io);

module.exports = { server };
