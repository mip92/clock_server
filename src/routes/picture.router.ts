export {};
const Router =require('express').Router;
const router = new Router();
const pictureController = require('../controller/picture.controller')

const checkRoles = require("../middlwares/checkRolesMiddleware");
const {ROLE} = require("../models")

router.post('/:orderId', pictureController.createPictures);
router.get('/:orderId',checkRoles([ROLE.Admin, ROLE.Master, ROLE.User]), pictureController.getPictures)
router.delete('/:orderId',checkRoles([ROLE.Admin, ROLE.Master, ROLE.User]), pictureController.deletePictures);




module.exports=router