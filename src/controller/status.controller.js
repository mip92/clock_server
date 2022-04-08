const ApiError = require('../exeptions/api-error')
const {Status, Order} = require('../models/models')

class StatusController {

    async getStatuses(req, res, next) {
        try {
            const statuses = await Status.findAndCountAll()
            if (!statuses) return next(ApiError.BadRequest("Statuses not found"))
            res.status(200).json(statuses)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
    async changeStatus(req, res, next) {
        try {
            const {orderId} = req.params
            const {statusId} = req.body
            const status = await Status.findOne({where: {id:statusId}})
            if (!status) return next(ApiError.BadRequest("Status is not found"))
            const order = await Order.findByPk(orderId)
            if (!order) return next(ApiError.BadRequest("Order is not found"))
            res.status(200).json(status)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
    async getStatusById(req, res, next) {
        try {
            const {statusId} = req.params
            console.log(statusId)
            const status = await Status.findByPk(statusId)
            if (!status) return next(ApiError.BadRequest("Status not found"))
            return status
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

}

module.exports = new StatusController()