const { UserModel } = require("../../models/UserModel/UserModel");

const getUserByIdService = async(userId,res)=>{
    const user = await UserModel.findById(userId).select("-password");
    if(!user){
        return res.status(404).json({
            success:false,
            message:"User not found"
        });
    }
    return res.status(200).json({
        success:true,
        user,
    });
};

module.exports = {
    getUserByIdService
}