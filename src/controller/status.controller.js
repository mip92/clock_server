const ApiError = require('../exeptions/api-error')
const {STATUSES, Order} = require('../models/models')

class StatusController {

    async getStatuses(req, res, next) {
        try {
            res.status(200).json(STATUSES)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
    async changeStatus(req, res, next) {
        try {
            const {orderId} = req.params
            const {status} = req.body
            const order = await Order.findByPk(orderId)
            if (!order) return next(ApiError.BadRequest("Order is not found"))
            for (let key in STATUSES) {
                if (STATUSES[key]==status) {
                    const update = await order.update({status:STATUSES[key]})
                    res.status(200).json(status)
                }
            }
            return next(ApiError.BadRequest("Status not found"))
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new StatusController()