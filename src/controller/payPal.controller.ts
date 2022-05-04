import {
    CreatePayPalOrderBody,
    CustomRequest,
    GetOneOrderParams
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import axios from "axios";

const ApiError = require('../exeptions/api-error')
const paypal = require('paypal-rest-sdk');
const {MasterBusyDate, Order, STATUSES} = require('../models');

interface link {
    href: string,
    rel: string,
    method: string
}

class PayPalController {
    async createPayPalOrder(req: CustomRequest<CreatePayPalOrderBody, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {payPalOrderId} = req.body
            const {orderId} = req.params
            console.log(payPalOrderId)
            const order:OrderModel = await Order.findOne({where: {id: orderId},})
            if(!order) next(ApiError.BadRequest(`order with id:${orderId} is not defined`))
            await order.update({payPalOrderId:payPalOrderId, status:STATUSES.AwaitingPayment})
            res.status(200).json({message: `payPal order was created`})
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async orderHasBeenPaid(req: CustomRequest<any, null, null, null>, res: Response, next: NextFunction) {
        try {
            console.log(req.body.resource.supplementary_data)
            const payPalOrderId = req.body.resource.supplementary_data.related_ids.order_id
            const order: OrderModel = await Order.findOne({where: {payPalOrderId}})
            await order.update({status:STATUSES.Confirmed})
            /*const payPalClientId = process.env.PAYPAL_CLIENT_ID
            const secrete = process.env.PAYPAL_SECRETE
            if (!payPalClientId || !secrete) {
                console.log('PayPalClientId or secrete is not found')
                return
            }
            const basicToken = Buffer.from(`${payPalClientId}:${secrete}`, 'utf8').toString('base64')

            const token = await axios.post(`https://api.sandbox.paypal.com/v1/oauth2/token`,
                {"grant_type": "client_credentials"},
                {
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Basic ${basicToken}`,
                    },
                    data: {
                       "username": payPalClientId,
                        "password": secrete,
                        "grant_type": "client_credentials"
                    }
                                    headers: {
                                        'Authorization': `Basic ${basicToken}`,
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                })


                        const token = await axios.post(`https://api.sandbox.paypal.com/v1/oauth2/token`, {}, {
                            auth: {
                                username: payPalClientId,
                                password: secrete
                            }
                        });
            console.log(token)*/

            /* const response = await axios.get(`https://api.sandbox.paypal.com/v2/checkout/orders/${payPalOrderId}`, {
                 headers: {
                     'Authorization': `Bearer A21AAIDoaBaiPMhGVl9m2MHZdj6GqCHRKqRM6mBhPkiiRkixzoQNA404uioPrZiVua4W4qs32yE6nTiU3yu1QRxYIGwAfqyng`
                 }
             })
             const description = response.data.purchase_units[0].description
             const orderId=Number(description.replace(/\D+/g,""))
             const order: OrderModel = await Order.findOne({where: {id: orderId}})
             await order.update({payPalOrderId:payPalOrderId, status:STATUSES.Confirmed})*/

            //res.status(200).json(order)
        } catch (e) {
            console.log(e)
        }
    }


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
            paypal.payment.create(create_payment_json, function (error: Error, payment: any) {
                if (error) {
                    throw error;
                } else {
                    console.log(payment)
                    const approvalUrl = payment.links.find((link: link) => link.rel === 'approval_url');
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
            paypal.payment.create(create_payment_json, function (error: Error, payment: any) {
                if (error) {
                    throw error;
                } else {
                    console.log(payment)
                    const approvalUrl = payment.links.find((link: link) => link.rel === 'approval_url');
                    return res.status(200).json(approvalUrl.href)
                }
            });
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new PayPalController()