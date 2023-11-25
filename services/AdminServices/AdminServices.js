const { UserModel } = require("../../models/UserModel/UserModel");

const getAllUsersService = async(res)=>{
    const users = await UserModel.find().select("-password");

    if(!users){
        return res.status(404).json({
            success: false,
            message: "No users found"
        });
    }
    return res.status(200).json({
        success: true,
        users
    });
};

const updateUserRoleService = async(_id,role,res)=>{
    const user = await UserModel.findById(_id).select("-password");
    if(user.role===role){
        return res.status(400).json({
            success: false,
            message: "User already has this role"
        });
    }
    if(!user){
        return res.status(404).json({
            success: false,
            message: "No user found"
        });
    }
    const updatedUser = await UserModel.findByIdAndUpdate(_id,{role},{new:true}).select("-password");
    if(!updatedUser){
        return res.status(404).json({
            success: false,
            message: "User role not changed"
        });
    }
    return res.status(200).json({
        success: true,
        updatedUser
    });
}
module.exports ={
    getAllUsersService,
    updateUserRoleService
}