import {CreateUserBody, CustomRequest} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";
const excel = require("../services/xlsxServiсe");
const {Order} = require('../models/index');


const ApiError = require('../exeptions/api-error')

class XlsxController {
    async createExcel(req: CustomRequest<CreateUserBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const orders: OrderModel[] = await Order.findAll()
            const workSheetColumnMenu =['ID',"name", "email"]
            const workSheetName = "Orders"
            const filePath = './excelFiles.xlsx'
            console.log(111)
            excel.exportOrdersToExcel(orders, workSheetColumnMenu, workSheetName, filePath)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

}

module.exports = new XlsxController()