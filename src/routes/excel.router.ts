import express from "express";
const router = express.Router();
const excelController = require('../controller/excel.controller')

router.get('/', (res: any, req: any, next: any) => {
    excelController.createExcel(res, req, next);
})
export default router