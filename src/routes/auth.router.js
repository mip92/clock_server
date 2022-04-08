const Router = require('express')
const router = new Router()
const authController = require('../controller/auth.controller')
const {body} = require("express-validator");
const checkRules = require("../middlwares/checkRuleMiddleware");
const checkRules2 = require("../middlwares/checkRulesMiddleware");
const checkRole2 = require('../middlwares/checkRolesMiddleware')

validationLoginBodyRules = [
    body('password', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
];

validationChangeEmailBodyRules = [
    body('password', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('currentEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('newEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('role', 'role must be not null').not()
];

validationRegistrationBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('firstPassword', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('secondPassword', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
];

router.post('/login', validationLoginBodyRules, checkRules, authController.login)
router.get('/login/activate/:link', authController.loginActivate);
router.post('/changeEmail',
    checkRole2(["USER", "MASTER"]),
    validationChangeEmailBodyRules, checkRules2,
    authController.changeEmail)
router.post('/registration', validationRegistrationBodyRules, checkRules2, authController.registration)
router.get('/activate/:link', authController.activate);

module.exports = router