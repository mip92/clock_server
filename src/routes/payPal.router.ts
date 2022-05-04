import {NextFunction} from "express";

export {};
const Router = require('express')
const router = new Router()
const payPalController = require('../controller/payPal.controller')

router.post('/created/:orderId', payPalController.createPayPalOrder)
router.post('/paid', payPalController.orderHasBeenPaid)
    /*console.log(222)
    console.log(req.body.resource)
    console.log(req.body.resource.links)
})*/

module.exports = router