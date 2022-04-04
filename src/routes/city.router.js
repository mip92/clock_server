const Router =require('express').Router;
const router = new Router();
const cityController = require('../controller/city.controller')
const checkRole = require('../middlwares/checkRoleMiddleware')
const {body} = require("express-validator");
const checkRules = require("../middlwares/checkRuleMiddleware");

validationCreateCityBodyRules = [
    body('city', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price',"price per hour must be a number").not().isEmpty().isInt()
];
validationUpdateCityBodyRules = [
    body('cityName', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price',"price per hour must be a number").not().isEmpty().isInt()
];

router.post('/', checkRole("ADMIN"), validationCreateCityBodyRules, checkRules, cityController.createCity);
router.get('/:cityId', cityController.getOneCity)
router.get('/', cityController.getCities);
router.delete('/:cityId',checkRole("ADMIN"),cityController.deleteCity);
router.put('/:cityId',checkRole("ADMIN"), validationUpdateCityBodyRules, checkRules, cityController.updateCity);


module.exports=router