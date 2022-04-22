import {NextFunction, Response, Request} from "express";
import {CreatePicturesParams, CustomRequest} from "../interfaces/RequestInterfaces";
import {OrderModel} from "../models/order.model";

const ApiError = require('../exeptions/api-error')
const {STATUSES, Order} = require('../models/index');

export interface ChangeStatusBody {
    status: string
}

class StatusController {

    async getStatuses(req: Request, res: Response, next: NextFunction) {
        try {
            res.status(200).json(STATUSES)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async changeStatus(req: CustomRequest<ChangeStatusBody, CreatePicturesParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            const {status} = req.body
            const order: OrderModel = await Order.findByPk(orderId)
            if (!order) return next(ApiError.BadRequest("Order is not found"))
            if (STATUSES[status]) {
                const update = await order.update({status: STATUSES[status]})
                res.status(200).json(status)
            } else return next(ApiError.BadRequest("Status not found"))
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new StatusController()