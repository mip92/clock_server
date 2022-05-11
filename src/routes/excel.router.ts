export {};
const Router = require('express').Router;
const router = new Router();
const excelController = require('../controller/excel.controller')

router.get('/', excelController.createExcel);


module.exports = router