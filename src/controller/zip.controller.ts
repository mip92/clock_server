import archiver from 'archiver';
import path from "path";
import fs from 'fs';
import {v4 as uuidv4} from "uuid";
import axios from "axios";
import {OrderPictureWithPicture} from "./order.controller";
import {promisify} from "util";
import * as stream from "stream";
import ErrnoException = NodeJS.ErrnoException;

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
                    zlib: {level: 9} // установить уровень сжатия
                })
                output.on('close', function () {
                    console.log(`Всего ${archive.pointer()} байт`)
                    console.log('архиватор завершил архивирование файла, дескриптор потока вывода файла закрыт')
                })
                output.on('end', function () {
                    console.log('Источник данных исчерпан')
                })
                archive.on('warning', function (err) {
                    if (err.code === 'ENOENT') {
                        console.warn('Сбои статов и другие неблокирующие ошибки')
                    } else {
                        throw err
                    }
                })
                archive.on('error', function (err) {
                    throw err
                })
                archive.pipe(output)

                /*for (let i = 0; i < orderPictures.length; i++) {
                    const newFileName: string = orderPictures[i].picture.path
                    const directoryOfNewFilePath: string = path.resolve(__dirname, '..', 'static')
                    if (!fs.existsSync(directoryPath)) {
                        fs.mkdirSync(directoryPath, {recursive: true})
                    }
                    const newFilePath: string = path.resolve(directoryOfNewFilePath, newFileName)
                    const finishedDownload = promisify(stream.finished);
                    const writer = fs.createWriteStream(newFilePath)
                    const response = await axios({
                        url: `https://res.cloudinary.com/mip92/image/upload/v1650010431/${orderPictures[i].picture.path}`,
                        method: "GET",
                        responseType: "stream"
                    })
                    await response.data.pipe(writer)
                    await finishedDownload(writer);
                    archive.file(newFilePath, {name: newFilePath})
                }
                await archive.finalize()*/

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
                                url: `https://res.cloudinary.com/mip92/image/upload/v1650010431/${orderPicture.picture.path}`,
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
                                                            resolve(archive.file(newFilePath, {name: newFilePath}))
                                                        }
                                                    ).then(() => {
                                                        // @ts-ignore
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
        console.log(path, imgPaths)
        try {
            fs.unlink(path, (err: ErrnoException | null) => {
                console.log(err)
            });
            imgPaths.map((path)=>{
                fs.unlink(path, (err: ErrnoException | null) => {
                    console.log(err)
                });
            })
        } catch (e) {
            console.log(e)
        }
    }
}


export default new ZipController();

