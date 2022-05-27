import {NextFunction, Response} from "express";
import {CreatePicturesParams, CustomRequest, DeletePicturesBody} from "../interfaces/RequestInterfaces";
import {OrderModel} from "../models/order.model";
import ErrnoException = NodeJS.ErrnoException;
import {PictureModel} from "../models/picture.model";
import {OrderPictureModel} from "../models/orderPicture.model";
import {v4 as uuidv4} from 'uuid';
import path from "path";
import fs from 'fs';
import ApiError from '../exeptions/api-error';
import {Picture, OrderPicture, Order} from '../models';

const cloudinary = require("cloudinary").v2

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

interface DataValues extends PictureModel {
    url: string
}

interface Picture {
    dataValues: DataValues
}

interface OrderPictureModelWithPicture extends OrderPictureModel {
    picture: Picture
}

class PictureController {
    static createOnePicture(file: MyFile, next: NextFunction) {
        const MAX_FILE_SIZE = 1048576 //1024*1024 1mb
        const name: string = file.name
        // @ts-ignore
        const fileExtension: string  = name.split('.').pop()
        const allowedTypes: string[] = ['jpeg', 'JPEG', 'jpg', 'JPG', 'png', 'PNG'] //'BMP', 'bmp', 'GIF', 'gif', 'ico', 'ICO'
        if (!allowedTypes.some(fileType => fileType === fileExtension)) {
            return next(ApiError.BadRequest(`File with name: ${name} is not a picture`))
        }
        if (file.size > MAX_FILE_SIZE) return next(ApiError.BadRequest(`File with name: ${name} is larger than 1 MB`))
        const fileName: string = uuidv4() + '.' + fileExtension
        const filePath: string = path.resolve(__dirname, '..', 'static', `imageFile`)
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, {recursive: true})
        }
        const picturePath: string = path.resolve(filePath, fileName)
        fs.writeFileSync(picturePath, file.data)
        return {picturePath, fileExtension}
    }

    static deleteOnePicture(path: string, next: NextFunction) {
        fs.unlink(path, (err: ErrnoException | null) => {
            if (err) return next(err)
            console.log('File deleted successfully');
        });
    }

    async createPictures(req: CustomRequest<null, CreatePicturesParams, null, any | null>, res: Response, next: NextFunction) {
        try {
            const {orderId} = req.params
            let picturesArr: MyFile[] = []
            if (req.files === null) return res.status(201).json({message: 'Order without pictures'})
            Object.keys(req.files).forEach(function (key) {
                if (key) picturesArr.push(req.files[key])
            }, req.files);
            const order: OrderModel | null = await Order.findOne({where: {id: orderId}})
            if (!order) return next(ApiError.BadRequest(`Order is not found`))

            const createPicture = (p: MyFile): Promise<PictureModel> => {
                return new Promise((resolve, reject) => {
                    // @ts-ignore
                    const {picturePath, fileExtension} = PictureController.createOnePicture(p, next)
                    console.log(picturePath, fileExtension)
                    picturePath && cloudinary.uploader.upload(picturePath, {resource_type: "image"})
                        .then((result: UploadCloudinaryResult) => {
                            picturePath && PictureController.deleteOnePicture(picturePath, next)
                            console.log(result.public_id+"."+fileExtension)
                            Picture.create({path: result.public_id+"."+fileExtension}).then((picture: PictureModel) => {
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
                                OrderPicture.create({pictureId: response.id, orderId: +orderId})
                                    .then(() => {
                                        count++
                                        if (count === picturesArr.length) OrderPicture.findAndCountAll(
                                            {where: {orderId}})
                                            .then((op: { rows: OrderPictureModel[]; count: number; }) => {
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
                        // @ts-ignore
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

    async deletePictures(req: CustomRequest<DeletePicturesBody, CreatePicturesParams, null, null>, res: Response, next: NextFunction) {
        const {orderId} = req.params
        const arrayPicturesId = req.body.picturesId
        const deleteOnePicture = (pictureId: number): Promise<number> => {
            return new Promise((resolve, reject) => {
                OrderPicture.findOne({where: {orderId, pictureId}}).then((orderPicture: OrderPictureModel | null) => {
                        if (orderPicture == null) reject(`Picture with this id: ${pictureId} does not belong to order with this id: ${orderId}`)
                        Picture.findByPk(pictureId).then((picture: PictureModel | null) => {
                            cloudinary.uploader.destroy(picture && picture.path).then((cd: { result: string }) => {

                                if (cd.result == 'not found') {
                                    orderPicture && orderPicture.destroy().then(() => {
                                        picture && picture.destroy().then(() => {
                                            return resolve(picture.id)
                                        })
                                    })
                                } else if (cd.result !== 'ok') {
                                    reject(`Cloudinary server error`)
                                    console.log(cd)
                                } else picture && picture.destroy().then(() => {
                                    orderPicture && orderPicture.destroy().then(() => {
                                        picture && picture.destroy().then(() => {
                                            return resolve(picture.id)
                                        })
                                    })
                                })
                            })
                        })
                    }
                ).catch((err: Error) => {
                    reject(err)
                })
            })
        }
        Promise.all(arrayPicturesId.map(deleteOnePicture)).then((picturesId: number[]) => {
            res.status(200).json({message: `pictures with id: ${picturesId} was deleted`, picturesId})
        })
        /*
                for (let i = 0; i < arr.length; i++) {
                    const orderPicture: OrderPictureModel = await OrderPicture.findOne({where: {orderId, pictureId: arr[i]}})
                    if (!orderPicture) return next(ApiError.BadRequest(`Picture with this id: ${arr[i]} does not belong to order with this id: ${orderId}`))
                    const picture: PictureModel = await Picture.findByPk(arr[i])
                    const cd: { result: string } = await cloudinary.uploader.destroy(picture.path);
                    if (cd.result !== 'ok') next(ApiError.Internal(`Cloudinary server error`))
                    await picture.destroy()
                    await orderPicture.destroy()
                }
                await res.status(200).json(`pictures with id: ${req.body.picturesId} was deleted`)*/
    }

}

export default new PictureController()
//module.exports = new PictureController()