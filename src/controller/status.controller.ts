import {NextFunction, Response, Request} from "express";
import {CreatePicturesParams, CustomRequest} from "../interfaces/RequestInterfaces";
import {OrderModel} from "../models/order.model";
import {STATUSES, Order, Rating} from '../models';
import ApiError from '../exeptions/api-error';
import tokenService from "../services/tokenServiсe";
import ratingController from "./rating.controller";

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
            const order: OrderModel | null = await Order.findByPk(orderId)
            if (!order) return next(ApiError.BadRequest("Order is not found"))
            const update: OrderModel = await order.update({status: status})
            if (order.status===STATUSES.Completed){
                await Rating.destroy({where:{orderId:order.id}})
            }
            await order.update({status: status})
            if (status===STATUSES.Completed) {
                await ratingController.getLinkToCreateRating(orderId, next)
            }
            res.status(200).json(status)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new StatusController()

