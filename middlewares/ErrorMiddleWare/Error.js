const { ErrorHandler } = require("./ErrorHandler");

const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong MongoDB ID
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error
  if (err.code == 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Wrong JWT error
  if (err.name == "JsonWebTokenError") {
    const message = "Json webToken is invalid, try again";
    err = new ErrorHandler(message, 400);
  }

  // JWT expired error
  if (err.name == "TokenExpiredError") {
    const message = "Json webToken is expired, try again";
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    status: err.statusCode,
    success: false,
    message: err.message,
    ...(process.env.EXPRESS_NODE_ENV === "development"
      ? { stack: err.stack }
      : {}),
  });
};

module.exports = {
  ErrorMiddleware,
};
