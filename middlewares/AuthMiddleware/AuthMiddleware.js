const { UserModel } = require("../../models/UserModel/UserModel");
const { CatchAsyncError } = require("../AsyncMiddleware/CatchAsyncErrors");
const { ErrorHandler } = require("../ErrorMiddleWare/ErrorHandler");
const isAutheticated = CatchAsyncError(async(req,res,next)=>{
    const access_token = req.cookies.access_token;
    if (!access_token) return next(new ErrorHandler('Please login to access this resource', 400));
    const decoded = jwt.verify(access_token, process.env.EXPRESS_ACCESS_TOKEN);
    if (!decoded) return next(new ErrorHandler('Access token in Invaild', 400));
    const user = await UserModel.findById(decoded._id);
    if (!user) return next(new ErrorHandler('Please Login to access this resource', 400));
    req.user = user;
    next();
});

module.exports = {
    isAutheticated,
}