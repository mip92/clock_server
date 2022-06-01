import {
    AuthRegistrationBody,
    ChangeEmailBody,
    CreateMasterBody,
    CustomRequest,
    GetAllMastersQuery,
    GetFreeMastersQuerry,
    MasterId, UpdateMasterBody
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {MasterModel} from "../models/master.model";
import {CityModel} from "../models/city.model";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import Sequelize, {Attributes, FindAndCountOptions} from "sequelize";
import {Master, MasterCity, City, MasterBusyDate, ROLE, dbConfig} from '../models';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import mail from "../services/mailServiсe";
import ApiError from '../exeptions/api-error';
import tokenService from '../services/tokenServiсe';
import {MasterCityModel} from "../models/masterCity.model";
import {Op} from 'Sequelize';

class MasterController {
    async createMaster(req: CustomRequest<CreateMasterBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {name, email, citiesId} = req.body
            const citiesID: number[] = JSON.parse(citiesId)
            if (citiesID.length == 0) return next(ApiError.ExpectationFailed({
                value: citiesId,
                msg: `CitiesId field must have at least 1 items`,
                param: "citiesId",
                location: "body"
            }))
            const isEmailUniq: MasterModel | null = await Master.findOne({where: {email}})
            if (isEmailUniq) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `Master with this email is already registered`,
                param: "email",
                location: "body"
            }))
            const randomString: string = uuidv4();
            const password: string = randomString.slice(0, 6)
            const hashPassword: string = await bcrypt.hash(password, 5)
            const activationLink: string = uuidv4();
            // @ts-ignore
            const newMaster: MasterModel  = await Master.create({
                name,
                email,
                password: hashPassword,
                role: ROLE.Master,
                isActivated: false,
                isApproved: true,
                activationLink
            });
            await mail.sendActivationMail(email,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                newMaster.role,
                password.slice(0, 6)
            )
            const findOneCity = (cityId: number): Promise<CityModel | null> => {
                return new Promise(function (resolve, reject) {
                    resolve(City.findOne({where: {id: cityId}}))
                    reject(ApiError.BadRequest(`city with this id: ${cityId} is not found`))
                })
            }
            let count = 0
            Promise.all(citiesID.map(findOneCity))
                .then(results => {
                        results.map(city => {
                            count++
                            // @ts-ignore
                            city && MasterCity.create({masterId: newMaster.id, cityId: city.id})
                                .then(() => {
                                    if (count === citiesID.length) {
                                        Master.findOne({
                                            where: {email},
                                            attributes: {exclude: ['password', 'activationLink']},
                                            include: [{model: City}]
                                        }).then((master: MasterModel | null) => res.status(201).json(master))
                                    }
                                })
                        })
                    },
                    error => next(error)
                )
        } catch (e:any) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async getAllMasters(req: CustomRequest<null, null, GetAllMastersQuery, null>, res: Response, next: NextFunction) {
        try {
            const citiesID: "" | string[] | undefined = cities && cities.split(',');
            const options: Omit<FindAndCountOptions<Attributes<MasterModel>>, "group"> = {}
            options.where = {}
            if ((filter !== '') && (filter != undefined) && filter) { // @ts-ignore
                options.where[Op.or] = [{name: {[Op.iLike]: `%${filter}%`}}, {email: {[Op.iLike]: `%${filter}%`}}]
            }
            // @ts-ignore
            options.distinct = "Master.id"
            //options.where.isActivated = true
            //options.where.isApproved = true
            options.attributes = {exclude: ['password', 'activationLink']}
            if (limit && +limit > 50) options.limit = 50
            if (!offset) options.offset = 0
            if (sortBy && select) options.order = [[sortBy, select]]
            if (!cities) {
                options.include = {model: City, required: false}
            }
            if (cities) {
                options.include = [{
                    where: {id: citiesID},
                    model: City,
                    required: true
                }]
            }
            const masters: { rows: MasterModel[]; count: number} = await Master.findAndCountAll(options)
            if (!masters) return next(ApiError.BadRequest("Masters not found"))
            res.status(200).json(masters)
        } catch (e:any) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async getOneMaster(req: CustomRequest<null, MasterId, null, null>, res: Response, next: NextFunction) {
        try {
            const masterId = req.params.masterId
            const master: MasterModel | null = await Master.findOne({
                    include: {all: true},
                    where: {id: masterId},
                    attributes: {exclude: ['password', 'activationLink']},
                }
            )
            if (!master) return next(ApiError.BadRequest("Master not found"))
            res.status(200).json(master)
        } catch (e:any) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async updateMaster(req: CustomRequest<UpdateMasterBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {id, name, email, citiesId} = req.body 
            const isEmailUniq: MasterModel | null = await Master.findOne({where: {email}})
            if (isEmailUniq && isEmailUniq.id !== id) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `Master with this email is already registered`,
                param: "email",
                location: "body"
            }))

            //const citiesID: number[] = JSON.parse(citiesId)
            // @ts-ignore
            const citiesID: number[] = citiesId.split(',');
            if (!citiesID) return next(ApiError.ExpectationFailed({
                value: citiesId,
                msg: `CitiesId field must have at least 1 items`,
                param: "citiesId",
                location: "body"
            }))
            await MasterCity.destroy({where: {masterId: id}})
            const createMasterCity = (cityId: number): Promise<MasterCityModel> => {
                return new Promise(function (resolve, reject) {
                    // @ts-ignore
                    resolve(MasterCity.create({masterId: id, cityId: Number(cityId),createdAt: new Date(Date.now()), updatedAt: new Date(Date.now())}))
                    reject(ApiError.BadRequest(`city with this id: ${cityId} is not found`))
                })
            }
            let count = 0
            Promise.all(citiesID.map(createMasterCity))
                .then(results => {
                        results.map(() => {
                            count++
                            if (count === citiesID.length) Master.findOne({
                                    where: {id},
                                    include: [{model: City}],
                                    attributes: {exclude: ['password', 'activationLink']}
                                }
                            ).then((master: MasterModel | null) => {
                                master && master.update({name, email})
                                    .then((master: MasterModel) => res.status(200).json(master))
                            })
                        })
                    },
                    error => next(error)
                )
        } catch (e:any) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async deleteMaster(req: CustomRequest<null, MasterId, null, null>, res: Response, next: NextFunction) {
        try {
            const {masterId} = req.params
            if (!masterId) next(ApiError.BadRequest("id is not defined"))
            const candidate: MasterModel | null = await Master.findOne({where: {id: masterId}, include: [{ all: true }]})
            if (!candidate) next(ApiError.BadRequest(`master with id:${masterId} is not defined`))
            if (candidate) await candidate.destroy({ force: true })
            res.status(200).json({message: `master with id:${masterId} was deleted`, master: candidate})
        } catch (e:any) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async approveMaster(req: CustomRequest<null, MasterId, null, null>, res: Response, next: NextFunction) {
        try {
            const {masterId} = req.params
            if (!masterId) next(ApiError.BadRequest("id is not defined"))
            const master: MasterModel | null = await Master.findOne({where: {id: masterId}})
            if (!master) next(ApiError.BadRequest(`master with id:${masterId} is not defined`))
            if (master) {
                const isApprove: boolean = master.isApproved
                await master.update({isApproved: !isApprove})
                await mail.sendApproveMail(master.email, master.isApproved)
                res.status(200).json({message: `master with id:${masterId} changed status approve`, master})
            }
        } catch (e:any) {
            next(ApiError.BadRequest(e))
        }
    }

    /*async timeReservation(masterId, dateTime, cityId, next) {
        try {
            if (!masterId || !dateTime) next(ApiError.BadRequest("id is not defined"))
            let masterDateTime = await MasterBusyDate.findOne({where: {masterId, dateTime}})
            if (masterDateTime) next(ApiError.BadRequest("this master is already working at this time"))
            masterDateTime = await MasterBusyDate.create({masterId, dateTime: String(dateTime)})
            return masterDateTime
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }*/

    async getFreeMasters(req: CustomRequest<null, null, GetFreeMastersQuerry, null>, res: Response, next: NextFunction) {
        try {
            const {cityId, dateTime, clockSize, limit, offset} = req.query;
            if (+new Date(dateTime) < +Date.now()) return next(ApiError.BadRequest("The date may be later than the date now"))
            if (+clockSize > 3 || +clockSize < 1) next(ApiError.BadRequest("Max clockSize is 3"))
            if(!cityId) next(ApiError.BadRequest("cityId is required"))
            if(!dateTime) next(ApiError.BadRequest("dateTime is required"))
            if(!clockSize) next(ApiError.BadRequest("clockSize is required"))
            const masters: MasterModel[] = await Master.findAll({
                where: {
                    isActivated: true,
                    isApproved: true,
                },
                include: [{
                    where: {id: Number(cityId)},
                    model: City,
                    required: true
                }],
                order:[['rating', "DESC"]]
            })
            if (masters.length === 0) return next(ApiError.BadRequest("masters is not found"))

            const isThisTimeBusy = (cs: number, master: MasterModel): Promise<boolean> => {
                return new Promise((resolve, reject) => {
                    const time = new Date(dateTime)
                    time.setHours(time.getHours() + cs)
                    MasterBusyDate.findOne({
                        where: {
                            masterId: master.id,
                            dateTime: String(time.toISOString())
                        }
                    }).then((busy: MasterBusyDateModel | null) => {
                        if (busy) resolve(true)
                        resolve(false)
                    })
                })
            }

            const isMasterFree = (master: MasterModel): Promise<MasterModel> => {
                return new Promise((resolve, reject) => {
                    const arrayOfClockSize: number[] = Array.from({length: +clockSize}, (_, i) => i + 1)
                    Promise.all(arrayOfClockSize.map(cs => isThisTimeBusy(cs, master))).then((timeStatusArr) => {
                        timeStatusArr.map((timeStatus) => {
                            if (timeStatus) reject(master)
                        })
                        resolve(master)
                    })
                })
            }
            const allMasters = await Promise.allSettled(masters.map(master => isMasterFree(master)))
            let freeMasters: MasterModel[] = []
            allMasters.forEach(master => {
                if (master.status == 'fulfilled') freeMasters.push(master.value)
            })
            if (freeMasters.length === 0) return next(ApiError.BadRequest("masters is not found"))
            const mastersWithPagination = freeMasters.slice(+limit*+offset, (+limit*+offset)+(+limit))
            res.status(200).json(mastersWithPagination)
        } catch (e:any) {
            next(ApiError.BadRequest(e))
        }
    }

    async registration(req: CustomRequest<AuthRegistrationBody, null, null, null>, res: Response, next: NextFunction) {
        const {email, name, citiesId, firstPassword} = req.body
        if (!citiesId || citiesId.length === 0) return next(ApiError.ExpectationFailed({
            value: String(citiesId),
            msg: "Please mark your cities",
            param: "citiesId",
            location: "body"
        }))
        const isEmailUniq: MasterModel | null = await Master.findOne({where: {email}})
        if (isEmailUniq) return next(ApiError.ExpectationFailed({
            value: email,
            msg: "Master with this email is already registered",
            param: "email",
            location: "body"
        }))
        const hashPassword: string = await bcrypt.hash(firstPassword, 5)
        const activationLink: string = uuidv4();
        try {
            let result: MasterModel = await dbConfig.transaction(async (t: Sequelize.Transaction) => {
                const findCity = (cityId: number): Promise<CityModel> => {
                    return new Promise((resolve, reject) => {
                        City.findOne({where: {id: cityId}, transaction: t}).then((city: CityModel | null) => {
                                if (city === null) reject(`City with id: ${cityId} is not found`)
                                else return resolve(city)
                            }
                        ).catch((err: Error) => {

                            reject(err)
                        })
                    })
                }
                let count = 0
                return new Promise((resolve, reject) => {
                    // @ts-ignore
                    Master.create({
                        name,
                        email,
                        password: hashPassword,
                        role: "MASTER",
                        activationLink
                    }, {transaction: t})
                        .then((newMaster: MasterModel) => {
                                if (!newMaster) reject('Master creation error')
                                Promise.all(citiesId.map(cityId => findCity(cityId)))
                                    .then((cities: CityModel[]) => {
                                            cities.map((city: CityModel) => {
                                                MasterCity.create({
                                                        masterId: newMaster.id,
                                                        cityId: city.id
                                                    }, {transaction: t})
                                                        .then(() => {
                                                                count++
                                                                if (count === citiesId.length) {
                                                                    resolve(newMaster)
                                                                }
                                                            }
                                                        ).catch((err: Error) => {
                                                        console.log(err)
                                                    })
                                                }
                                            )
                                        }
                                    ).catch((err: Error) => {
                                    console.log(err)
                                })
                            }
                        ).catch((err: Error) => {
                        console.log(err)
                    })
                })
            }).catch((e: Error) => {
                console.log(e)
            })
            await mail.sendActivationMail(email,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                result.role
            )

            interface MasterModelWithCity extends MasterModel {
                dataValues?: CityModel
            }

            const master: MasterModelWithCity | null = await Master.findOne(
                {
                    where: {email: result.email},
                    attributes: {exclude: ['password', 'activationLink']},
                    include: [{model: City}]
                },
            )

            if (master) {
                const token: string = tokenService.generateJwt(master.id, master.email, master.role)
                return res.status(201).json({token})
            }
        } catch (err:any) {
            console.log(err)
            next(err)
        }
    }

    async changeEmail(req: CustomRequest<ChangeEmailBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {password, currentEmail, newEmail} = req.body
            const master: MasterModel | null = await Master.findOne({where: {email: currentEmail}})
            if (!master) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "Master is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            let comparePassword: boolean = bcrypt.compareSync(password, master.password)
            if (!comparePassword) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "Master is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            const activationLink: string = uuidv4();
            const changedMaster: MasterModel = await master.update({
                email: newEmail,
                isActivated: false,
                activationLink
            })
            const token: string = tokenService.generateJwt(changedMaster.id, changedMaster.email, changedMaster.role)
            await mail.sendActivationMail(newEmail,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                changedMaster.role)
            return res.status(200).json({token})
        } catch (e:any) {
            next(ApiError.Internal(`server error`))
        }
    }
}
export default new MasterController()
//module.exports = new MasterController()
