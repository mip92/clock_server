import archiver from 'archiver';
import path from "path";
import fs from 'fs';
import {v4 as uuidv4} from "uuid";
import axios from "axios";

import {promisify} from "util";
import * as stream from "stream";
import {OrderPictureWithPicture} from "./order.controller";

class ZipController {
    async createZip(orderPictures: OrderPictureWithPicture[]): Promise<{ fileName: string, filePath: string, imgPaths:string[] }> {
        return new Promise((resolve, reject) => {
                const fileName: string = uuidv4() + '.zip'
                const directoryPath: string = path.resolve(__dirname, '..', 'static', `zipFile`)
                if (!fs.existsSync(directoryPath)) {
                    fs.mkdirSync(directoryPath, {recursive: true})
                }
                const filePath: string = path.resolve(directoryPath, fileName)
                let output = fs.createWriteStream(filePath)
                let archive = archiver('zip', {
                    zlib: {level: 9} // set compression level
                })
                output.on('close', function () {
                    console.log(`Total ${archive.pointer()} bytes`)
                    console.log('the archiver has finished archiving the file, the file output stream descriptor is closed')
                })
                output.on('end', function () {
                    console.log('Data source exhausted')
                })
                archive.on('warning', function (err) {
                    if (err.code === 'ENOENT') {
                        console.warn('Stat crashes and other non-blocking errors')
                    } else {
                        throw err
                    }
                })
                archive.on('error', function (err) {
                    throw err
                })
                archive.pipe(output)
                const downloadPictures = (orderPicture: OrderPictureWithPicture): Promise<string> => {
                    return new Promise((resolve, reject) => {
                            const newFileName: string = orderPicture.picture.path
                            const directoryOfNewFilePath: string = path.resolve(__dirname, '..', 'static', 'tempFile')
                            if (!fs.existsSync(directoryOfNewFilePath)) {
                                fs.mkdirSync(directoryOfNewFilePath, {recursive: true})
                            }
                            const newFilePath: string = path.resolve(directoryOfNewFilePath, newFileName)
                            const finishedDownload = promisify(stream.finished);
                            const writer = fs.createWriteStream(newFilePath)
                            axios({
                                url: `${process.env.CLOUDINARY_PUBLIC_URL}/${orderPicture.picture.path}`,
                                method: "GET",
                                responseType: "stream"
                            }).then((response) => {
                                    return new Promise((resolve, reject) => {
                                        resolve(response.data.pipe(writer))
                                    }).then(() => {
                                            return new Promise((resolve, reject) => {
                                                resolve(finishedDownload(writer))
                                            }).then(() => {
                                                    return new Promise((resolve, reject) => {
                                                            resolve(archive.file(newFilePath, {name: newFileName}))
                                                        }
                                                    ).then(() => {
                                                        return resolve(newFilePath);
                                                    })
                                                }
                                            )
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
                Promise.all(orderPictures.map(orderPicture => downloadPictures(orderPicture))).then((imgPaths) => {
                    imgPaths.map((pathes, key) => {
                        if (key === orderPictures.length - 1) {
                            return new Promise((resolve, reject) => {
                                    resolve(archive.finalize())
                                }
                            ).then(() => {
                                resolve({fileName, filePath, imgPaths})
                            })
                        }
                    })
                })
            }
        )
    }

    deleteZip(path: string, imgPaths:string[]) {
        try {
            fs.unlinkSync(path);
            imgPaths.map((path)=>{
                fs.unlinkSync(path);
            })
        } catch (e) {
            console.log(e)
        }
    }
}


export default new ZipController();

