import {CreateOrderBody, CustomRequest, GetAllOrders, GetOneOrderParams} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {UserModel} from "../myModels/user.model";
import {MasterModel} from "../myModels/master.model";
import {CityModel} from "../myModels/city.model";
import {MasterBusyDateModel} from "../myModels/masterBusyDate.model";
import {OrderModel} from "../myModels/order.model";

const ApiError = require('../exeptions/api-error')
const {Order, Master, User, City, MasterBusyDate, STATUSES} = require('../myModels/index');
const mail = require("../services/mailServiсe");
const uuid = require('uuid')
const bcrypt = require('bcrypt')

class OrderController {
    async createOrder(req: CustomRequest<CreateOrderBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {cityId, clockSize, dateTime, email, masterId, name} = req.body
            let user: UserModel = await User.findOne({where: {email}})
            if (!user) {
                const password: string = uuid.v4();
                const hashPassword: string = await bcrypt.hash(password.slice(0, 6), 5)
                const activationLink: string = uuid.v4();
                user = await User.create({
                    password: hashPassword,
                    email,
                    role: "USER",
                    name,
                    activationLink,
                })
                const master: MasterModel = await Master.findOne({where: {id: masterId}})
                const city: CityModel = await City.findOne({where: {id: cityId}})
                let arr = [] as number[]
                for (let i: number = 0; i < clockSize; i++) {
                    arr.push(i)
                }
                const timeReservation = (cs: number): Promise<Date> => {
                    return new Promise((resolve, reject) => {
                        const newDateTime: Date = new Date(new Date(dateTime).getTime() + 3600000 * cs)
                        MasterBusyDate.findOne({where: {masterId, dateTime: String(newDateTime)}})
                            .then((dt: MasterBusyDateModel) => {
                                    if (dt) reject(ApiError.BadRequest("this master is already working at this time"))
                                    resolve(newDateTime)
                                }
                            )

                    })
                }
                let orderDateTime: string
                let newOrder: OrderModel
                let count = 0
                Promise.all(arr.map(cs => timeReservation(cs)))
                    .then(results => {
                        results.map(newDateTime => {
                                const dt = newDateTime.toISOString()
                                MasterBusyDate.create({masterId, dateTime: dt})
                                    .then(() => {
                                        if (count === 0) {
                                            new Promise(() => {
                                                    count++
                                                    const dt = new Date(dateTime).toISOString()
                                                    MasterBusyDate.findOne({where: {masterId, dateTime: dt}})
                                                        .then((mbd: MasterBusyDateModel) => {
                                                                orderDateTime = mbd.dateTime
                                                                return new Promise(() => {
                                                                        Order.create({
                                                                            email: email,
                                                                            userId: user.id,
                                                                            clockSize,
                                                                            masterBusyDateId: mbd.id,
                                                                            cityId,
                                                                            originalCityName: city.cityName,
                                                                            status: STATUSES.Approval,
                                                                            masterId: master.id,
                                                                            dealPrice: city.price
                                                                        }).then((result: OrderModel) => {
                                                                                return new Promise(() => {
                                                                                    newOrder = result
                                                                                    mail.sendMailToNewUser(email, master.name, orderDateTime, clockSize, password.slice(0, 6), activationLink)
                                                                                        .then(() => {
                                                                                            res.status(201).json(newOrder)
                                                                                        })

                                                                                })
                                                                            }
                                                                        )
                                                                    }
                                                                )
                                                            }
                                                        )
                                                }
                                            )
                                        }

                                    })
                            }
                        )
                    })
            } else {
                const master: MasterModel = await Master.findOne({where: {id: masterId}})
                const city: CityModel = await City.findOne({where: {id: cityId}})
                let arr = []
                for (let i = 0; i < clockSize; i++) {
                    arr.push(i)
                }
                const timeReservation = (cs: number): Promise<Date> => {
                    return new Promise((resolve, reject) => {
                        const newDateTime: Date = new Date(new Date(dateTime).getTime() + 3600000 * cs)
                        MasterBusyDate.findOne({where: {masterId, dateTime: String(newDateTime)}})
                            .then((dt: MasterBusyDateModel) => {
                                    if (dt) reject(ApiError.BadRequest("this master is already working at this time"))
                                    resolve(newDateTime)
                                }
                            )

                    })
                }
                let orderDateTime: string
                let newOrder: OrderModel
                let count = 0
                Promise.all(arr.map(cs => timeReservation(cs)))
                    .then(results => {
                            results.map(newDateTime => {
                                    const dt = newDateTime.toISOString()
                                    MasterBusyDate.create({masterId, dateTime: dt})
                                        .then(() => {
                                            if (count === 0) {
                                                new Promise(() => {
                                                        count++
                                                        const dt = new Date(dateTime).toISOString()
                                                        MasterBusyDate.findOne({where: {masterId, dateTime: dt}})
                                                            .then((mbd: MasterBusyDateModel) => {
                                                                    orderDateTime = mbd.dateTime
                                                                    return new Promise(() => {
                                                                            Order.create({
                                                                                email: email,
                                                                                userId: user.id,
                                                                                clockSize,
                                                                                masterBusyDateId: mbd.id,
                                                                                cityId,
                                                                                originalCityName: city.cityName,
                                                                                status: STATUSES.Approval,
                                                                                masterId: master.id,
                                                                                dealPrice: city.price
                                                                            }).then((result: OrderModel) => {
                                                                                    return new Promise(() => {
                                                                                        newOrder = result
                                                                                        mail.sendMail(email, master.name, orderDateTime, clockSize)
                                                                                            .then(() => res.status(201).json(newOrder))
                                                                                    })
                                                                                }
                                                                            )
                                                                        }
                                                                    )
                                                                }
                                                            )
                                                    }
                                                )
                                            }

                                        })
                                }
                            )
                        }
                    )
            }
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(e))
        }
    }

    async getAllOrders(req: CustomRequest<null, null, GetAllOrders, null>, res: Response, next: NextFunction) {
        try {
            let {limit, offset, masterId, userId} = req.query
            if (limit && +limit > 50) limit = '50'
            if (!offset) offset = '0'
            let where
            if (userId) where = {'userId': +userId}
            else if (masterId) where = {'masterId': +masterId}

            const options: any = {
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
            const orders: OrderModel = await Order.findAndCountAll(options)
            res.status(200).json(orders)
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    /*async getOneOrder(req: CustomRequest<null, GetOneOrderParams, null>, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId
            const order:OrderModel = await Order.findOne({
                    include: {all: true},
                    where: {id: orderId},
                }
            )
            if (!order) return next(ApiError.BadRequest("Order not found"))
            const user:UserModel = await User.findOne({where: {id: order.userId}})
            const master:MasterModel = await Master.findOne({where: {id: order.masterBusyDate.id}})
            const result = new oneOrder(order, user, master)
            res.status(200).json({result})
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }*/

    async deleteOrder(req: CustomRequest<null, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            if (!orderId) next(ApiError.BadRequest("id is not defined"))
            const candidate:OrderModel = await Order.findOne({where: {id: orderId}})
            if (!candidate) next(ApiError.BadRequest(`order with id:${orderId} is not defined`))
            await candidate.destroy()
            res.status(200).json({message: `order with id:${orderId} was deleted`, order: candidate})
        } catch (e) {
            next(ApiError.BadRequest(e))
        }
    }
}

module.exports = new OrderController()