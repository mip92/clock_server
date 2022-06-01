import {CustomRequest, GetOneOrderParams} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";
import {Master, MasterBusyDate, Order, User} from "../models";
import PDFDocument from 'pdfkit';
import * as fs from "fs";
import ApiError from "../exeptions/api-error";
import qrService from "../services/qrService";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import {UserModel} from "../models/user.model";
import {MasterModel} from "../models/master.model";
import {Base64Encode} from 'base64-stream';


interface OrderWithMasterBusyDateUserAndMaster extends OrderModel {
    master_busyDate: MasterBusyDateModel
    user: UserModel
    master: MasterModel
}

class PdfController {
    async createPdf(req: CustomRequest<any, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        const {orderId} = req.params

        // @ts-ignore
        const order: OrderWithMasterBusyDateUserAndMaster | null = await Order.findOne({
            where: {id: orderId},
            include: [{model: MasterBusyDate}, {model: User}, {model:Master}]
        })
        if (!order) return next(ApiError.BadRequest(`Order is not found`))
        const code = await qrService.createQrCode(order.id,
            order.master_busyDate.dateTime,
            order.clockSize,
            order.originalCityName,
            order.user.email,
            order.master.email,
            order.totalPrice,
            next)
        console.log(code)

        if (typeof code === "string") {
            let base64Data = code.replace(/^data:image\/png;base64,/, "");
            base64Data += base64Data.replace('+', ' ');
            const  binaryData = new Buffer(base64Data, 'base64').toString('binary');
            fs.writeFile("\static\out.png", binaryData, "binary", function (err) {
                console.log(err); // writes out file without error, but it's not a valid image
            });
        }



        /*QRCode.toDataURL('I am a pony!', function (err, qrCode) {
            console.log(qrCode)
            require("fs").writeFile("out.png", qrCode, 'base64', function(err:any) {
                console.log(err);
            });
        })*/

        /*require("fs").writeFile("out.png", qrCode, 'base64', function(err:any) {
            console.log(err);
        });
*/
        /*const doc = new PDFDocument;

        doc.pipe(fs.createWriteStream('example.pdf'));
        doc.fontSize(27)
            .text(`Order number: ${order.id}`, 100, 100);
        doc.fontSize(14)
            .text(`Clock size: ${order}`, 100, 130);
        doc.fontSize(14)
            .text(`Clock size: ${order.clockSize}`, 100, 100);
        doc.fontSize(14)
            .text(`Clock size: ${order.clockSize}`, 100, 100);
        /!*doc.image(qrCode, {
            fit: [300, 300],
            align: 'center',
            valign: 'center'
        });*!/

        doc.addPage()
            .fontSize(15)
            .text('Generating PDF with the help of pdfkit', 100, 100);

        doc.scale(0.6)
            .translate(470, -380)
            .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
            .fill('red', 'even-odd')
            .restore();

        doc.addPage()
            .fillColor('blue')
            .text('The link for GeeksforGeeks website', 100, 100)

            .link(100, 100, 160, 27, 'https://www.geeksforgeeks.org/');
        doc.end();
        console.log(123)*/
    }
}


export default new PdfController();

