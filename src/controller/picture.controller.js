const fs = require('fs');
require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})
const ApiError = require('../exeptions/api-error')
const cloudinary = require("cloudinary").v2
const uuid = require('uuid')
const path = require("path")

class PictureController {
    static async createOnePicture(file, next) {
        const name = file.name
        const fileExtension = name.split('.').pop()
        const arr = ['jpeg', 'JPEG', 'jpg', 'JPG', 'png', 'PNG', 'BMP', 'bmp', 'GIF', 'gif', 'ico', 'ICO']
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
        //console.log(picturePath)
        return picturePath
    }

    async createPicture(req, res, next) {
        try {
            let pictureCount = 0
            for (let i = 0; i < 5; i++) {
                const propName = `picture${i}`
                if (req.files[propName]) pictureCount++
            }
            console.log(pictureCount)
            const pp = await PictureController.createOnePicture(req.files.picture0, next)
            console.log(pp)
            console.log(cloudinary.uploader.upload(pp, {resource_type: "image"})
                .then((result) => {console.log(result)})
                .catch((error)=>{
                    console.log(error)
                }))
            /* console.log(req.files.picture1)
             console.log(req.files.picture2)
             console.log(req.files.picture3)
             console.log(req.files.picture4)
             console.log(req.files.picture5)*/
            /* console.log(req.files.picture1.name)
             console.log(req.files.picture1.name.split('.').pop())
             const fileExtension=req.files.picture1.name.split('.').pop()*/
            //console.log(fileExtension)
            /*if (type=="image") {
                const arr = ['jpeg', 'JPEG', 'jpg', 'JPG', 'png', 'PNG', 'BMP', 'bmp', 'GIF', 'gif', 'ico', 'ICO']
                let isOk = null
               /!* for (let i = 0; i < arr.length; i++) {
                    if (fileExtension == arr[i]) isOk = "ok"
                }
                if (isOk == null) {
                    throw new HttpException({message: [`Файла ${file.originalname} не является картинкой`]}, HttpStatus.BAD_REQUEST)
                }*!/
            }*/
            console.log(2222222222)
            /* if (req.files.picture1.size>2097152) {throw new HttpException({message: [`Размер файла ${file.originalname} больше 2 Мб`]}, HttpStatus.BAD_REQUEST)}
             const fileName=uuid.v4()+'.'+fileExtension
             const filePath=path.resolve(__dirname, '..','static',`${type}File`)
             if(!fs.existsSync(filePath)){
                 fs.mkdirSync(filePath,{recursive:true})
             }
             fs.writeFileSync(path.resolve(filePath,fileName),file.buffer)



             console.log(cloudinary.uploader.upload(req.files.picture1.data, {resource_type: "image"})
                 .then((result) => {console.log(result)})
                 .catch((error)=>{
                     console.log(error)
                 }))
             //onst {files} = req.body
             //console.log(req.files)
             //console.log(req.files.picture1)
             /!*for (let i = 0; i < files.length; i++) {
                 console.log(files[1])
             }*!/
             const isCityUniq = await City.findOne({where: {cityName: city}})
             if (isCityUniq) return next(ApiError.ExpectationFailed({
                 value: city,
                 msg: `City with this name: ${city} is not found`,
                 param: "city",
                 location: "body"
             }))
             const newCity = await City.create({cityName: city, price})
             res.status(201).json(newCity)*/
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new PictureController()