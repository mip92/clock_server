const Router =require('express').Router;
const router = new Router();
const statusController = require('../controller/status.controller')
const checkRole2 = require('../middlwares/checkRolesMiddleware')

router.get('/', checkRole2(["ADMIN", "USER", "MASTER"]), statusController.getStatuses);
router.put('/:orderId', checkRole2(["ADMIN", "USER", "MASTER"]), statusController.changeStatus);
router.get('/:statusId', checkRole2(["ADMIN", "USER", "MASTER"]), statusController.getStatusById)


module.exports=router