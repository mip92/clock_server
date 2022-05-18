import {NextFunction} from "express";
import ErrnoException = NodeJS.ErrnoException;
import {OrderModelWithMasterBusyDateAndUsers} from "./order.controller";
import path from "path";
import fs from 'fs';
import uuid from 'uuid';
import xlsx from 'xlsx';

const ApiError = require('../exeptions/api-error')

class ExcelController {
    createExcel(data: any, workSheetColumnNames: string[], workSheetName: string, filePath: string, next: NextFunction) {
        try {
            const workBook = xlsx.utils.book_new()
            const workSheetData = [
                workSheetColumnNames,
                ...data
            ]
            const workSheet = xlsx.utils.aoa_to_sheet(workSheetData)
            xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName)
            xlsx.writeFile(workBook, path.resolve(filePath))
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    deleteExcel(path:string) {
        try {
            fs.unlink(path, (err: ErrnoException | null) => {
                console.log(err)
            });
        } catch (e) {
            console.log(e)
        }
    }

    async getExcel(orders: OrderModelWithMasterBusyDateAndUsers[], next: NextFunction) {
        try {
            const workSheetColumnNames: string[] = ['id', "date time", "user email", "user name", "city",
                "clock size", "deal price", "total price", "status"]
            const fileName: string = uuid.v4() + '.xlsx'
            const directoryPath: string = path.resolve(__dirname, '..', 'static', `excelFile`)
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, {recursive: true})
            }
            const filePath: string = path.resolve(directoryPath, fileName)
            const workSheetName: string = "Orders"
            const data = orders.map(order => {
                return [order.id, order.master_busyDate.dateTime, order.user.email,
                    order.user.name, order.originalCityName, order.clockSize,
                    order.dealPrice, order.totalPrice, order.status]
            })
            this.createExcel(data, workSheetColumnNames, workSheetName, filePath, next)
            return {fileName, filePath}
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

}

export default new ExcelController();

