import {Response, NextFunction} from 'express';
import {UserModel} from "../models/user.model";
import {MasterModel} from "../models/master.model";
import {AdminModel} from "../models/admin.model";
import {AuthRegistrationBody, CustomRequest, Link, LoginBody} from "../interfaces/RequestInterfaces";
import {Master, User, Admin, Order, MasterBusyDate} from '../models';
import userController from "./user.controller";
import masterController from "./master.controller";
import bcrypt from 'bcrypt';
import ApiError from '../exeptions/api-error';
import tokenService from '../services/tokenServiсe';
import {OrderModel} from "../models/order.model";

class CalendarController {
    async getMonth(req: CustomRequest<LoginBody, null, null, null>, res: Response, next: NextFunction) {
        try {
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
            const getOrdersByDay = (day: number): Promise<OrderModel[]> => {
                let dayOfMonth: Date | null = date
                if (day === 0) dayOfMonth = null
                dayOfMonth?.setDate(day)
                let endDayOfMonth: Date | null  = date
                if (day === 0) endDayOfMonth = null
                const nextday=day+1
                console.log(nextday)
                endDayOfMonth?.setDate(nextday)
                   // =dayOfMonth && new Date(+dayOfMonth?.setDate(day+1))
                console.log(dayOfMonth, endDayOfMonth)
                return new Promise((resolve, reject) => {
                        Order.findAll({
                            where: {masterId: 4},
                            include: [{model: MasterBusyDate, where: {dateTime:dayOfMonth}}]
                        }).then((result)=>resolve(result))
                    }
                )
            }
            Promise.all(correctMonth.map(day => getOrdersByDay(day))).then((result)=>{
                console.log(result)
            })
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new CalendarController()