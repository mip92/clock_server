import {NextFunction, Response} from "express";
import {CreatePicturesParams, CustomRequest, DeletePicturesBody} from "../interfaces/RequestInterfaces";
import {OrderModel} from "../models/order.model";
import ErrnoException = NodeJS.ErrnoException;
import {PictureModel} from "../models/picture.model";
import {OrderPictureModel} from "../models/orderPicture.model";

const fs = require('fs');
require("dotenv").config({path: `.env.${process.env.NODE_ENV}`})
const ApiError = require('../exeptions/api-error')
const cloudinary = require("cloudinary").v2
const uuid = require('uuid')
const path = require("path")
const {Picture, OrderPicture, Order} = require('../models/index');

interface MyFile extends File {
    data: Buffer,
}
interface UploadCloudinaryResult {
    asset_id: string,
    public_id: string,
    version: number,
    version_id: string,
    signature: string,
    width: number,
    height: number,
    format: string,
    resource_type: string,
    created_at: string,
    tags: string[],
    bytes: number,
    type: string,
    etag: string,
    placeholder: boolean,
    url: string,
    secure_url: string,
    original_filename: string,
    api_key: string
}

interface DataValues extends PictureModel{
    url: string
}
interface Picture {
    dataValues: DataValues
}
interface OrderPictureModelWithPicture extends OrderPictureModel{
    picture: Picture
}

class PictureController {
    static createOnePicture(file: MyFile, next: NextFunction) {
        const name: string = file.name
        const fileExtension: string | undefined = name.split('.').pop()
        const arr: string[] = ['jpeg', 'JPEG', 'jpg', 'JPG', 'png', 'PNG'] //'BMP', 'bmp', 'GIF', 'gif', 'ico', 'ICO'
        let isOk: null | string = null
        for (let i = 0; i < arr.length; i++) {
            if (fileExtension == arr[i]) isOk = "ok"
        }
        if (isOk == null) return next(ApiError.BadRequest(`Файла ${name} не является картинкой`))
        if (file.size > 1048576) return next(ApiError.BadRequest(`Размер файла ${name} больше 1 Мб`))
        const fileName: string = uuid.v4() + '.' + fileExtension
        const filePath: string = path.resolve(__dirname, '..', 'static', `imageFile`)
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, {recursive: true})
        }
        const picturePath: string = path.resolve(filePath, fileName)

        fs.writeFileSync(picturePath, file.data)
        return picturePath
    }

    static deleteOnePicture(path: string, next: NextFunction) {
        fs.unlink(path, (err: ErrnoException) => {
            if (err) return next(err)
            console.log('Файл успешно удалён');
        });
    }

    async createPictures(req: CustomRequest<null, CreatePicturesParams, null, any>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            let picturesArr = [] as MyFile[]
            for (let i = 0; i < 5; i++) {
                const propName = `picture${i}`
                if (req.files[propName]) picturesArr.push(req.files[propName])
            }
            const order: OrderModel = await Order.findOne({where: {id: orderId}})
            if (!order) return next(ApiError.BadRequest(`Order is not found`))

            const createPicture = (p: MyFile): Promise<PictureModel> => {
                return new Promise((resolve, reject) => {
                    const picturePath: void | string = PictureController.createOnePicture(p, next)
                    picturePath && cloudinary.uploader.upload(picturePath, {resource_type: "image"})
                        .then((result: UploadCloudinaryResult) => {
                            picturePath && PictureController.deleteOnePicture(picturePath, next)
                            Picture.create({path: result.public_id}).then((picture: PictureModel) => {
                                resolve(picture)
                            })
                        })
                        .catch((error: Error) => {
                            reject(error)
                        })
                })
            }
            let count = 0
            Promise.all(picturesArr.map(p => createPicture(p)))
                .then((results: PictureModel[]) => {
                        results.map((response: PictureModel) => {
                                OrderPicture.create({pictureId: response.id, orderId})
                                    .then(() => {
                                        count++
                                        if (count === picturesArr.length) OrderPicture.findAndCountAll(
                                            {where: {orderId}})
                                            .then((op: OrderPictureModel) => {
                                                res.status(201).json(op)
                                            })
                                    })
                            }
                        )
                    }
                )
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async getPictures(req: CustomRequest<null, CreatePicturesParams, null, any>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            const p: Promise<OrderPictureModelWithPicture[]> = new Promise((resolve, reject) => {
                    OrderPicture.findAll({where: {orderId}, include: [{model: Picture}]})
                        .then((orderPictures: OrderPictureModelWithPicture[]) => {
                                if (orderPictures.length === 0) reject(`Pictures is not found`)
                                resolve(orderPictures)
                            }
                        )
                }
            )
            p.then(result => {
                    result.map(r => r.picture.dataValues.url = process.env.CLOUDINARY_PUBLIC_URL + r.picture.dataValues.path)
                    res.status(200).json(result)
                },
                error => next(ApiError.BadRequest(error))
            )
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async deletePictures(req: CustomRequest<DeletePicturesBody, CreatePicturesParams, null, any>, res: Response, next: NextFunction) {
        const {orderId} = req.params
        const arr = /*JSON.parse(*/req.body.picturesId
        for (let i = 0; i < arr.length; i++) {
            const orderPicture: OrderPictureModel = await OrderPicture.findOne({where: {orderId, pictureId: arr[i]}})
            if (!orderPicture) return next(ApiError.BadRequest(`Picture with this id: ${arr[i]} does not belong to order with this id: ${orderId}`))
            const picture: PictureModel = await Picture.findByPk(arr[i])
            const cd:{result: string} = await cloudinary.uploader.destroy(picture.path);
            if (cd.result !== 'ok') next(ApiError.Internal(`Cloudinary server error`))
            await picture.destroy()
            await orderPicture.destroy()
        }
        await res.status(200).json(`pictures with id: ${req.body.picturesId} was deleted`)
    }

}

module.exports = new PictureController()