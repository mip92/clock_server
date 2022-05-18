import express from "express";
const router = express.Router();
import authController from '../controller/auth.controller';
import {body} from "express-validator";
import checkRules2 from "../middlwares/checkRulesMiddleware";

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

router.post('/login', validationLoginBodyRules, checkRules2, (res: any, req: any, next: any) => {authController.login(res, req, next)})
router.get('/login/activate/:link',(res: any, req: any, next: any) => { authController.loginActivate(res, req, next)});
router.post('/registration', validationRegistrationBodyRules, checkRules2, (res: any, req: any, next: any) => {authController.registration(res, req, next)})
router.get('/activate/:link', (res: any, req: any, next: any) => {authController.activate(res, req, next)});

export default router