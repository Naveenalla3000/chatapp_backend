const { AvailableUserRoles, UserRolesEnum } = require("../../constants/Constants");
const { CatchAsyncError } = require("../../middlewares/AsyncMiddleware/CatchAsyncErrors");
const { ErrorHandler } = require("../../middlewares/ErrorMiddleWare/ErrorHandler");
const { getAllUsersService, updateUserRoleService } = require("../../services/AdminServices/AdminServices");

const getAllUsers = CatchAsyncError(async(req,res,next)=>{
    try {
        getAllUsersService(res);
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler(error.message,400));
    }
});

const updateUserRole = CatchAsyncError(async(req,res,next)=>{
    try {
        const {_id,role} = req.body;
        if(!(role in UserRolesEnum)){
            return next(new ErrorHandler("Please provide valid role",400));
        }
        if(!_id || !role){
            return next(new ErrorHandler("Please provide _id and role",400));
        }
        updateUserRoleService(_id,role,res);
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler(error.message,400));
    }
});

module.exports = {
    getAllUsers,
    updateUserRole,
}