import {Response, NextFunction} from 'express';
import {CustomRequest} from "../interfaces/RequestInterfaces";
import {User, Order, MasterBusyDate} from '../models';
import ApiError from '../exeptions/api-error';
import {OrderModel} from "../models/order.model";
import {Op} from "sequelize";

type masterIdParam = {
    masterId?: string
}

class CalendarController {
    async getMonth(req: CustomRequest<null, masterIdParam, null, null>, res: Response, next: NextFunction) {
        try {
            const {masterId} = req.params
            console.log(masterId)
            if(!masterId) return next(ApiError.BadRequest("master not found"))
            const date: Date = new Date(Date.now())
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
                console.log(startDayOfMonth, endDayOfMonth, day)
                return new Promise((resolve, reject) => {
                        if (endDayOfMonth === null) resolve(null)
                        else
                            Order.findAll({
                                attributes: {exclude: ['cityId','createdAt','dealPrice','masterId','originalCityName','totalPrice', 'updatedAt','masterBusyDateId', 'userId']},
                                include: [{
                                    model: MasterBusyDate,
                                    attributes: {exclude: ['createdAt','id','masterId','updatedAt']},
                                    where: {
                                        masterId,
                                        dateTime: {[Op.between]: [startDayOfMonth?.toISOString(), endDayOfMonth.toISOString()]}
                                    }
                                },{
                                    model: User,
                                    attributes: {exclude: ['createdAt','id','updatedAt','password', 'role', 'isActivated','email','activationLink']},
                                }]
                            }).then((orders) => {
                                resolve(orders)
                            })
                    }
                )
            }
            Promise.all(correctMonth.map(day => getOrdersByDay(day))).then((results) => {
                res.json(results)
            })
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new CalendarController()