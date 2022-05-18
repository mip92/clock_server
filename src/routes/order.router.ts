import express from "express";
const router = express.Router();
import orderController from '../controller/order.controller';
import {body} from "express-validator";
import checkRules from '../middlwares/checkRuleMiddleware';
import checkRoles from "../middlwares/checkRolesMiddleware";
import {ROLE} from "../models";

const validationCreateOrderBodyRules = [
    body('cityId', 'city_id is required').not().isEmpty().escape(),
    body('email', 'email must be a valid email format').not().isEmpty().isEmail().normalizeEmail(),
    body('name', "name must be longer than 3 symbols").isLength({min: 3}).not().isEmpty().escape(),
    body('masterId', 'dateTime is required').not().isEmpty(),
    body('clockSize', 'clockSize is required').not().escape(),
    body('dateTime', 'dateTime is required').not().escape(),
];

router.post('/', validationCreateOrderBodyRules, checkRules, (res: any, req: any, next: any) => {orderController.createOrder(res, req, next)});
router.get('/', checkRoles([ROLE.Admin, ROLE.Master, ROLE.User]), (res: any, req: any, next: any) => {orderController.getAllOrders(res, req, next)});
/*router.get('/:orderId', checkRoles([ROLE.Admin]), orderController.getOneOrder);*/
router.delete('/:orderId', checkRoles([ROLE.Admin]), (res: any, req: any, next: any) => {orderController.deleteOrder(res, req, next)});
router.get('/minMax/:masterId', (res: any, req: any, next: any) => {orderController.findMaxAndMinPrice(res, req, next)});
router.get('/getExcel', (res: any, req: any, next: any) => {orderController.getExcel(res, req, next)});


export default router