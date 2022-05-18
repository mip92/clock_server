import express from "express";
const router = express.Router();
import cityController from '../controller/city.controller';
const checkRoles = require("../middlwares/checkRolesMiddleware");
const {body} = require("express-validator");
const checkRules2 = require("../middlwares/checkRulesMiddleware");
const {ROLE} = require("../models")

const validationCreateCityBodyRules = [
    body('city', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price', "price per hour must be a number, min value is 0 hrn").not().isEmpty().isInt({min: 0})
];
const validationUpdateCityBodyRules = [
    body('cityName', "city name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('price', "price per hour must be a number, min value is 0 hrn").not().isEmpty().isInt({min: 0})
];

router.post('/', checkRoles([ROLE.Admin]), validationCreateCityBodyRules, checkRules2, (res: any, req: any, next: any) => {
    cityController.createCity(res, req, next)
});
router.get('/:cityId', (res: any, req: any, next: any) => {
    cityController.getOneCity(res, req, next)
})
router.get('/', (res: any, req: any, next: any) => {
    cityController.getCities(res, req, next)
});
router.delete('/:cityId', checkRoles([ROLE.Admin]), (res: any, req: any, next: any) => {
    cityController.deleteCity(res, req, next)
});
router.put('/:cityId', checkRoles([ROLE.Admin]), validationUpdateCityBodyRules, checkRules2, (res: any, req: any, next: any) => {
    cityController.updateCity(res, req, next)
});


export default router