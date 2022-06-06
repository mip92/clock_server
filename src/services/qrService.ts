import QRCode from 'qrcode'
import {NextFunction} from "express";
import ApiError from "../exeptions/api-error";

type QrCodeInformation = {id: number,
    dateTime: string,
    clockSize: number,
    city: string,
    userEmail: string,
    masterEmail: string,
    totalPrice: number | null,
    next: NextFunction}

class QrService {
    async createQrCode(payload:QrCodeInformation) {
        const {id, dateTime, clockSize, city, userEmail, masterEmail, totalPrice, next} = payload
        const text: string = `id ${id}, dateTime ${new Date(dateTime).toLocaleString()}, clock size ${clockSize}, city ${city}, user e-mail ${userEmail}, master e-mail ${masterEmail}, total price ${totalPrice}`
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