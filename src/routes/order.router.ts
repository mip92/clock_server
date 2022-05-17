import express from "express";
const router = express.Router();
const orderController = require('../controller/order.controller')
const {body} = require("express-validator");
const checkRules = require('../middlwares/checkRuleMiddleware')
const checkRoles = require("../middlwares/checkRolesMiddleware");
const {ROLE}=require("../models")

const validationCreateOrderBodyRules = [
    body('cityId', 'city_id is required').not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('masterId', 'dateTime is required').not().isEmpty(),
    body('clockSize', 'clockSize is required').not().escape(),
    body('dateTime', 'dateTime is required').not().escape(),
];

router.post('/', validationCreateOrderBodyRules, checkRules, orderController.createOrder);
router.get('/', checkRoles([ROLE.Admin, ROLE.Master, ROLE.User]), orderController.getAllOrders);
/*router.get('/:orderId', checkRoles([ROLE.Admin]), orderController.getOneOrder);*/
router.delete('/:orderId', checkRoles([ROLE.Admin]), orderController.deleteOrder);
router.get('/minMax/:masterId', orderController.findMaxAndMinPrice);
router.get('/getExcel', orderController.getExcel);


export default router