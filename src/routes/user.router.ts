export {};
const Router = require('express').Router;
const router = new Router();
const userController = require('../controller/user.controller')
const checkRoles = require('../middlwares/checkRolesMiddleware')
const checkRules2 = require("../middlwares/checkRulesMiddleware");
const {body} = require('express-validator');
const {ROLE}=require("../models/index")

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

router.post('/', validationCreateUserBodyRules, checkRules2, userController.createUser);
router.get('/findUser', userController.findUser);
router.get('/',checkRoles([ROLE.Admin]), userController.getAllUsers);
router.get('/:userId',checkRoles([ROLE.Admin]), userController.getOneUser);
router.put('/',checkRoles([ROLE.Admin]), userController.updateUser);
router.delete('/:userId',checkRoles([ROLE.Admin]),  userController.deleteUser);
router.put('/changeEmail', checkRoles([ROLE.User]), validationChangeEmailBodyRules, checkRules2, userController.changeEmail)

module.exports = router