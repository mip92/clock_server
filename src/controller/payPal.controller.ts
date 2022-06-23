import {CreatePayPalOrderBody, CustomRequest, GetOneOrderParams} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";
import {Master, MasterBusyDate, Order, STATUSES, User} from '../models';
import ApiError from '../exeptions/api-error';
import pdfService from "../services/pdfService";
import fs from "fs";
import mail from "../services/mailServiсe";
import {UserModel} from "../models/user.model";
import {MasterModel} from "../models/master.model";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import {v4 as uuidv4} from "uuid";
import bcrypt from "bcrypt";


class PayPalController {
    async createPayPalOrder(req: CustomRequest<CreatePayPalOrderBody, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {payPalOrderId} = req.body
            const {orderId} = req.params
            const order: OrderModel | null = await Order.findOne({where: {id: orderId},})
            if (!order) next(ApiError.BadRequest(`order with id:${orderId} is not defined`))
            order && await order.update({payPalOrderId: payPalOrderId, status: STATUSES.AwaitingPayment})
            res.status(200).json({message: `payPal order was created`})
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async orderHasBeenPaid(req: CustomRequest<any, null, null, null>, res: Response, next: NextFunction) {
        try {
            interface OrderModelWithUser extends OrderModel {
                user: UserModel
                master: MasterModel
                master_busyDate: MasterBusyDateModel
            }

            const payPalOrderId = req.body.resource.supplementary_data.related_ids.order_id
            //@ts-ignore
            const order: OrderModelWithUser | null = await Order.findOne({
                where: {payPalOrderId},
                include: [{model: User}, {model: Master}, {model: MasterBusyDate}]
            })

            const user = order && await User.findOne({where: {id: order.user.id}})
            if (!user) return
            if (user.password == 'tempPassword') {
                order.update({status: STATUSES.Confirmed}).then((order: OrderModelWithUser) => {
                    const password: string = uuidv4();
                    bcrypt.hash(password.slice(0, 6), 5).then((hashPassword: string) => {
                        user?.update({password: hashPassword}).then(() => {
                            mail.sendMailToNewUser(order.user.email, order.master.name, order.master_busyDate.dateTime, order.clockSize, password.slice(0, 6), order.user.activationLink)
                        })
                    })
                })
            }else{
                order.update({status: STATUSES.Confirmed}).then((order: OrderModelWithUser) => {
                    mail.sendMail(order.user.email, order.master.name, order.master_busyDate.dateTime, order.clockSize)
                })
            }
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getPdf(req: CustomRequest<any, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            console.log(orderId)
            await pdfService.createPdf(+orderId, next, res)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

export default new PayPalController()
