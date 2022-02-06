const ApiError = require('../exeptions/api-error')
const {Order, Master, User, City, MasterCity, MasterBusyDate} = require('../models/models')
const masterController = require('../controller/master.controller')
let mail = require("../services/mailServiсe");
let oneOrder = require('../services/Order')
const {where, DataTypes} = require("sequelize");

class OrderController {
    async createOrder(req, res, next) {
        try {
            const {cityId, clockSize, dateTime, email, masterId, name} = req.body
            const user = await User.create({
                email,
                role: "USER",
                name
            })
            /*const user = await User.findOne({where: {email}})
            console.log(user)*/
            const master = await Master.findOne({where: {id: masterId}})
            const city = await City.findOne({where: {id: cityId}})
            let masterBusyDate = await masterController.timeReservation(masterId, dateTime, next)
            for (let i = 1; i < clockSize; i++) {
                const newDateTime = (new Date(new Date(dateTime).getTime() + 3600000 * i))
                await masterController.timeReservation(masterId, newDateTime, next)
            }
            const order = await Order.create({
                email: email,
                userId: user.id,
                clockSize,
                masterBusyDateId: masterBusyDate.id,
                cityId,
                originalCityName:city.cityName
            })
            await mail.sendMail(email, master.name, masterBusyDate.dateTime, clockSize)
            res.status(201).json(order)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(e))
        }
    }

    async createMaster(req, res, next) {
        try {
            const {name, email, city_id} = req.body
            const isEmailUniq = await Master.findOne({where: {email}})
            if (isEmailUniq) return next(ApiError.BadRequest("Master with this email is already registered"))
            const city = await City.findOne({where: {id: city_id}})
            if (!city) return next(ApiError.BadRequest("city with this id is not found"))
            const newMaster = await Master.create({name, email});
            await MasterCity.create({masterId: newMaster.id, cityId: city_id})
            newMaster.dataValues.cities = [city]
            return res.status(201).json(newMaster)
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async getAllOrders(req, res, next) {
        try {
            let {limit, offset} = req.query
            if (limit > 50) limit = 50
            if (!offset) offset = 0
            const orders = await Order.findAndCountAll({
                limit,
                offset,
                include: {all: true},
            })
            const c = await Order.count({
                limit,
                offset,
            })
            if (!orders) return next(ApiError.BadRequest("Orders not found"))
            let result = []
            for (let i = 0; i < orders.rows.length; i++) {
                const user = await User.findOne({where: {id: orders.rows[i].dataValues.userId}})
                const dateTime = await MasterBusyDate.findOne({where: {id: orders.rows[i].dataValues.masterBusyDateId}})
                const master = await Master.findOne({where: {id: orders.rows[i].master_busyDate.dataValues.masterId}})
                const city = await City.findOne({where:{id:orders.rows[i].dataValues.cityId}})
                const ord = new oneOrder(dateTime.dateTime,
                    orders.rows[i].dataValues,
                    user.dataValues,
                    master.dataValues,
                    city.dataValues)
                result.push(ord)
            }
            res.status(200).json({ rows:result,  count:c})
        } catch (e) {
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