const Router =require('express').Router;
const router = new Router();
const pictureController = require('../controller/picture.controller')

const {body} = require("express-validator");
const checkRules = require("../middlwares/checkRuleMiddleware");
const checkRules2 = require("../middlwares/checkRulesMiddleware");


router.post('/', pictureController.createPicture);



module.exports=router