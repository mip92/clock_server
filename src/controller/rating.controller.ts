import {
    CreateRatingBody,
    CustomRequest,
    GetRatingByMasterParams
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {RatingModel} from "../models/rating.model";
import {Rating, Order} from '../models';
import ApiError from '../exeptions/api-error';
import {OrderModel} from "../models/order.model";

class RatingController {
    async createRating (req: CustomRequest<CreateRatingBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId, rating, comment} = req.body
            console.log(orderId, rating, comment)
            if (rating<0 || rating>5) return next(ApiError.BadRequest("1111rating and comment not created"))
            console.log(44444)
            const order: OrderModel | null = await Order.findOne({where:{id:orderId}})
            console.log(order)
            if (!order) return next(ApiError.ExpectationFailed({
                value: orderId,
                msg: "order is not found",
                param: "orderId",
                location: "body"
            }))
            const newRating:RatingModel = await Rating.create({masterId:order.masterId, orderId, rating, comment});
            !newRating && next(ApiError.BadRequest("rating and comment not created"))
            return res.status(201).json(newRating)
        } catch (e: any) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }
    /*async getAllRatings(req, res, next){
        try {
            let {limit, offset, masterId} = req.query
            if (limit > 50) limit = 50
            if (!offset) offset = 0
            let ratings
            if (!masterId) ratings = await Rating.findAndCountAll({
                limit,
                offset,
            })
            if (masterId) ratings = await Rating.findAndCountAll({
                where:{masterId},
                limit,
                offset
            })
            if (!ratings) return next(ApiError.BadRequest("Ratings not found"))
            res.status(200).json(ratings)
        }catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }*/

    async getRatingByMaster(req: CustomRequest<null, GetRatingByMasterParams, null, null>, res: Response, next: NextFunction) {
        try {
            const masterId = req.params.masterId
            const ratings: RatingModel[] = await Rating.findAll({
                    where: {masterId: +masterId},
                }
            )
            if (!ratings) return next(ApiError.BadRequest("Ratings not found"))
            let arrayOfRatings:number[] = []
            ratings.forEach((r)=>arrayOfRatings.push(r.rating))
            const sum = arrayOfRatings.reduce((a, b) => a + b, 0);
            const average = (Math.ceil((sum / arrayOfRatings.length)*10)/10)
            res.status(200).json({averageRating: average, masterId: +masterId, ratings})
        } catch (e: any) {
            next(ApiError.Internal(`server error`))
        }
    }

}
export default new RatingController()
//module.exports = new RatingController()