const ApiError = require('../exeptions/api-error')
const {City, User} = require('../models/models')

class CityController {
    async createCity(req, res, next) {
        try {
            const {city} = req.body
            const isCityUniq = await City.findOne({where: {city_name: city}})
            if (isCityUniq) next(ApiError.BadRequest("the city with that name already exists"))
            const newCity = await City.create({city_name: city})
            res.status(201).json(newCity)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async getCities(req, res, next) {
        try {
            let {limit, offset} = req.query
            if (limit > 50) limit = 50
            if (!offset) offset = 0
            let cities = await City.findAndCountAll({
                    limit,
                    offset,
                    order: [
                        ['createdAt', 'ASC']
                    ],
                }
            )
            if (!cities) return next(ApiError.BadRequest("Сities not found"))
            res.status(200).json(cities)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async getOneCity(req, res, next) {
        try {
            const {cityId} = req.params
            const city = await City.findOne({where: {id: cityId}})
            res.status(200).json(city)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async updateCity(req, res, next) {
        try {
            const {cityId} = req.params
            const {city_name} = req.body
            const city = await City.findOne({where: {id: cityId}})
            await city.update({"city_name": city_name})
            res.status(200).json(city)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async deleteCity(req, res, next) {
        try {
            const {cityId} = req.params
            if (!cityId) next(ApiError.BadRequest("id is not defined"))
            const candidate = await City.findOne({where: {id: cityId}})
            if (!candidate) next(ApiError.BadRequest(`city with id:${cityId} is not defined`))
            await City.destroy({where: {id: cityId}})
            res.status(200).json({message: `city with id:${cityId} was deleted`, city: candidate})
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new CityController()