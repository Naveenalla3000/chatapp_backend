const mongoose = require('mongoose');
const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.EXPRESS_MONGO_URI);
        console.log(`☘️  MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        setTimeout(connectDb, 5000);
    }
}
module.exports = {
    connectDb
}