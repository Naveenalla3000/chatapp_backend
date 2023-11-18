const express = require('express');
const { updateAccessToken } = require('../../controllers/UserController/UserController');
const { isAutheticated } = require('../../middlewares/AuthMiddleware/AuthUserMiddleware/AuthUserMiddleware');
const { authorizeRoles } = require('../../middlewares/AuthMiddleware/AuthAdminMiddleware/AuthAdminMiddleware');
const { getAllUsers, updateUserRole } = require('../../controllers/AdminController/AdminController');
const adminRouter = express.Router();

adminRouter.get('/get-users',updateAccessToken,isAutheticated,authorizeRoles('ADMIN'),getAllUsers);
adminRouter.post('/update-user-role',updateAccessToken,isAutheticated,authorizeRoles('ADMIN'),updateUserRole);

module.exports = {
    adminRouter
}