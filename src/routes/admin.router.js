const Router = require('express')
const router = new Router()
const adminController = require('../controller/admin.controller')
const {body} = require("express-validator");
const checkRules = require("../middlwares/checkRuleMiddleware");

validationLoginBodyRules = [
    body('password', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
];

//router.post('/login', validationLoginBodyRules, checkRules, adminController.login)

module.exports = router
