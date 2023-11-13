require('dotenv').config()
const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server,{
    cors: {
        origin: process.env.EXPRESS_CLIENT_URL,
        methods: ["*"],
        credentials: true,
    }
});
io.on('connection', (socket) => {
    console.log(socket.id,socket);
    console.log('a user connected');

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

});