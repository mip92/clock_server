import {
    CreateOrderBody,
    CustomRequest,
    GetAllOrders,
    GetOneOrderParams,
    GetOrderByCity,
    GetOrderByDate
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {UserModel} from "../models/user.model";
import {MasterModel} from "../models/master.model";
import {CityModel} from "../models/city.model";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import {OrderModel} from "../models/order.model";
import zipController from "./zip.controller"
import {Attributes, FindAndCountOptions} from "sequelize";
import {City, dbConfig, Master, MasterBusyDate, Order, OrderPicture, Picture, Rating, STATUSES, User} from "../models";
import excel from "./excel.controller";
import mail from "../services/mailServiсe";
import {v4 as uuidv4} from 'uuid';
import bcrypt from 'bcrypt';
import ApiError from '../exeptions/api-error';
import {Op} from 'sequelize';
import {OrderPictureModel} from "../models/orderPicture.model";
import {PictureModel} from "../models/picture.model";
import {MyDataSet} from "../classes/MyDataSet";
import {MyDate} from "../classes/MyDate";
import {CircleDataSet} from "../classes/CircleDaraSets";
import {CircleDate} from "../classes/CircleDate";
import {RatingModel} from "../models/rating.model";

export interface OrderPictureWithPicture extends OrderPictureModel {
    picture: PictureModel
}

export interface OrderModelWithOrderPictureAndPicture extends OrderModel {
    orderPictures: OrderPictureWithPicture[]
}

export interface OrderModelWithMasterBusyDateAndUsers extends OrderModelWithMasterBusyDate {
    user: UserModel
}

export interface OrderModelWithMasterBusyDate extends OrderModel {
    master_busyDate: MasterBusyDateModel
}

type maxMinParam = {
    masterId: string
}

type orderIdParam = {
    orderId: string
}

class OrderController {
    async createOrder(req: CustomRequest<CreateOrderBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {cityId, clockSize, dateTime, email, masterId, name} = req.body
            let user: UserModel | null = await User.findOne({where: {email}})
            if (!user) {
                const password: string = uuidv4();
                const hashPassword: string = await bcrypt.hash(password.slice(0, 6), 5)
                const activationLink: string = uuidv4();
                user = await User.create({
                    password: hashPassword,
                    email,
                    role: "USER",
                    name,
                    activationLink,
                })
                const master: MasterModel | null = await Master.findOne({where: {id: masterId}})
                const city: CityModel | null = await City.findOne({where: {id: cityId}})
                const arrayOfClockSize = Array.from({length: clockSize}, (_, i) => i + 1)
                const timeReservation = (cs: number): Promise<Date> => {
                    return new Promise((resolve, reject) => {
                        const newDateTime: Date = new Date(new Date(dateTime).getTime() + 3600000 * cs)
                        MasterBusyDate.findOne({where: {masterId, dateTime: String(newDateTime)}})
                            .then((dt: MasterBusyDateModel | null) => {
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
                                                        .then((mbd: MasterBusyDateModel | null) => {
                                                                if (mbd) orderDateTime = mbd.dateTime
                                                                if (user && user.id && email && master && city && mbd) {
                                                                    return new Promise(() => {

                                                                            Order.create({
                                                                                // @ts-ignore
                                                                                userId: user.id, email: email,
                                                                                clockSize,
                                                                                masterBusyDateId: mbd.id,
                                                                                cityId,
                                                                                originalCityName: city.cityName,
                                                                                status: String(STATUSES.Approval),
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
                const master: MasterModel | null = await Master.findOne({where: {id: masterId}})
                const city: CityModel | null = await City.findOne({where: {id: cityId}})
                const arrayOfClockSize = Array.from({length: clockSize}, (_, i) => i + 1)
                const timeReservation = (cs: number): Promise<Date> => {
                    return new Promise((resolve, reject) => {
                        const newDateTime: Date = new Date(new Date(dateTime).getTime() + 3600000 * cs)
                        MasterBusyDate.findOne({where: {masterId, dateTime: String(newDateTime)}})
                            .then((dt: MasterBusyDateModel | null) => {
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
                                                        MasterBusyDate.findOne({where: {masterId, dateTime: dt}})
                                                            .then((mbd: MasterBusyDateModel | null) => {
                                                                    if (mbd) orderDateTime = mbd.dateTime
                                                                    if (user && user.id && email && master && city && mbd) {
                                                                        return new Promise(() => {

                                                                                Order.create({
                                                                                    // @ts-ignore
                                                                                    email: email, userId: user.id,
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

    async findMaxAndMinPrice(req: CustomRequest<null, maxMinParam, null, null>, res: Response, next: NextFunction) {

        try {
            const options: Omit<FindAndCountOptions<Attributes<OrderModel>>, "group"> = {};
            const {masterId} = req.params
            options.where = {}
            options.attributes = [
                [dbConfig.fn('min', dbConfig.col('dealPrice')), 'minDealPrice'],
                [dbConfig.fn('max', dbConfig.col('dealPrice')), 'maxDealPrice'],
                [dbConfig.fn('min', dbConfig.col('totalPrice')), 'minTotalPrice'],
                [dbConfig.fn('max', dbConfig.col('totalPrice')), 'maxTotalPrice']
            ]

            if (masterId && masterId !== 'all') {
                // @ts-ignore
                options.where = {masterId}
            }
            const range = await Order.findAll(options);
            res.status(200).json(range[0])
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async getAllOrders(req: CustomRequest<null, null, GetAllOrders, null>, res: Response, next: NextFunction) {
        try {
            const {
                limit, offset, masterId, userId, cities, sortBy, select,
                filterMaster, filterUser, minDealPrice, maxDealPrice, minTotalPrice,
                maxTotalPrice, dateStart, dateFinish, clockSize, status
            } = req.query;
            const totalPrice: OrderModel[] = await Order.findAll({where: {totalPrice: null}})

            const addTotalPrice = (order: OrderModel): Promise<OrderModel> => {
                return new Promise((resolve, reject) => {
                        const tp: number = Number(order.clockSize) * Number(order.dealPrice)
                        order.update({totalPrice: tp}).then((result: OrderModel) => {
                            resolve(result)
                        }).catch((error: Error) => {
                            reject(error)
                        })
                    }
                )
            }
            if (totalPrice) Promise.all(totalPrice.map(order => addTotalPrice(order)))

            const options: Omit<FindAndCountOptions<Partial<OrderModel>>, "group"> = {};
            options.where = {}
            if (limit && +limit > 50) options.limit = 50;
            else if (limit) options.limit = +limit
            if (!offset) options.offset = 0;
            else options.offset = +offset;
            options.include = []
            if (cities) {
                const citiesID: "" | string[] | undefined = cities && cities.split(',');
                options.include = [{
                    where: {id: citiesID},
                    model: City,
                    required: true,
                }]
            } else {
                options.include = [
                    {model: City},
                ];
            }
            if (clockSize) {
                const clock: "" | string[] = clockSize && clockSize.split(',');
                const result: string[] = []
                if (clock != "") clock.map((c: string | '') => {
                    result.push(c)
                })
                options.where.clockSize = {[Op.or]: result}
            }
            if (status) {
                const statuses: "" | string[] = status && status.split(',');
                const result: string[] = []
                if (statuses != "") statuses.map((c: string | '') => {
                    result.push(c)
                })
                options.where.status = {[Op.or]: result}
            }
            if (minDealPrice && maxDealPrice) {
                options.where.dealPrice = {[Op.between]: [minDealPrice, maxDealPrice]}
            }
            if (minTotalPrice && maxTotalPrice) {
                options.where.totalPrice = {[Op.between]: [minTotalPrice, maxTotalPrice]}
            }
            if (dateStart && dateStart !== 'null' && dateFinish && dateFinish !== 'null') {
                options.include.push({
                    model: MasterBusyDate,
                    where: {dateTime: {[Op.between]: [new Date(dateStart), new Date(dateFinish)]}}
                })
            } else {
                options.include.push({model: MasterBusyDate})
            }
            if (userId && masterId) {
                options.include = [...options.include,
                    {model: Master, where: {id: masterId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, where: {id: userId}, attributes: {exclude: ['password', 'activationLink']}},
                ]
            } else if (userId) {
                options.include = [...options.include,
                    {model: User, where: {id: userId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}},
                ];
            } else if (masterId) {
                const masterID: "" | string[] | undefined = masterId && masterId.split(',');
                options.include = [...options.include,
                    {model: Master, where: {id: masterID}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, attributes: {exclude: ['password', 'activationLink']}},
                ];
            } else {
                options.include = [...options.include,
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, attributes: {exclude: ['password', 'activationLink']}},
                ]
            }
            if ((filterMaster !== '') && (filterMaster !== null) && (filterMaster != undefined) && filterMaster) {
                const option = options.include.filter((o) => {
                    // @ts-ignore
                    return o.model == Master
                });
                // @ts-ignore
                option[0].where = {[Op.or]: [{name: {[Op.iLike]: `%${filterMaster}%`}}, {email: {[Op.iLike]: `%${filterMaster}%`}}]}
            }
            if (filterUser) {
                // @ts-ignore
                const user = options && options.include && options.include.find(o => o.model == User)
                if (user) { // @ts-ignore
                    user.where = {[Op.or]: [{name: {[Op.iLike]: `%${filterUser}%`}}, {email: {[Op.iLike]: `%${filterUser}%`}}]}
                }
            }
            if (sortBy && select) {
                switch (sortBy) {
                    case "date time":
                        options.order = [[MasterBusyDate, 'dateTime', select]];
                        break;
                    case "master email":
                        options.order = [[Master, 'email', select]];
                        break;
                    case "master name":
                        options.order = [[Master, 'name', select]];
                        break;
                    case "user email":
                        options.order = [[User, 'email', select]]
                        break;
                    case "user name":
                        options.order = [[User, 'name', select]];
                        break;
                    case "city":
                        options.order = [['originalCityName', select]];
                        break;
                    case "clock size":
                        options.order = [["clockSize", select]];
                        break;
                    case "deal price":
                        options.order = [["dealPrice", select]];
                        break;
                    case "total price":
                        options.order = [["totalPrice", select]];
                        break;
                    case "status":
                        options.order = [[sortBy, select]];
                        break;
                }
            }
            options.include = [...options.include, {model: OrderPicture, separate: true, include: [{model: Picture}]}]
            const orders: { rows: OrderModel[]; count: number; } = await Order.findAndCountAll(options)
            res.status(200).json(orders)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getExcel(req: CustomRequest<null, null, GetAllOrders, null>, res: Response, next: NextFunction) {
        try {
            const {
                limit, offset, masterId, userId, cities, sortBy, select,
                filterMaster, filterUser, minDealPrice, maxDealPrice, minTotalPrice,
                maxTotalPrice, dateStart, dateFinish, clockSize, status
            } = req.query;
            const options: Omit<FindAndCountOptions<Attributes<OrderModelWithMasterBusyDateAndUsers>>, "group"> = {};
            options.where = {}
            options.include = []
            if (cities) {
                const citiesID: "" | string[] | undefined = cities && cities.split(',');
                options.include = [{
                    where: {id: citiesID},
                    model: City,
                    required: true
                }]
            } else {
                options.include = [
                    {model: City},
                ];
            }
            if (clockSize) {

                const clock: "" | string[] = clockSize && clockSize.split(',');
                const result: string[] = []
                if (clock !== "") clock.map((c: string | '') => {
                    result.push(c)
                })
                options.where.clockSize = {[Op.or]: result}
            }
            if (status) {

                const statuses: "" | string[] = status && status.split(',');
                const result: string[] = []
                if (statuses !== "") statuses.map((c: string | '') => {
                    result.push(c)
                })
                options.where.status = {[Op.or]: result}
            }
            if (minDealPrice && maxDealPrice) {
                options.where.dealPrice = {[Op.between]: [minDealPrice, maxDealPrice]}
            }
            if (minTotalPrice && maxTotalPrice) {
                options.where.totalPrice = {[Op.between]: [minTotalPrice, maxTotalPrice]}
            }
            if (dateStart && dateStart !== 'null' && dateFinish && dateFinish !== 'null') {
                options.include.push({
                    model: MasterBusyDate,
                    where: {dateTime: {[Op.between]: [new Date(dateStart), new Date(dateFinish)]}}
                })
            } else {
                options.include.push({model: MasterBusyDate})
            }

            if (userId && masterId) {
                options.include = [...options.include,
                    {model: Master, where: {id: masterId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, where: {id: userId}, attributes: {exclude: ['password', 'activationLink']}},
                ]
            } else if (userId) {
                options.include = [...options.include,
                    {model: User, where: {id: userId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}},
                ];
            } else if (masterId) {
                options.include = [...options.include,
                    {model: Master, where: {id: masterId}, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, attributes: {exclude: ['password', 'activationLink']}},
                ];
            } else {
                options.include = [...options.include,
                    {model: Master, attributes: {exclude: ['password', 'activationLink']}},
                    {model: User, attributes: {exclude: ['password', 'activationLink']}},
                ]
            }
            if ((filterMaster !== '') && (filterMaster !== null) && (filterMaster != undefined) && filterMaster) {
                const option = options.include.filter((o) => {
                    // @ts-ignore
                    return o.model === Master
                });
                // @ts-ignore
                option[0].where = {[Op.or]: [{name: {[Op.iLike]: `%${filterMaster}%`}}, {email: {[Op.iLike]: `%${filterMaster}%`}}]}
            }
            if ((filterUser !== '') && (filterUser != undefined) && filterUser) {

                const option = options.include.filter((o) => {
                    // @ts-ignore
                    return o.model == User
                });
                // @ts-ignore
                option[0].where = {[Op.or]: [{name: {[Op.iLike]: `%${filterUser}%`}}, {email: {[Op.iLike]: `%${filterUser}%`}}]}
            }
            if (sortBy && select) {
                switch (sortBy) {
                    case "date time":
                        options.order = [[MasterBusyDate, 'dateTime', select]];
                        break;
                    case "master email":
                        options.order = [[Master, 'email', select]];
                        break;
                    case "master name":
                        options.order = [[Master, 'name', select]];
                        break;
                    case "user email":
                        options.order = [[User, 'email', select]];
                        break;
                    case "user name":
                        options.order = [[User, 'name', select]];
                        break;
                    case "city":
                        options.order = [['originalCityName', select]];
                        break;
                    case "clock size":
                        options.order = [["clockSize", select]];
                        break;
                    case "deal price":
                        options.order = [["dealPrice", select]];
                        break;
                    case "total price":
                        options.order = [["totalPrice", select]];
                        break;
                    case "status":
                        options.order = [[sortBy, select]];
                        break;
                }
            }

            // @ts-ignore
            const orders: OrderModelWithMasterBusyDateAndUsers[] = await Order.findAll(options)
            const {fileName, filePath} = excel.getExcel(orders)
            res.status(200).json(`${process.env.API_URL}/excelFile/${fileName}`)
            setTimeout(async () => {
                await excel.deleteExcel(filePath)
            }, 60000);
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getZip(req: CustomRequest<null, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            const options: Omit<FindAndCountOptions<Partial<OrderModelWithOrderPictureAndPicture>>, "group"> = {};
            options.where = {id: orderId}
            options.include = [{model: OrderPicture, include: [{model: Picture}]}]
            // @ts-ignore
            const order: OrderModelWithOrderPictureAndPicture = await Order.findOne(options)
            if (!order) return next(ApiError.BadRequest("Order not found"))

            const {fileName, filePath, imgPaths} = await zipController.createZip(order.orderPictures)

            res.status(200).json(`${process.env.API_URL}/zipFile/${fileName}`)
            setTimeout(async () => {
                await zipController.deleteZip(filePath, imgPaths)
            }, 60000);
        } catch (e) {
            console.log(e)
        }

    }

    async deleteOrder(req: CustomRequest<null, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            if (!orderId) next(ApiError.BadRequest("id is not defined"))
            const candidate: OrderModel | null = await Order.findOne({where: {id: orderId}})
            if (!candidate) next(ApiError.BadRequest(`order with id:${orderId} is not defined`))
            candidate && await candidate.destroy()
            res.status(200).json({message: `order with id:${orderId} was deleted`, order: candidate})
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getOrdersByDate(req: CustomRequest<null, null, GetOrderByDate, null>, res: Response, next: NextFunction) {
        try {
            const {masterId, cities, dateStart, dateFinish} = req.query;
            let oldestDate: Date
            let newestDate: Date
            if (dateStart === 'null' || dateFinish === 'null' || dateStart === 'undefined' || dateFinish === 'undefined' || !dateStart || !dateFinish) {
                const options: Omit<FindAndCountOptions<Attributes<MasterBusyDateModel>>, "group"> = {};
                options.where = {}
                options.attributes = [
                    [dbConfig.fn('min', dbConfig.col('dateTime')), 'minDateTime'],
                    [dbConfig.fn('max', dbConfig.col('dateTime')), 'maxDateTime'],
                ]
                const oldestNewest = await MasterBusyDate.findAll(options);
                if (!oldestNewest) return next(ApiError.BadRequest(`there are no orders in the database`))
                // @ts-ignore
                oldestDate = new Date(oldestNewest[0].dataValues.minDateTime)
                // @ts-ignore
                newestDate = new Date(oldestNewest[0].dataValues.maxDateTime)
                oldestDate.setHours(0)
                const newestDay = newestDate.getDate()
                newestDate.setHours(newestDay + 1)
            } else {
                oldestDate = new Date(dateStart)
                newestDate = new Date(dateFinish)
                oldestDate.setHours(0)
                oldestDate.setMinutes(0)
                oldestDate.setSeconds(0)
                newestDate.setHours(24)
                newestDate.setMinutes(0)
                newestDate.setSeconds(0)
            }
            const options: Omit<FindAndCountOptions<Attributes<MasterModel>>, "group"> = {};
            options.where = {}
            const masterIds = masterId.split(',')
            const cityIds = cities.split(',')
            if (masterId && masterId !== '') options.where.id = masterIds
            let masters = await Master.findAll(options)
            let dates: string[] = []
            //i don't know how to create array if i have date range
            for (let i = oldestDate, count = 0; i < newestDate; count++, oldestDate.setHours(24)) {
                dates.push(new Date(oldestDate).toISOString())
            }
            const date = new MyDate<MyDataSet>(dates)

            Promise.all(masters.map(master => this.getCountByRange(master, dates, cityIds)))
                .then((results) => {
                        results.map((myDataSet, key) => {
                            date.setDatasets(myDataSet)
                            if (key + 1 === masters.length) {
                                res.status(200).json(date)
                            }
                        })
                    }
                )

        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    getCountByRange(master: MasterModel, dates: string[], cityIds: string[]): Promise<MyDataSet> {
        return new Promise((resolve, reject) => {
                const myDataSet = new MyDataSet(master.email)
                return Promise.all(dates.map(date => this.getCountByDay(master.id, new Date(date), cityIds)))
                    .then(results => {
                            results.map((masterDay, key) => {
                                myDataSet.setData(masterDay.orders)
                                if (dates.length - 1 === key) {
                                    resolve(myDataSet)
                                }
                            })
                        }
                    )

            }
        )
    }

    getCountByDay(masterId: number, day: Date, cityIds: string[]): Promise<{ orders: number, masterId: number, day: Date }> {
        return new Promise((resolve, reject) => {
                const dayEnd = new Date(day)
                dayEnd.setHours(24)
                const options: Omit<FindAndCountOptions<Attributes<OrderModel>>, "group"> = {};
                options.include = []
                if (cityIds && cityIds[0]) {
                    options.where = {cityId: cityIds}
                }
                options.include = {
                    model: MasterBusyDate,
                    where: {dateTime: {[Op.between]: [day.toISOString(), dayEnd.toISOString()]}, masterId}
                }
                Order.count(options).then((orders) => {
                        resolve({orders, masterId, day})
                    }
                )

            }
        )
    }

    async getOrdersByCities(req: CustomRequest<null, null, GetOrderByCity, null>, res: Response, next: NextFunction) {
        try {
            const {dateFinish, dateStart} = req.query
            let oldestDate: Date
            let newestDate: Date
            if (dateStart === 'null' || dateFinish === 'null' || dateStart === 'undefined' || dateFinish === 'undefined' || !dateStart || !dateFinish) {
                const options: Omit<FindAndCountOptions<Attributes<MasterBusyDateModel>>, "group"> = {};
                options.where = {}
                options.attributes = [
                    [dbConfig.fn('min', dbConfig.col('dateTime')), 'minDateTime'],
                    [dbConfig.fn('max', dbConfig.col('dateTime')), 'maxDateTime'],
                ]
                const oldestNewest = await MasterBusyDate.findAll(options);
                if (!oldestNewest) return next(ApiError.BadRequest(`there are no orders in the database`))
                // @ts-ignore
                oldestDate = new Date(oldestNewest[0].dataValues.minDateTime)
                // @ts-ignore
                newestDate = new Date(oldestNewest[0].dataValues.maxDateTime)
                oldestDate.setHours(0)
                const newestDay = newestDate.getDate()
                newestDate.setHours(newestDay + 1)
            } else {
                oldestDate = new Date(dateStart)
                newestDate = new Date(dateFinish)
                oldestDate.setDate(oldestDate.getDate()-1)
                oldestDate.setHours(0)
                oldestDate.setMinutes(0)
                oldestDate.setSeconds(0)
                newestDate.setHours(24)
                newestDate.setMinutes(0)
                newestDate.setSeconds(0)
            }
            const getOrdersByCity = (city: CityModel): Promise<number> => {
                return new Promise((resolve, reject) => {
                    Order.findAll({
                        where: {cityId: city.id},
                        include: [{model: MasterBusyDate, where: {dateTime: {[Op.between]: [oldestDate, newestDate]}}}]
                    }).then((count: OrderModel[]) => {
                        resolve(count.length)
                    })
                })
            }
            City.findAll().then((cities) => {
                const cityNames = cities.map((city) => city.cityName)
                const circleDate = new CircleDate<CircleDataSet>(cityNames)
                const dataSet = new CircleDataSet('# of Votes', cities.length)
                Promise.all(cities.map(city => getOrdersByCity(city)))
                    .then((results) => {
                            results.map((count, key) => {
                                dataSet.setData(count)
                                if (key + 1 === cities.length) {
                                    circleDate.setDatasets(dataSet)
                                    res.status(200).send(circleDate)
                                }
                            })
                        }
                    )
            })
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async getRatingByMaster(req: CustomRequest<null, null, GetOrderByCity, null>, res: Response, next: NextFunction) {
        try {
            const {dateFinish, dateStart} = req.query
            let oldestDate: Date
            let newestDate: Date
            if (dateStart === 'null' || dateFinish === 'null' || dateStart === 'undefined' || dateFinish === 'undefined' || !dateStart || !dateFinish) {
                const options: Omit<FindAndCountOptions<Attributes<MasterBusyDateModel>>, "group"> = {};
                options.where = {}
                options.attributes = [
                    [dbConfig.fn('min', dbConfig.col('dateTime')), 'minDateTime'],
                    [dbConfig.fn('max', dbConfig.col('dateTime')), 'maxDateTime'],
                ]
                const oldestNewest = await MasterBusyDate.findAll(options);
                if (!oldestNewest) return next(ApiError.BadRequest(`there are no orders in the database`))
                // @ts-ignore
                oldestDate = new Date(oldestNewest[0].dataValues.minDateTime)
                // @ts-ignore
                newestDate = new Date(oldestNewest[0].dataValues.maxDateTime)
                oldestDate.setHours(0)
                const newestDay = newestDate.getDate()
                newestDate.setHours(newestDay + 1)
            } else {
                oldestDate = new Date(dateStart)
                newestDate = new Date(dateFinish)
                oldestDate.setDate(oldestDate.getDate()-1)
                oldestDate.setHours(0)
                oldestDate.setMinutes(0)
                oldestDate.setSeconds(0)
                newestDate.setHours(24)
                newestDate.setMinutes(0)
                newestDate.setSeconds(0)
            }
            console.log(oldestDate, newestDate)
            const getRating = (master: MasterModel): Promise<RatingModel[]> => {
                return new Promise((resolve, reject) => {
                    Rating.findAll({
                        where: {
                            masterId: master.id, rating: {[Op.not]: null},
                            updatedAt: {[Op.between]: [oldestDate, newestDate]}
                        }
                    }).then((rating: RatingModel[]) => {
                        if (rating.length === 0) reject("master dont have rating")
                        else {
                            resolve(rating)
                        }
                    })
                })
            }

            class EmailRating {
                email: string
                rating: number

                constructor(email: string, rating: number) {
                    this.email = email
                    this.rating = rating
                }
            }

            let arrayOfMasters: EmailRating[] = []
            Master.findAll().then((masters) => {
                Promise.allSettled(masters.map(master => getRating(master)))
                    .then((results) => {
                            results.map((masterRating, key) => {

                                if (masterRating.status === 'fulfilled') {
                                    let arrayRating: number[] = []
                                    masterRating.value.map((oneValue) => oneValue.rating && arrayRating.push(oneValue.rating))
                                    const sum = arrayRating.reduce((a, b) => a + b, 0);
                                    const average = (Math.ceil((sum / arrayRating.length) * 10) / 10)
                                    const masterClass = new EmailRating(masters[key].email, average)
                                    arrayOfMasters.push(masterClass)
                                }
                                if (key + 1 === masters.length) {
                                    if (arrayOfMasters.length > 3) {
                                        arrayOfMasters.sort((a, b) => b.rating - a.rating);
                                        const dataSet = new CircleDataSet('# of Votes', 4)
                                        const masterNames = arrayOfMasters.map((master) => master.email)
                                        const currentMasterNames = masterNames.slice(0, 3)
                                        currentMasterNames.push('Other')
                                        const circleDate = new CircleDate<CircleDataSet>(currentMasterNames)
                                        let sumOther: number = 0
                                        arrayOfMasters.map((master, key) => {
                                            if (key < 3) dataSet.setData(master.rating)
                                            else sumOther = master.rating + sumOther
                                        })
                                        if (sumOther !== 0) dataSet.setData(Math.ceil((sumOther / (arrayOfMasters.length - 3) * 10) / 10))
                                        circleDate.setDatasets(dataSet)
                                        res.status(200).send(circleDate)
                                    } else {
                                        arrayOfMasters.sort((a, b) => b.rating - a.rating);
                                        const dataSet = new CircleDataSet('# of Votes', arrayOfMasters.length)
                                        const masterNames = arrayOfMasters.map((master) => master.email)
                                        const circleDate = new CircleDate<CircleDataSet>(masterNames)
                                        arrayOfMasters.map((master, key) => {
                                            dataSet.setData(master.rating)
                                        })
                                        circleDate.setDatasets(dataSet)
                                        res.status(200).send(circleDate)
                                    }
                                }
                            })
                        }
                    )
            })
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getStatisticsByMaster(req: CustomRequest<null, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        interface OrderWithMaster extends OrderModel {
            master: MasterModel
        }

        interface MasterStatisticInterface {
            name: string,
            small: number,
            middle: number,
            big: number,
            rating: number | null,
            totalCompleted: number,
            totalNotCompleted: number,
            totalSum: number,
            id: number
        }

        try {
            const getStatisticByOneMaster = (masterId: number): Promise<MasterStatisticInterface> => {
                return new Promise((resolve, reject) => {
                    // @ts-ignore
                    Order.findAll({where: {masterId}, include: [{model: Master}]}).then((orders: OrderWithMaster[]) => {
                        const smallClock = orders.filter((order) => order.clockSize === 1)
                        const middleClock = orders.filter((order) => order.clockSize === 2)
                        const bigClock = orders.length - smallClock.length - middleClock.length
                        const totalCompleted = orders.filter((order) => order.status === STATUSES["Completed"])
                        const totalNotCompleted = orders.length - totalCompleted.length
                        let totalSum = 0
                        totalCompleted.map((order) => {
                            if (order.totalPrice !== null) {
                                totalSum = totalSum + order.totalPrice
                            }
                        })
                        const object: MasterStatisticInterface = {
                            name: orders[0].master.name,
                            small: smallClock.length,
                            middle: middleClock.length,
                            big: bigClock,
                            rating: isNaN(orders[0].master.rating) ? null : orders[0].master.rating,
                            totalCompleted: totalCompleted.length,
                            totalNotCompleted,
                            totalSum,
                            id: Math.random()
                        }
                        resolve(object)
                    })
                })
            }
            Master.findAll().then((masters) => {
                Promise.all(masters.map(master => getStatisticByOneMaster(master.id)))
                    .then(results => res.status(200).json(results))
            })

        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new OrderController()
