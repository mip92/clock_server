import express from "express";
const router = express.Router();
import {body} from "express-validator";
import payPalController from '../controller/payPal.controller';
import checkRules from '../middlwares/checkRuleMiddleware';

const createPayPalOrderBodyRules = [
    body('payPalOrderId', 'dateTime is required').not().isEmpty(),
];

router.post('/created/:orderId', createPayPalOrderBodyRules, checkRules, (res: any, req: any, next: any) => {payPalController.createPayPalOrder(res, req, next)})
router.post('/paid', (res: any, req: any, next: any) => {payPalController.orderHasBeenPaid(res, req, next)})


export default router