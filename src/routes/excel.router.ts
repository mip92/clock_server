import express from "express";
const router = express.Router();
const excelController = require('../controller/excel.controller')

router.get('/', excelController.createExcel);


export default router