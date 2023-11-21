const {
  CatchAsyncError,
} = require("../../middlewares/AsyncMiddleware/CatchAsyncErrors");
const {
  ErrorHandler,
} = require("../../middlewares/ErrorMiddleWare/ErrorHandler");
const {
  setToken,
  refreshTokenOptions,
  accessTokenOptions,
} = require("../../middlewares/JwtMiddleware/JwtMiddleWare");
const { UserModel } = require("../../models/UserModel/UserModel");
const jwt = require("jsonwebtoken");

const {
  getUserByIdService,
} = require("../../services/UserServices/UserServices");
const axios = require("axios");

const registerNewUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    const isEmailExist = await UserModel.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler("Email Already Exist", 400));
    }
    const newUser = await UserModel.create({
      name,
      email,
      password,
    });
    return res.status(201).json({
      status: true,
      newUser,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const loginUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password,recaptchValue } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    const resData = await axios({
      method: "POST",
      url: `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.EXPRESS_GOOGLE_RECAPTCHA_SECRET}&response=${recaptchValue}`,
    });
    if(!resData?.data?.success){
      return next(new ErrorHandler("Invalid Captcha", 400));
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User Not Found", 400));
    }
    const isPasswordMatched =await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Incorrect Password", 400));
    }
    user.password = undefined;
    setToken(user, 200, res);
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const logoutUser = CatchAsyncError(async (req, res, next) => {
  try {
    res.cookie("refresh_token", "", { maxAge: 1 });
    res.cookie("access_token", "", { maxAge: 1 });
    req.user = null;
    res.user = null;
    res.status(200).json({
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateAccessToken = CatchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token) {
      return next(new ErrorHandler("Please Login First", 400));
    }
    const decoded =  jwt.verify(
      refresh_token,
      process.env.EXPRESS_REFRESH_TOKEN.toString()
    );
    if (!decoded) {
      return next(new ErrorHandler("Invalid Refresh Token, Please login", 400));
    }
    const user = await UserModel.findById(decoded._id).select("-password")
    if (!user) {
      return next(new ErrorHandler("Please Login to access this resource", 400));
    }
    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_ACCESS_TOKEN,
      { expiresIn: parseInt(process.env.EXPRESS_ACCESS_TOKEN_TOKEN_EXPIRES_IN) }
    );
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_REFRESH_TOKEN,
      { expiresIn: parseInt( process.env.EXPRESS_ACCESS_REFRESH_TOKEN_EXPIRES_IN) }
    );
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.user = user;
    next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const updateAccessTokenForRefresh = CatchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token) {
      return next(new ErrorHandler("Please Login First", 400));
    }
    const decoded =  jwt.verify(
      refresh_token,
      process.env.EXPRESS_REFRESH_TOKEN.toString()
    );
    if (!decoded) {
      return next(new ErrorHandler("Invalid Refresh Token, Please login", 400));
    }
    const user = await UserModel.findById(decoded._id).select("-password")
    if (!user) {
      return next(new ErrorHandler("Please Login to access this resource", 400));
    }
    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_ACCESS_TOKEN,
      { expiresIn: parseInt(process.env.EXPRESS_ACCESS_TOKEN_TOKEN_EXPIRES_IN) }
    );
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_REFRESH_TOKEN,
      { expiresIn: parseInt( process.env.EXPRESS_ACCESS_REFRESH_TOKEN_EXPIRES_IN) }
    );
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.user = user;
    res.status(200).json({
      success: true,
      message: "Token Updated Successfully",
      user,
      access_token:accessToken,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const getUserInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id || "";
    getUserByIdService(userId, res);
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

const updatePassword = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id || "";
    const { oldPassword, newPassword,confirmNewPassword  } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }
    if (newPassword !== confirmNewPassword) {
      return next(new ErrorHandler("Password and Confirm Password does not match", 400));
    }
    const userExist = await UserModel.findById(userId);
    if (!userExist) {
      return next(new ErrorHandler("User Not Found", 400));
    }
    const isPasswordMatched = await userExist.comparePassword(oldPassword);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Incorrect Password", 400));
    }
    const user = await UserModel.findByIdAndUpdate(userId, {newPassword},{new:true})
    user.password = undefined;
    res.status(200).json({
      success: true,
      message: "Password Updated Successfully",
      user
    });
  }
  catch (error) {
    console.log(error);
    return next(new ErrorHandler(error.message, 400));
  }
});

module.exports = {
  registerNewUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  updateAccessTokenForRefresh,
  getUserInfo,
  updatePassword,
};
