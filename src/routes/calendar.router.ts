import express from "express";
const router = express.Router();
import calendarController from '../controller/calendar.controller';
import {ROLE} from "../models";
import checkRoles from "../middlwares/checkRolesMiddleware";

router.get('/month', checkRoles([ROLE.Master]), (res: any, req: any, next: any) => {
    calendarController.getMonth(res, req, next)
});
router.get('/week', checkRoles([ROLE.Master]), (res: any, req: any, next: any) => {
    calendarController.getWeek(res, req, next)
});


export default router