const ApiError = require('../exeptions/api-error')
const {Order, Master, User, City, MasterCity, MasterBusyDate, STATUSES} = require('../models/models')
const masterController = require('../controller/master.controller')
const Status = require('../services/status.service')
const mail = require("../services/mailServiсe");
const oneOrder = require('../services/Order')
const uuid = require('uuid')
const bcrypt = require('bcrypt')


class OrderController {
    async createOrder(req, res, next) {
        try {
            const {cityId, clockSize, dateTime, email, masterId, name} = req.body
            let user = await User.findOne({where: {email}})
            if (!user) {
                const password = uuid.v4();
                const hashPassword = await bcrypt.hash(password.slice(0, 6), 5)
                const activationLink = uuid.v4();
                user = await User.create({
                    password: hashPassword,
                    email,
                    role: "USER",
                    name,
                    activationLink
                })
                const master = await Master.findOne({where: {id: masterId}})
                const city = await City.findOne({where: {id: cityId}})
                const masterBusyDate = await masterController.timeReservation(masterId, dateTime, cityId, next)

                for (let i = 1; i < clockSize; i++) {
                    const newDateTime = (new Date(new Date(dateTime).getTime() + 3600000 * i))
                    await masterController.timeReservation(masterId, newDateTime.toISOString(), cityId, next)
                }
                /*await Promise.all(clockSize.map(async (cs) => {
                    const newDateTime = (new Date(new Date(dateTime).getTime() + 3600000 * cs))
                    await masterController.timeReservation(masterId, newDateTime.toISOString(), cityId, next)
                }));*/

                const order = await Order.create({
                    email: email,
                    userId: user.id,
                    clockSize,
                    masterBusyDateId: masterBusyDate.id,
                    cityId,
                    originalCityName: city.cityName,
                    status: STATUSES.Approval,
                    masterId: master.id,
                    dealPrice: city.price
                })
                await mail.sendMailToNewUser(email, master.name, masterBusyDate.dateTime, clockSize, password.slice(0, 6), activationLink)
                res.status(201).json(order)
            } else {
                const master = await Master.findOne({where: {id: masterId}})
                const city = await City.findOne({where: {id: cityId}})

                for (let i = 1; i < clockSize; i++) {
                    const newDateTime = (new Date(new Date(dateTime).getTime() + 3600000 * i))
                    await masterController.timeReservation(masterId, newDateTime.toISOString(), cityId, next)
                }
                /*const timeReservation = (cs) => {
                    return new Promise(function (resolve, reject) {
                        const newDateTime = (new Date(new Date(dateTime).getTime() + 3600000 * cs))
                        resolve(MasterBusyDate.findOne({where: {masterId, newDateTime}}))
                        reject(ApiError.BadRequest("this master is already working at this time"))
                    })
                }
                Promise.all(clockSize.map(timeReservation))
                    .then(results => {
                            results.map(dateTime => MasterBusyDate.create({masterId, dateTime: String(dateTime)}))
                        },
                        error => next(error)
                    )*/

                const order = await Order.create({
                    email: email,
                    userId: user.id,
                    clockSize,
                    masterBusyDateId: masterBusyDate.id,
                    cityId,
                    originalCityName: city.cityName,
                    status: STATUSES.Approval,
                    masterId: master.id,
                    dealPrice: city.price
                })
                await mail.sendMail(email, master.name, masterBusyDate.dateTime, clockSize)
                res.status(201).json(order)
            }
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(e))
        }
    }

    async getAllOrders(req, res, next) {
        try {
            let {limit, offset, masterId, userId} = req.query
            if (limit > 50) limit = 50
            if (!offset) offset = 0
            let where
            if (userId) where = {'userId': userId}
            else if (masterId) where = {'masterId': masterId}
            const options = {
                where,
                include: [
                    {model: City},
                    {model: MasterBusyDate}
                ],
                limit,
                offset
            }
            if (userId) {
                options.include.push(
                    {model: User, where: {id: userId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}})
            } else if (masterId) {
                options.include.push({
                        model: Master,
                        where: {id: masterId},
                        attributes: {exclude: ['password', 'activationLink']}
                    },
                    {model: User, attributes: {exclude: ['password', 'activationLink']}})
            } else {
                options.include.push(
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, attributes: {exclude: ['password', 'activationLink']}})
            }
            const orders = await Order.findAndCountAll(options)
            res.status(200).json(orders)
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async getOneOrder(req, res, next) {
        try {
            const orderId = req.params.orderId
            const order = await Order.findOne({
                    include: {all: true},
                    where: {id: orderId},
                }
            )
            const user = await User.findOne({where: {id: order.userId}})
            const master = await Master.findOne({where: {id: order.master_busyDate.id}})
            if (!order) return next(ApiError.BadRequest("Order not found"))
            const result = new oneOrder(order, user, master)
            res.status(200).json({result})
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async deleteOrder(req, res, next) {
        try {
            const {orderId} = req.params
            if (!orderId) next(ApiError.BadRequest("id is not defined"))
            const candidate = await Order.findOne({where: {id: orderId}})
            if (!candidate) next(ApiError.BadRequest(`order with id:${orderId} is not defined`))
            await Order.destroy({where: {id: masterId}})
            res.status(200).json({message: `order with id:${orderId} was deleted`, order: candidate})
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }
}

module.exports = new OrderController()