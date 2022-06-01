import {CustomRequest, GetOneOrderParams} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {OrderModel} from "../models/order.model";
import {Order} from "../models";
import PDFDocument from 'pdfkit';
import * as fs from "fs";
import ApiError from "../exeptions/api-error";
import QRCode from 'qrcode'


class PdfController {
    async createPdf(req: CustomRequest<any, GetOneOrderParams, null, null>, res: Response, next: NextFunction) {
        const {orderId} = req.params
        const order: OrderModel | null = await Order.findOne({where: {id: orderId}})

        if (!order) return next(ApiError.BadRequest(`Order is not found`))

        QRCode.toDataURL('I am a pony!')
            .then(url => {
                console.log(url)

                const data = url

                let base64Data = data.replace(/^data:image\/png;base64,/, "");
                base64Data += base64Data.replace('+', ' ');
                const  binaryData = new Buffer(base64Data, 'base64').toString('binary');

                fs.writeFile("out.png", binaryData, "binary", function (err) {
                    console.log(err); // writes out file without error, but it's not a valid image
                });
            })
            .catch(err => {
                console.error(err)
            })
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
