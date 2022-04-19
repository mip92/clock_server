const fs = require('fs');
require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})
const ApiError = require('../exeptions/api-error')
const cloudinary = require("cloudinary").v2
const uuid = require('uuid')
const path = require("path")
const {Picture, OrderPicture, Order} = require("../models/models");

class PictureController {
    static createOnePicture(file, next) {
        const name = file.name
        const fileExtension = name.split('.').pop()
        const arr = ['jpeg', 'JPEG', 'jpg', 'JPG', 'png', 'PNG'] //'BMP', 'bmp', 'GIF', 'gif', 'ico', 'ICO'
        let isOk = null
        for (let i = 0; i < arr.length; i++) {
            if (fileExtension !== arr[i]) isOk = "ok"
        }
        if (isOk == null) return next(ApiError.BadRequest(`Файла ${name} не является картинкой`))
        if (file.size > 1048576) return next(ApiError.BadRequest(`Размер файла ${name} больше 1 Мб`))
        const fileName = uuid.v4() + '.' + fileExtension
        const filePath = path.resolve(__dirname, '..', 'static', `imageFile`)
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, {recursive: true})
        }
        const picturePath = path.resolve(filePath, fileName)
        fs.writeFileSync(picturePath, file.data)
        return picturePath
    }

    static deleteOnePicture(path, next) {
        fs.unlink(path, err => {
            if (err) throw err; // не удалось удалить файл
            console.log('Файл успешно удалён');
        });
    }

    async createPictures(req, res, next) {
        try {
            const {orderId} = req.params
            let picturesArr = []
            for (let i = 0; i < 5; i++) {
                const propName = `picture${i}`
                if (req.files[propName]) picturesArr.push(req.files[propName])
            }
            const order = await Order.findOne({where: {id: orderId}})
            if (!order) return next(ApiError.BadRequest(`Order is not found`))
            const createPicture = (p) => {
                return new Promise((resolve, reject) => {
                    const picturePath = PictureController.createOnePicture(p, next)
                    cloudinary.uploader.upload(picturePath, {resource_type: "image"})
                        .then((result) => {
                            console.log(result)
                            PictureController.deleteOnePicture(picturePath, next)
                            Picture.create({path: result.public_id}).then((picture) => {
                                resolve(picture)
                            })
                        })
                        .catch((error) => {
                            console.log(error)
                        })

                })
            }
            let count = 0
            Promise.all(picturesArr.map(p => createPicture(p)))
                .then(results => {
                        results.map(response => {
                                OrderPicture.create({pictureId: response.id, orderId})
                                    .then(() => {
                                        count++
                                        if (count === picturesArr.length) OrderPicture.findAndCountAll(
                                            {where: {orderId}})
                                            .then((op) => {
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

    async getPictures(req, res, next) {
        try {
            const {orderId} = req.params
            console.log(orderId)
            const p = new Promise((resolve, reject) => {
                    OrderPicture.findAll({where: {orderId}, include: [{model: Picture}]})
                        .then((orderPicture) => {
                            if (orderPicture.length === 0) reject(`Pictures is not found`)
                            resolve(orderPicture)
                        }
                    )
                }
            )
            p.then(result => {
                    result.map(r => r.picture.dataValues.url = process.env.CLOUDINARY_PUBLIC_URL+ r.picture.path)
                    res.status(200).json(result)
                },
                error => next(ApiError.BadRequest(error))
            )
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async deletePictures(req, res, next) {
        const {orderId} = req.params
        const arr = /*JSON.parse(*/req.body.picturesId
        for (let i = 0; i < arr.length; i++) {
            const orderPicture = await OrderPicture.findOne({where: {orderId, pictureId: arr[i]}})
            if (!orderPicture) return next(ApiError.BadRequest(`Picture with this id: ${arr[i]} does not belong to order with this id: ${orderId}`))
            const picture = await Picture.findByPk(arr[i])
            const cd = await cloudinary.uploader.destroy(picture.path);
            if (cd.result !== 'ok') next(ApiError.Internal(`Cloudinary server error`))
            await picture.destroy()
            await orderPicture.destroy()
        }
        await res.status(200).json(`pictures with id: ${req.body.picturesId} was deleted`)
    }

}

module.exports = new PictureController()