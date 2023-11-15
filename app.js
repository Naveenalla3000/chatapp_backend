const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const healthRoute = require('./routes/appRoute.js');
const { connectDb } = require('./db/Db.js');
const { userRouter } = require('./routes/UserRoutes/UserRoutes.js');
const { adminRouter } = require('./routes/AdminRoutes/AdminRoutes.js');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
connectDb();

//logger route
app.use('/', (req, res, next) => {
    console.log("REQUEST PATH: ", req.path);
    console.log("REQUEST METHOD: ", req.method);
    next();
});

//test route
app.use('/api/v1/test', healthRoute);

//user routes
app.use('/api/v1',userRouter);
app.use('/api/v1',adminRouter);

//unknown routes
app.all('*', (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err)
});
module.exports = {
    app
};
