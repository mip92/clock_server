import express from "express";

const router = express.Router();
import statusController from '../controller/status.controller';
import checkRoles from '../middlwares/checkRolesMiddleware';
import {ROLE} from "../models";

<<<<<<< HEAD
router.get('/', checkRoles([ROLE.Admin, ROLE.User, ROLE.Master]), (res: any, req: any, next: any) => {
    statusController.getStatuses(res, req, next)
});
router.put('/:orderId', checkRoles([ROLE.Admin, ROLE.User, ROLE.Master]), (res: any, req: any, next: any) => {
    statusController.changeStatus(res, req, next)
});
=======
router.get('/', checkRoles([ROLE.Admin,ROLE.User, ROLE.Master]), (res: any, req: any, next: any) => {statusController.getStatuses(res, req, next)});
router.put('/:orderId', checkRoles([ROLE.Admin, ROLE.Master]), (res: any, req: any, next: any) => {statusController.changeStatus(res, req, next)});
>>>>>>> feature_comments


export default router