import express from "express";
const router = express.Router();
import calendarController from '../controller/calendar.controller';


router.get('/month/:masterId', (res: any, req: any, next: any) => {
    calendarController.getMonth(res, req, next)
});


export default router