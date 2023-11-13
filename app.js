const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const healthRoute = require('./routes/appRoute.js');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', (req, res, next) => {
    console.log("REQUEST PATH: ", req.path);
    console.log("REQUEST METHOD: ", req.method);
    next();
});
app.use('/api/test', healthRoute);

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Server is running on port ${process.env.EXPRESS_PORT}`);
});
module.exports = {
    app
};
