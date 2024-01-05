const dotenv = require("dotenv");
const { server } = require("./app");
const { mongoose } = require("mongoose");


dotenv.config({
  path: "./.env",
});

const startServer = () => {
  server.listen(process.env.EXPRESS_SERVER_PORT, () => {
    console.log(
      "⚙️  Server is running on port: " +
        process.env.EXPRESS_SERVER_PORT +
        " 🚀"
    );
  });
};

const connecDb = async () => {
  const conn = await mongoose.connect(process.env.EXPRESS_MONGO_URI);
  console.log(`🍃 MongoDB Connected: ${conn.connection.host} 🚀`);
} 

try {
  startServer();
  connecDb();
} catch (error) {
  console.log(error);
  setTimeout(startServer, 5000);
  setTimeout(connecDb, 5000);
}
