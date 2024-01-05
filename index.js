const dotenv = require("dotenv");
const { server } = require("./app");
const { mongoose } = require("mongoose");


dotenv.config({
  path: "./.env",
});

const startServer = () => {
  server.listen(8000,()=>{console.log("server runing....")});
};

const connecDb = async () => {
  const conn = await mongoose.connect(process.env.EXPRESS_MONGO_URI);
  console.log(`🍃 MongoDB Connected: ${conn.connection.host} 🚀`);
} 

startServer();
connecDb();
