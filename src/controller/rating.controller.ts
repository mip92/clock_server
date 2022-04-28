import {
    CreateRatingBody,
    CustomRequest,
    GetRatingByMasterParams
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {RatingModel} from "../models/rating.model";

const {Rating} = require('../models');
const ApiError = require('../exeptions/api-error')

class RatingController {
    async createRating (req: CustomRequest<CreateRatingBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId, masterId, rating} = req.body
            const newRating:RatingModel = await Rating.create({masterId:masterId, orderId:orderId, rating:rating});
            return res.status(201).json(newRating)
        } catch (e) {
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
            //const average = Math.floor(sum / arr.length);
            res.status(200).json({averageRating: average, masterId: +masterId, ratings})
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

}

module.exports = new RatingController()