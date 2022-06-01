import {NextFunction} from "express";
import ApiError from "../exeptions/api-error";
import {v4 as uuidv4} from "uuid";
import path from "path";
import fs from "fs";

class ImgService {
    createPngFromBase64(code: string, next: NextFunction) {
        let base64Data = code.replace(/^data:image\/png;base64,/, "");
        base64Data += base64Data.replace('+', ' ');
        const binaryData = Buffer.from(base64Data, 'base64');
        const fileName: string = uuidv4() + '.png'
        const directoryPath: string = path.resolve(__dirname, '..', 'static', `qrCodeFile`)
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, {recursive: true})
        }
        const filePath: string = path.resolve(directoryPath, fileName)
        fs.writeFile(filePath, binaryData, "binary", function (err: any) {
            next(ApiError.BadRequest(err))
        })
        return {filePath, fileName}
    }
}

export default new ImgService()