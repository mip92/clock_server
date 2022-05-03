import {CustomRequest} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";

const ApiError = require('../exeptions/api-error')
const paypal = require('paypal-rest-sdk');
const {Order, MasterBusyDate}= require('../models');
interface link{
    href:string,
    rel:string,
    method:string
}

class PayPallController {
    async createOrder(req: CustomRequest<any, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.body

            interface OrderModelWithMasterBusyDate extends OrderModel {
                dataValues: MasterBusyDateModel
            }
            const order: OrderModelWithMasterBusyDate = await Order.findOne({
                where: {id: orderId},
                include: [
                    {model: MasterBusyDate}
                ]
            })
            const dateTime = new Date(order.dataValues.dateTime)
            const year = dateTime.getFullYear()
            const month = dateTime.getMonth() + 1
            const day = dateTime.getDate()
            const hours = dateTime.getHours()
            paypal.configure({
                'mode': 'sandbox', //sandbox or live
                'client_id': 'AXvKO3_qp7ZCX8bdjfD7gPtAqfmBocAY427xVIEVjxNgDjl4ymEmz0YHEMtTbN5cxiyAqHB21GTPAFLj',
                'client_secret': 'EGndotn4FjYJa6lRWaKMLKm-B3eO8tnxP0Aa5Onbd0IzmT_DQIlS5WVk9_hg2vvcK7xcGM0otNe3gILd'
            });
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "watch repair",
                            "price": order.dealPrice,
                            "currency": "USD",
                            "quantity": order.clockSize
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": order.dealPrice * order.clockSize
                    },
                    "description": `watch repair in the ${order.originalCityName} city on ${year}.${month}.${day} at ${hours}:00`
                }]
            };
            paypal.payment.create(create_payment_json, function (error:Error, payment:any) {
                if (error) {
                    throw error;
                } else {
                    console.log(payment)
                    const approvalUrl =payment.links.find((link: link) => link.rel==='approval_url');
                    return res.status(200).json(approvalUrl.href)
                }
            });
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
    async paid(req: CustomRequest<any, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.body

            interface OrderModelWithMasterBusyDate extends OrderModel {
                dataValues: MasterBusyDateModel
            }
            const order: OrderModelWithMasterBusyDate = await Order.findOne({
                where: {id: orderId},
                include: [
                    {model: MasterBusyDate}
                ]
            })
            const dateTime = new Date(order.dataValues.dateTime)
            const year = dateTime.getFullYear()
            const month = dateTime.getMonth() + 1
            const day = dateTime.getDate()
            const hours = dateTime.getHours()
            paypal.configure({
                'mode': 'sandbox', //sandbox or live
                'client_id': 'AXvKO3_qp7ZCX8bdjfD7gPtAqfmBocAY427xVIEVjxNgDjl4ymEmz0YHEMtTbN5cxiyAqHB21GTPAFLj',
                'client_secret': 'EGndotn4FjYJa6lRWaKMLKm-B3eO8tnxP0Aa5Onbd0IzmT_DQIlS5WVk9_hg2vvcK7xcGM0otNe3gILd'
            });
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "watch repair",
                            "price": order.dealPrice,
                            "currency": "USD",
                            "quantity": order.clockSize
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": order.dealPrice * order.clockSize
                    },
                    "description": `watch repair in the ${order.originalCityName} city on ${year}.${month}.${day} at ${hours}:00`
                }]
            };
            paypal.payment.create(create_payment_json, function (error:Error, payment:any) {
                if (error) {
                    throw error;
                } else {
                    console.log(payment)
                    const approvalUrl =payment.links.find((link: link) => link.rel==='approval_url');
                    return res.status(200).json(approvalUrl.href)
                }
            });
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new PayPallController()