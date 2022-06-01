import express from "express";
const router = express.Router();
import checkRoles from "../middlwares/checkRolesMiddleware";
import pdfController from '../controller/pdf.controller'
import {ROLE} from "../models";



router.get('/:orderId' /*checkRoles([ROLE.Master])*/, (res: any, req: any, next: any) => {pdfController.createPdf(res, req, next)});



export default router