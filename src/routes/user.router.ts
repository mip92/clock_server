import express from "express";

const router = express.Router();
import userController from '../controller/user.controller';
import checkRoles from '../middlwares/checkRolesMiddleware';
import checkRules2 from "../middlwares/checkRulesMiddleware";
import {body} from 'express-validator';
import {ROLE} from "../models";

const validationCreateUserBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail()
];
const validationUpdateUserBodyRules = [
    body('id', 'id is required').not().isEmpty().escape(),
    body('newEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('newName', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
];
const validationChangeEmailBodyRules = [
    body('password', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('currentEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('newEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('role', 'role must be not null').not()
];

router.post('/', validationCreateUserBodyRules, checkRules2, (res: any, req: any, next: any) => {
    userController.createUser(res, req, next)
});
router.get('/findUser', (res: any, req: any, next: any) => {
    userController.findUser(res, req, next)
});
router.get('/', checkRoles([ROLE.Admin]), (res: any, req: any, next: any) => {
    userController.getAllUsers(res, req, next)
});
router.get('/:userId', checkRoles([ROLE.Admin]), (res: any, req: any, next: any) => {
    userController.getOneUser(res, req, next)
});
router.put('/', checkRoles([ROLE.Admin]), (res: any, req: any, next: any) => {
    userController.updateUser(res, req, next)
});
router.delete('/:userId', checkRoles([ROLE.Admin]), (res: any, req: any, next: any) => {
    userController.deleteUser(res, req, next)
});
router.put('/changeEmail', checkRoles([ROLE.User]), validationChangeEmailBodyRules, checkRules2, (res: any, req: any, next: any) => {
    userController.changeEmail(res, req, next)
})

export default router