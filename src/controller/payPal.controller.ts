import {CreatePayPalOrderBody, CustomRequest, GetOneOrderParams} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";
import {Order, STATUSES} from '../models';
import ApiError from '../exeptions/api-error';

class PayPalController {
    async createPayPalOrder(req: CustomRequest<CreatePayPalOrderBody, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {payPalOrderId} = req.body
            const {orderId} = req.params
            const order: OrderModel | null = await Order.findOne({where: {id: orderId},})
            if (!order) next(ApiError.BadRequest(`order with id:${orderId} is not defined`))
            order && await order.update({payPalOrderId: payPalOrderId, status: STATUSES.AwaitingPayment})
            res.status(200).json({message: `payPal order was created`})
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async orderHasBeenPaid(req: CustomRequest<any, null, null, null>, res: Response, next: NextFunction) {
        try {
            const payPalOrderId = req.body.resource.supplementary_data.related_ids.order_id
            const order: OrderModel | null = await Order.findOne({where: {payPalOrderId}})
            order && await order.update({status: STATUSES.Confirmed})
        } catch (e) {
            console.log(e)
        }
    }
}

export default new PayPalController()
//module.exports = new PayPalController()