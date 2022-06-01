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