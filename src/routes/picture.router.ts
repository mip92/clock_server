import express from "express";

const router = express.Router();
import pictureController from '../controller/picture.controller';
import checkRoles from "../middlwares/checkRolesMiddleware";
import {ROLE} from "../models";

router.post('/:orderId', (res: any, req: any, next: any) => {
    pictureController.createPictures(res, req, next)
});
router.get('/:orderId', checkRoles([ROLE.Admin, ROLE.Master, ROLE.User]), (res: any, req: any, next: any) => {
    pictureController.getPictures(res, req, next)
})
router.delete('/:orderId', checkRoles([ROLE.Admin, ROLE.Master, ROLE.User]), (res: any, req: any, next: any) => {
    pictureController.deletePictures(res, req, next)
});


export default router