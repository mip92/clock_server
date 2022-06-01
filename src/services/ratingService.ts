import {RatingModel} from "../models/rating.model";
import {Master, Rating} from "../models";

import {MasterModel} from "../models/master.model";
import {NextFunction} from "express";
import ApiError from "../exeptions/api-error";
import {Op} from "sequelize";

class RatingService {
    async changeRating(masterId: number, next: NextFunction) {
        const ratings: RatingModel[] = await Rating.findAll({
                where: {masterId,
                    rating: {[Op.not]: null}
                },
            }
        )
        if (!ratings) next(ApiError.BadRequest("Ratings not found"))
        let arrayOfRatings: number[] = []
        ratings.forEach((rating) => rating.rating && arrayOfRatings.push(rating.rating))
        const sum: number = arrayOfRatings.reduce((a, b) => a + b, 0);
        const average: number  = (Math.ceil((sum / arrayOfRatings.length) * 10) / 10)
        const master: MasterModel | null = await Master.findOne({where: {id: masterId}})
        await master?.update({rating: average})
        return average
    }
}
export default new RatingService()