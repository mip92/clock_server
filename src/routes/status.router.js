const Router =require('express').Router;
const router = new Router();
const statusController = require('../controller/status.controller')
const checkRole2 = require('../middlwares/checkRolesMiddleware')
const {ROLE}=require("../models/models")

router.get('/', checkRole2([ROLE.Admin,ROLE.User, ROLE.Master]), statusController.getStatuses);
router.put('/:orderId', checkRole2([ROLE.Admin,ROLE.User, ROLE.Master]), statusController.changeStatus);


module.exports=router