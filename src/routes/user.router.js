const Router = require('express').Router;
const router = new Router();
const userController = require('../controller/user.controller')
const checkRole2 = require('../middlwares/checkRolesMiddleware')
const checkRules = require('../middlwares/checkRuleMiddleware')
const checkRules2 = require("../middlwares/checkRulesMiddleware");
const {body} = require('express-validator');
const {ROLE}=require("../models/models")

validationCreateUserBodyRules = [
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail()
];
validationFindUserBodyRules = [
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail()
];
validationUpdateUserBodyRules = [
    body('id', 'id is required').not().isEmpty().escape(),
    body('newEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('newName', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
];
validationChangeEmailBodyRules = [
    body('password', "password must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('currentEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('newEmail', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('role', 'role must be not null').not()
];

router.post('/', validationCreateUserBodyRules, checkRules, userController.createUser);
router.get('/findUser', validationFindUserBodyRules, checkRules, userController.findUser);
router.get('/',checkRole2([ROLE.Admin]), userController.getAllUsers);
router.get('/:userId',checkRole2([ROLE.Admin]), userController.getOneUser);
router.put('/',checkRole2([ROLE.Admin]), userController.updateUser);
router.delete('/:userId',checkRole2([ROLE.Admin]),  userController.deleteUser);
router.put('/changeEmail', checkRole2([ROLE.User]), validationChangeEmailBodyRules, checkRules2, userController.changeEmail)

module.exports = router