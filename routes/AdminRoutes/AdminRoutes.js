const express = require('express');
const { updateAccessToken } = require('../../controllers/UserController/UserController');
const { isAutheticated } = require('../../middlewares/AuthMiddleware/AuthUserMiddleware/AuthUserMiddleware');
const { authorizeRoles } = require('../../middlewares/AuthMiddleware/AuthAdminMiddleware/AuthAdminMiddleware');
const { getAllUsers } = require('../../controllers/AdminController/AdminController');
const adminRouter = express.Router();

adminRouter.get('/get-users',updateAccessToken,isAutheticated,authorizeRoles('admin'),getAllUsers);

module.exports = {
    adminRouter
}