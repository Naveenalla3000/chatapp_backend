const dotenv = require("dotenv");
const { server } = require("./app");
const { connectDb } = require("./db/Db.js");
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

try {
  startServer();
  connectDb();
} catch (error) {
  console.log(error);
  setTimeout(startServer, 5000);
  setTimeout(connectDb, 5000);
}
