const Router =require('express').Router;
const router = new Router();
const orderController = require('../controller/order.controller')
const {body} = require("express-validator");
const checkRules = require('../middlwares/checkRulesMiddleware')
const checkRole = require("../middlwares/checkRoleMiddleware");

validationCreateOrderBodyRules = [
    body('cityId', 'city_id is required').not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('masterId', 'dateTime is required').not().isEmpty(),
    body('clockSize', 'clockSize is required').not().escape(),
    body('dateTime', 'dateTime is required').not().escape(),
];

router.post('/', validationCreateOrderBodyRules, checkRules, orderController.createOrder);
router.get('/', checkRole("ADMIN"), orderController.getAllOrders);
router.get('/:orderId', checkRole("ADMIN"), orderController.getOneOrder);
router.delete('/:orderId', checkRole("ADMIN"), orderController.deleteOrder);

module.exports=router