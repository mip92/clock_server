import {Response, NextFunction} from 'express';
import {CustomRequest} from "../interfaces/RequestInterfaces";
import {User, Order, MasterBusyDate} from '../models';
import ApiError from '../exeptions/api-error';
import {OrderModel} from "../models/order.model";
import {Op} from "sequelize";


type getMonthParam = {
    masterId?: string
    correctData?: string
}

type getWeekParam = {
    masterId?: string
    correctMonday?: string
}

type monthType = { orders: OrderModel[] | null, date: Date | null, id: number }

class CalendarController {

    async getMonth(req: CustomRequest<null, null, getMonthParam, null>, res: Response, next: NextFunction) {
        try {
            const {masterId, correctData} = req.query
            if (!masterId || !correctData) return next(ApiError.BadRequest("master not found"))
            const date: Date = new Date(correctData)
            date.setHours(0)
            date.setMinutes(0)
            date.setSeconds(0)
            date.setMilliseconds(0)
            const month = date.getMonth()
            const firstDay = date.setDate(1)
            const dayOfWeek = date.getDay()
            const nextMontFistDay = new Date(firstDay).setMonth(month + 1)
            const DaysOfMonth: number = Math.round((+new Date(nextMontFistDay) - +new Date(firstDay)) / 1000 / 3600 / 24);

            const correctMonth = Array.from({length: DaysOfMonth + dayOfWeek}, (v, k) => {
                if (k < dayOfWeek) {
                    return 0
                } else return k++ - dayOfWeek + 1
            });
            const getOrdersByDay = (day: number): Promise<OrderModel[] | null> => {
                let startDayOfMonth: Date | null = date
                if (day === 0) startDayOfMonth = null
                startDayOfMonth?.setDate(day)
                let endDayOfMonth: Date | null
                endDayOfMonth = startDayOfMonth && new Date(date)
                endDayOfMonth && startDayOfMonth && endDayOfMonth.setDate(startDayOfMonth.getDate() + 1)
                return new Promise((resolve, reject) => {
                        if (endDayOfMonth === null) resolve(null)
                        else
                            Order.findAll({
                                attributes: {exclude: ['cityId', 'createdAt', 'dealPrice', 'masterId', 'originalCityName', 'totalPrice', 'updatedAt', 'masterBusyDateId', 'userId']},
                                include: [{
                                    model: MasterBusyDate,
                                    attributes: {exclude: ['createdAt', 'id', 'masterId', 'updatedAt']},
                                    where: {
                                        masterId,
                                        dateTime: {[Op.between]: [startDayOfMonth?.toISOString(), endDayOfMonth.toISOString()]}
                                    }
                                }, {
                                    model: User,
                                    attributes: {exclude: ['createdAt', 'id', 'updatedAt', 'password', 'role', 'isActivated', 'email', 'activationLink']},
                                }]
                            }).then((orders) => {
                                resolve(orders)
                            })
                    }
                )
            }
            Promise.all(correctMonth.map(day => getOrdersByDay(day))).then((results) => {
                let month: monthType[] = results.map((oneDay, key) => {
                    const myDate = oneDay === null ? null : date.setDate(correctMonth[key])
                    return {orders: oneDay, date: myDate ? new Date(myDate) : null, id: key + 1}
                })

                res.status(200).json(month)
            })
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getWeek(req: CustomRequest<null, null, getWeekParam, null>, res: Response, next: NextFunction) {
        try {
            const {masterId, correctMonday} = req.query
            if (!masterId || !correctMonday) return next(ApiError.BadRequest("master not found"))
            const monday = new Date(correctMonday)
            monday.setHours(0)
            monday.setMinutes(0)
            monday.setSeconds(0)
            monday.setMilliseconds(0)
            const week = Array.from({length: 7}, (v, k) => {
                return k++
            });

            const getOrdersByDay = (day: number): Promise<OrderModel[] | null> => {

                let start: Date = new Date(monday)
                start.setDate(start.getDate() + day)
                let finish = new Date(start)
                finish.setDate(finish.getDate() + 1)
                return new Promise((resolve, reject) => {
                        Order.findAll({
                            attributes: {exclude: ['cityId', 'createdAt', 'dealPrice', 'masterId', 'originalCityName', 'totalPrice', 'updatedAt', 'masterBusyDateId', 'userId']},
                            include: [{
                                model: MasterBusyDate,
                                attributes: {exclude: ['createdAt', 'id', 'masterId', 'updatedAt']},
                                where: {
                                    masterId,
                                    dateTime: {[Op.between]: [start.toISOString(), finish.toISOString()]}
                                }
                            }, {
                                model: User,
                                attributes: {exclude: ['createdAt', 'id', 'updatedAt', 'password', 'role', 'isActivated', 'email', 'activationLink']},
                            }]
                        }).then((orders) => {
                            resolve(orders)
                        })
                    }
                )
            }
            Promise.all(week.map(day => getOrdersByDay(day))).then((results) => {
                let month: monthType[] = results.map((oneDay, key) => {
                    const date = new Date(monday)
                    const correctDay = date.getDate() + key
                    return {orders: oneDay, date: new Date(date.setDate(correctDay)), id: key + 1}
                })
                res.status(200).json(month)
            })
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new CalendarController()