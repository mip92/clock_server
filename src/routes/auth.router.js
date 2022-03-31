const Router = require('express')
const router = new Router()
const authController = require('../controller/auth.controller')
const {body} = require("express-validator");
const checkRules = require("../middlwares/checkRulesMiddleware");

validationRegistrationBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('firstPassword', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('secondPassword', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
];

router.post('/registration', validationRegistrationBodyRules, checkRules, authController.registration)
router.get('/activate/:link', authController.activate);

module.exports = router