import QRCode from 'qrcode'
import {NextFunction} from "express";
import ApiError from "../exeptions/api-error";

class QrService {
    async createQrCode(id: number,
                       dateTime: string,
                       clockSize: number,
                       city: string,
                       userEmail: string,
                       masterEmail: string,
                       totalPrice: number | null,
                       next: NextFunction) {
        const text: string = `id ${id}, dateTime ${dateTime}, clockSize ${clockSize}, city ${city}, user e-mail ${userEmail}, master e-mail ${masterEmail}, total price ${totalPrice}`
        console.log(text)
        return QRCode.toDataURL(text)
            .then((code: string) => {
                return code
            })
            .catch((err: any) => {
                next(ApiError.BadRequest(err))
            })
    }
}

export default new QrService()