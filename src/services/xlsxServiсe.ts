import {OrderModel} from "../models/order.model";

const xlsx = require('xlsx')
const path = require("path")

class ExcelService {

    exportExcel(data: any, workSheetColumnNames: any, workSheetName: any, filePath: string) {
        const workBook = xlsx.utils.book_new()
        const workSheetData = [
            workSheetColumnNames,
            ...data
        ]
        const workSheet = xlsx.utils.aoa_to_sheet(workSheetData)
        xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName)
        xlsx.writeFile(workBook, path.resolve(filePath))
    }

    exportOrdersToExcel(orders: OrderModel[],workSheetColumnNames: string[], workSheetName: string, filePath: string) {
        const data =orders.map( order=>{
            return [order.status, order.clockSize, order.dealPrice]
        })
        console.log(data)
        this.exportExcel(data, workSheetColumnNames, workSheetName, filePath)
    }
}

module.exports = new ExcelService();