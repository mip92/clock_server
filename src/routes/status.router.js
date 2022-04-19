const Router =require('express').Router;
const router = new Router();
const statusController = require('../controller/status.controller')
const checkRoles = require('../middlwares/checkRolesMiddleware')
const {ROLE}=require("../models/models")

router.get('/', checkRoles([ROLE.Admin,ROLE.User, ROLE.Master]), statusController.getStatuses);
router.put('/:orderId', checkRoles([ROLE.Admin,ROLE.User, ROLE.Master]), statusController.changeStatus);


module.exports=router