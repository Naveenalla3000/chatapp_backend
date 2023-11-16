const express = require("express");
const dateFns = require("date-fns");
const {
  CatchAsyncError,
} = require("../middlewares/AsyncMiddleware/CatchAsyncErrors");
const { ErrorHandler } = require("../middlewares/ErrorMiddleWare/ErrorHandler");
const Approuter = express.Router();

const loggerRoute = CatchAsyncError(async (req, res, next) => {
  try {
    const reqPath = req.path;
    const reqMethod = req.method;
    const reqTime = dateFns.format(new Date(), "dd/MMMM/y hh:mm:ss");
    console.log(
      `<< REQUEST PATH ${reqPath}  REQUEST METHOD " ${reqMethod}" REQUEST TIME " ${reqTime} >>`
    );
    console.log(
      `--------------------------------------------------------------------------------------------\n`
    );
    next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error?.message, 400));
  }
});
Approuter.get(
  "/",
  CatchAsyncError(async (req, res) => {
    try {
      const response = {
        message: "health ok",
        timestamp: dateFns.format(new Date(), "dd/MMMM/y hh:mm:ss"),
        success: true,
      };
      res.status(200).json(response);
    } catch (error) {
      console.log(error);
      return next(new ErrorHandler(error?.message, 400));
    }
  })
);

const unknownRotes = CatchAsyncError(async (req, res, next) => {
  return next(new ErrorHandler(`Route ${req.originalUrl} not found`, 404));
});

module.exports = {
  loggerRoute,
  Approuter,
  unknownRotes,
};
