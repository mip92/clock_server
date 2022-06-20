import express from "express";

const router = express.Router();
import cityRouter from './city.router'
import masterRouter from './master.router'
import orderRouter from './order.router'
import userRouter from './user.router'
import authRouter from './auth.router'
import statusRouter from './status.router'
import pictureRouter from './picture.router'
import ratingRouter from './rating.router'
import payPalRouter from './payPal.router'
import calendarRouter from './calendar.router'

router.use('/cities', cityRouter)
router.use('/masters', masterRouter)
router.use('/order', orderRouter)
router.use('/users', userRouter)
router.use('/auth', authRouter)
router.use('/status', statusRouter)
router.use('/picture', pictureRouter)
router.use('/rating', ratingRouter)
router.use('/payPal', payPalRouter)
router.use('/calendar', calendarRouter)

export default router