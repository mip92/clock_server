import {CreateOrderBody, CustomRequest, GetAllOrders, GetOneOrderParams} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {UserModel} from "../models/user.model";
import {MasterModel} from "../models/master.model";
import {CityModel} from "../models/city.model";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import {OrderModel} from "../models/order.model";
import Model, {Attributes, FindAndCountOptions} from "sequelize";
import Sequelize from "sequelize";
import {dbConfig} from "../models";

const ApiError = require('../exeptions/api-error')
const {Order, Master, User, City, MasterBusyDate, STATUSES} = require('../models');
const mail = require("../services/mailServiсe");
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const Op = require('Sequelize').Op;

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
                const arrayOfClockSize = Array.from({length: clockSize}, (_, i) => i + 1)
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
                Promise.all(arrayOfClockSize.map(cs => timeReservation(cs)))
                    .then(results => {
                        results.map(newDateTime => {
                                const dt = newDateTime.toISOString()
                                MasterBusyDate.create({masterId, dateTime: dt})
                                    .then(() => {
                                        if (count === 0) {
                                            new Promise(() => {
                                                    count++
                                                    //const dt = new Date(dateTime).toISOString()
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
                const arrayOfClockSize = Array.from({length: clockSize}, (_, i) => i + 1)
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
                Promise.all(arrayOfClockSize.map(cs => timeReservation(cs)))
                    .then(results => {
                            results.map(newDateTime => {
                                    const dt = newDateTime.toISOString()
                                    MasterBusyDate.create({masterId, dateTime: dt})
                                        .then(() => {
                                            if (count === 0) {
                                                new Promise(() => {
                                                        count++
                                                        //const dt = new Date(dateTime).toISOString()
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
            next(ApiError.Internal(`server error`))
        }
    }

    async getAllOrders(req: CustomRequest<null, null, GetAllOrders, null>, res: Response, next: NextFunction) {
        try {
            const {limit, offset, masterId, userId, cities, sortBy, select, filter} = req.query;
            const options: Omit<FindAndCountOptions<Attributes<typeof Order>>, "group"> = {};

            if (limit && +limit > 50) options.limit = 50;
            if (!offset) options.offset = 0;
            options.include = [
                {model: City},
                {model: MasterBusyDate}
            ];
            options.where = {}
            if ((filter !== '') && (filter != undefined) && filter) options.where[Op.or] = [
                {Master, name: {[Op.iLike]: `%${filter}%`}}, {Master, email: {[Op.iLike]: `%${filter}%`}}]
         /*   // @ts-ignore
            options.include[1].order;
            console.log(options.include);
            // @ts-ignore
            const option = options.include.filter((o)=>{return o.model==MasterBusyDate});
            // @ts-ignore
            console.log(option[0]);*/


            if (userId && masterId) {
                options.include = [...options.include,
                    {model: Master, where: {id: masterId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, where: {id: userId}, attributes: {exclude: ['password', 'activationLink']}},
                ]
                options.where = {'userId': +userId, 'masterId': +masterId}
            } else if (userId) {
                options.include = [...options.include,
                    {model: User, where: {id: userId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}},
                ];
                options.where = {'userId': +userId}
            } else if (masterId) {
                options.include = [...options.include,
                    {model: Master, where: {id: masterId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, attributes: {exclude: ['password', 'activationLink']}},
                ];
                options.where = {'masterId': +masterId}
            } else {
                options.include = [...options.include,
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, attributes: {exclude: ['password', 'activationLink']}},
                ]
            }
            if (sortBy && select) {
                switch (sortBy) {
                    case "dateTime": options.order = [[MasterBusyDate, 'dateTime', select]];
                        break;
                    case "masterEmail": options.order = [[Master, 'email', select]];
                        break;
                    case "masterName": options.order = [[Master, 'name', select]];
                        break;
                    case "userEmail": options.order = [[User, 'email', select]];
                        break;
                    case "userName": options.order = [[User, 'name', select]];
                        break;
                    case "city": options.order = [['originalCityName', select]];
                        break;
                    case "clockSize": options.order = [["clockSize", select]];
                        break;
                    case "dealPrice": options.order = [["dealPrice", select]];
                        break;
                    case "totalPrice": {
                        options.attributes =  [dbConfig.fn('sum',dbConfig.col('dealPrice'), dbConfig.col('clockSize')), 'total'],
                            //options.group = ['SaleItem.itemId'],
                            options.raw = true,
                            options.order = dbConfig.literal('total DESC')
                        //options.order = [[[sequelize.fn('min', sequelize.col('price')), 'minPrice'], select]];
                    }
                        break;
                    case "status": options.order = [[sortBy, select]];
                        break;
                }
                //options.order = [[sortBy, select]]
            }
            console.log(options)
            const orders: OrderModel = await Order.findAndCountAll(options)
            res.status(200).json(orders)
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
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
            const candidate: OrderModel = await Order.findOne({where: {id: orderId}})
            if (!candidate) next(ApiError.BadRequest(`order with id:${orderId} is not defined`))
            await candidate.destroy()
            res.status(200).json({message: `order with id:${orderId} was deleted`, order: candidate})
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new OrderController()