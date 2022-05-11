import {CreateUserBody, CustomRequest} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";

const path = require("path")
const fs = require('fs');
const excel = require("../services/xlsxServiсe");
const {Order} = require('../models/index');
const uuid = require('uuid')


const ApiError = require('../exeptions/api-error')

class ExcelController {
    async createExcel(orders: any, next: NextFunction) {
        try {
            //const orders: OrderModel[] = await Order.findAll()
            const workSheetColumnMenu =['id',"date time", "user email", "user name", "city", "clock size", "deal price", "total price", "status"]
            const fileName: string = uuid.v4() + '.xlsx'
            const directoryPath: string = path.resolve(__dirname, '..', 'static', `excelFile`)
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, {recursive: true})
            }
            const filePath: string = path.resolve(directoryPath, fileName)
            const workSheetName = "Orders"
            console.log(111)
            excel.exportOrdersToExcel(orders, workSheetColumnMenu, workSheetName, filePath)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

}

module.exports = new ExcelController()