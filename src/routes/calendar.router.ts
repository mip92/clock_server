import express from "express";
const router = express.Router();
import calendarController from '../controller/calendar.controller';


router.get('/month', (res: any, req: any, next: any) => {
    calendarController.getMonth(res, req, next)
});
router.get('/week', (res: any, req: any, next: any) => {
    calendarController.getWeek(res, req, next)
});


export default router