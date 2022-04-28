import {NextFunction} from "express";

export {};
const Router = require('express')
const router = new Router()
const authController = require('../controller/auth.controller')

router.post('/', (req: any, res: Express.Response, next: NextFunction) => {
    console.log(111)
    console.log(req.body)
})
router.post('/2', (req: any, res: Express.Response, next: NextFunction) => {
    console.log(222)
    console.log(req.body)
})

module.exports = router