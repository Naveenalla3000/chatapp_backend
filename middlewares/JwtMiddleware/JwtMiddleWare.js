require("dotenv").config();
const jwt = require("jsonwebtoken");
const refreshTokenExpire = parseInt(
  process.env.EXPRESS_REFRESH_TOKEN_EXPIRES_IN || "300",
  10
);
const accessTokenExpire = parseInt(
  process.env.EXPRESS_ACCESS_TOKEN_EXPIRES_IN || "1200",
  10
);

const signAccessToken = (_id) => {
  return jwt.sign({ _id }, process.env.EXPRESS_ACCESS_TOKEN || "", {
    expiresIn: parseInt(process.env.EXPRESS_ACCESS_TOKEN_TOKEN_EXPIRES_IN),
  });
};
const signRefreshToken = (_id) => {
  return jwt.sign({ _id }, process.env.EXPRESS_REFRESH_TOKEN || "", {
    expiresIn: parseInt(process.env.EXPRESS_ACCESS_REFRESH_TOKEN_EXPIRES_IN),
  });
};

const refreshTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: false,
  sameSite: "lax",
};
const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: false,
  sameSite: "lax",
};
const setToken = (user, statusCode, res) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  if (process.env.EXPRESS_NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }
   if (process.env.EXPRESS_NODE_ENV === "production") {
    refreshTokenOptions.secure = true;
  }
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.status(statusCode).json({
    success: true,
    user,
    access_token: accessToken,
  });
};
module.exports = {
  setToken,
  accessTokenOptions,
  refreshTokenOptions,
};
