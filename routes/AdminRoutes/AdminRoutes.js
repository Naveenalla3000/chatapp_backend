const express = require("express");
const {
  updateAccessToken,
} = require("../../controllers/UserController/UserController");
const {
  isAutheticated,
} = require("../../middlewares/AuthMiddleware/AuthUserMiddleware/AuthUserMiddleware");
const {
  authorizeRoles,
} = require("../../middlewares/AuthMiddleware/AuthRolesMiddleware/AuthRolesMiddleware");
const {
  getAllHelpers,
  changeHelper,
  changeRole,
  getHelperInfo,
} = require("../../controllers/AdminController/AdminController");
const adminRouter = express.Router();

adminRouter.get(
  "/get-helpers",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("ADMIN"),
  getAllHelpers
);

adminRouter.post(
  "/change-helper",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("ADMIN"),
  changeHelper
);

adminRouter.post(
  "/change-role",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("ADMIN"),
  changeRole
);

adminRouter.post(
  "/get-helperInfo",
  updateAccessToken,
  isAutheticated,
  authorizeRoles("ADMIN"),
  getHelperInfo
);

module.exports = {
  adminRouter,
};
