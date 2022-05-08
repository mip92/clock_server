export {};
const Router = require('express')
const router = new Router()
const cityRouter=require('./city.router')
const masterRouter=require('./master.router')
const orderRouter=require('./order.router')
const userRouter=require('./user.router')
const authRouter=require('./auth.router')
const statusRouter=require('./status.router')
const pictureRouter=require('./picture.router')
const ratingRouter=require('./rating.router')
const payPalRouter=require('./payPal.router')


router.use('/cities', cityRouter)
router.use('/masters',masterRouter)
router.use('/order',orderRouter)
router.use('/users',userRouter)
router.use('/auth',authRouter)
router.use('/status',statusRouter)
router.use('/picture',pictureRouter)
router.use('/rating',ratingRouter)
router.use('/payPal', payPalRouter)


module.exports=router