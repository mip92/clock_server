const Router =require('express').Router;
const router = new Router();
const cityController = require('../controller/city.controller')
const checkRole = require('../middlwares/checkRoleMiddleware')
const {body} = require("express-validator");
const checkRules = require("../middlwares/checkRuleMiddleware");
const checkRules2 = require("../middlwares/checkRulesMiddleware");

validationCreateCityBodyRules = [
    body('city', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price',"price per hour must be a number, min value is 0 hrn").not().isEmpty().isInt({min:0})
];
validationUpdateCityBodyRules = [
    body('cityName', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price',"price per hour must be a number, min value is 0 hrn").not().isEmpty().isInt({min:0})
];

router.post('/', checkRole("ADMIN"), validationCreateCityBodyRules, checkRules2, cityController.createCity);
router.get('/:cityId', cityController.getOneCity)
router.get('/', cityController.getCities);
router.delete('/:cityId',checkRole("ADMIN"),cityController.deleteCity);
router.put('/:cityId',checkRole("ADMIN"), validationUpdateCityBodyRules, checkRules2, cityController.updateCity);


module.exports=router