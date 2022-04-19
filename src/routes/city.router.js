const Router =require('express').Router;
const router = new Router();
const cityController = require('../controller/city.controller')
const checkRoles = require("../middlwares/checkRolesMiddleware");
const {body} = require("express-validator");
const checkRules = require("../middlwares/checkRuleMiddleware");
const checkRules2 = require("../middlwares/checkRulesMiddleware");
const {ROLE}=require("../models/models")

validationCreateCityBodyRules = [
    body('city', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price',"price per hour must be a number, min value is 0 hrn").not().isEmpty().isInt({min:0})
];
validationUpdateCityBodyRules = [
    body('cityName', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price',"price per hour must be a number, min value is 0 hrn").not().isEmpty().isInt({min:0})
];

router.post('/', checkRoles([ROLE.Admin]), validationCreateCityBodyRules, checkRules2, cityController.createCity);
router.get('/:cityId', cityController.getOneCity)
router.get('/', cityController.getCities);
router.delete('/:cityId',checkRoles([ROLE.Admin]),cityController.deleteCity);
router.put('/:cityId',checkRoles([ROLE.Admin]), validationUpdateCityBodyRules, checkRules2, cityController.updateCity);


module.exports=router