import express from "express";
const router = express.Router();
const statusController = require('../controller/status.controller')
const checkRoles = require('../middlwares/checkRolesMiddleware')
const {ROLE}=require("../models")

router.get('/', checkRoles([ROLE.Admin,ROLE.User, ROLE.Master]), statusController.getStatuses);
router.put('/:orderId', checkRoles([ROLE.Admin,ROLE.User, ROLE.Master]), statusController.changeStatus);


export default router