import {NextFunction} from "express";

export {};
const Router = require('express')
const router = new Router()
const payPalController = require('../controller/payPal.controller')

router.post('/created', (req: any, res: Express.Response, next: NextFunction) => {
    console.log(111)

    console.log(req.body.resource)
    console.log(req.body.resource.links)
})
router.post('/paid', payPalController.addPayPalIdToOrder)
    /*console.log(222)
    console.log(req.body.resource)
    console.log(req.body.resource.links)
})*/

module.exports = router