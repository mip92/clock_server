import express from "express";
const router = express.Router();
const {body} = require("express-validator");
const payPalController = require('../controller/payPal.controller')
const checkRules = require('../middlwares/checkRuleMiddleware')

const createPayPalOrderBodyRules = [
    body('payPalOrderId', 'dateTime is required').not().isEmpty(),
];

router.post('/created/:orderId', createPayPalOrderBodyRules, checkRules, payPalController.createPayPalOrder)
router.post('/paid', payPalController.orderHasBeenPaid)


export default router