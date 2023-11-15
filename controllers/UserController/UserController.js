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
const { jwt } = require("jsonwebtoken");
const { getUserByIdService } = require("../../services/UserServices/UserServices");

const registerNewUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(ErrorHandler("Please Enter All Fields", 400));
    }
    const isEmailExist = await UserModel.findOne({ email });
    if (isEmailExist) {
      return next(ErrorHandler("Email Already Exist", 400));
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
    return next(ErrorHandler(error.message, 400));
  }
});

const loginUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return next(ErrorHandler("User Not Found", 400));
    }
    const isPasswordMatched = user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(ErrorHandler("Invalid Password", 400));
    }
    setToken(user, 200, res);
  } catch (error) {
    console.log(error);
    return next(ErrorHandler(error.message, 400));
  }
});

const logoutUser = CatchAsyncError(async (req, res, next) => {
  try {
    res.cookie("refresh_token", "", { maxAge: 1 });
    res.cookie("access_token", "", { maxAge: 1 });
    res.user = null;
    res.status(200).json({
      success: true,
      message: "Logged Out Successfully",
    });
  } catch (error) {
    console.log(error);
    return next(ErrorHandler(error.message, 400));
  }
});

const updateAccessToken = CatchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookie.refresh_token;
    const decoded = jwt.verify(refresh_token, process.env.EXPRESS_REFRESH_TOKEN);
    if (!decoded) {
      return next(ErrorHandler("Invalid Refresh Token, Please login", 400));
    }
    const user = await UserModel.findById(decoded._id);
    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_ACCESS_TOKEN,
      { expiresIn: process.env.EXPRESS_ACCESS_TOKEN_TOKEN_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.EXPRESS_REFRESH_TOKEN,
      { expiresIn: process.env.EXPRESS_ACCESS_REFRESH_TOKEN_EXPIRES_IN }
    );
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.user = user;
    next();
  } catch (error) {
    console.log(error);
    return next(ErrorHandler(error.message, 400));
  }
});

const getUserInfo = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?._id || '';
        getUserByIdService(userId,res)
    } catch (error) {
        console.log(error);
        return next(ErrorHandler(error.message, 400));
    }
});

module.exports = {
  registerNewUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo
}