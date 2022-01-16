const {User, Rating, Master, City} = require('../models/models')
const ApiError = require('../exeptions/api-error')


class RatingController {
    async createRating(req, res, next) {
        try {
            const {orderId, masterId, rating} = req.body
            const newRating = await Rating.create({ orderId, masterId, rating});
            return res.status(201).json(newRating)
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }
    async getAllRatings(req, res, next){
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
    }
    async getOneRating(req, res, next) {
        try {
            const ratingId = req.params.ratingId
            const rating = await Rating.findOne({
                    include: {all: true},
                    where: {id: ratingId},
                }
            )
            if (!rating) return next(ApiError.BadRequest("Rating not found"))
            res.status(200).json(rating)
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

}

module.exports = new RatingController()