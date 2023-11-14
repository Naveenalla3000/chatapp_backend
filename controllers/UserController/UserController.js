const { CatchAsyncError } = require("../../middlewares/AsyncMiddleware/CatchAsyncErrors");
const { ErrorHandler } = require("../../middlewares/ErrorMiddleWare/ErrorHandler");
const { UserModel } = require("../../models/UserModel/UserModel");

const RegisterNewUser = CatchAsyncError(async (res, res) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await UserModel.findOne({ email });
        if (isEmailExist) return ErrorHandler('Email Already Exist', 400);
        const newUser = await UserModel.create({
            name,
            email,
            password,
        });
        return res.status(201).json({
            status:true,
            newUser,
        });
    } catch (error) {
        console.log(error);
        return ErrorHandler(error.message, 400)
    }
});

