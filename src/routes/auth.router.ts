import express from "express";
const router = express.Router();
const authController = require('../controller/auth.controller')
const {body} = require("express-validator");
const checkRules2 = require("../middlwares/checkRulesMiddleware");

const validationLoginBodyRules = [
    body('password', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
];

const validationRegistrationBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('firstPassword', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('secondPassword', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
];

router.post('/login', validationLoginBodyRules, checkRules2, authController.login)
router.get('/login/activate/:link', authController.loginActivate);
router.post('/registration', validationRegistrationBodyRules, checkRules2, authController.registration)
router.get('/activate/:link', authController.activate);

export default router