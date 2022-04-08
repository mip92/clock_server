const Router = require('express').Router;
const router = new Router();
const userController = require('../controller/user.controller')
const checkRole = require('../middlwares/checkRoleMiddleware')
const checkRules = require('../middlwares/checkRuleMiddleware')
const {body} = require('express-validator');

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

router.post('/', validationCreateUserBodyRules, checkRules, userController.createUser);
router.post('/findUser', validationFindUserBodyRules, checkRules, userController.findUser);
router.get('/',checkRole("ADMIN"), userController.getAllUsers);
router.get('/:userId',checkRole("ADMIN"), userController.getOneUser);
router.put('/',checkRole("ADMIN"), userController.updateUser);
router.delete('/:userId',checkRole("ADMIN"),  userController.deleteUser);

module.exports = router