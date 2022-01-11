const Router = require('express')
const router = new Router()

const cityRouter=require('./city.router')
const masterRouter=require('./master.router')
const adminRouter=require('./admin.router')
const orderRouter=require('./order.router')
const userRouter=require('./user.router')

router.use('/cities', cityRouter)
router.use('/masters',masterRouter)
router.use('/admin',adminRouter)
router.use('/order',orderRouter)
router.use('/users',userRouter)

module.exports=router