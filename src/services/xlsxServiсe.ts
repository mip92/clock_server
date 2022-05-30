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

    exportOrdersToExcel(orders: OrderModel[], workSheetColumnNames: string[], workSheetName: string, filePath: string) {
        try {
            const data = orders.map(order => {
                // @ts-ignore
                return [order.id, order.master_busyDate.dateTime, order.user.email, order.user.name, order.originalCityName, order.clockSize, order.dealPrice, order.totalPrice, order.status]
            })
            this.exportExcel(data, workSheetColumnNames, workSheetName, filePath)
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new ExcelService();