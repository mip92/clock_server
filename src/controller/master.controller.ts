import {
    AuthRegistrationBody,
    ChangeEmailBody,
    CreateMasterBody,
    CustomRequest,
    GetAllMastersQuery,
    GetFreeMastersBody,
    MasterId, UpdateMasterBody
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {MasterModel} from "../models/master.model";
import {CityModel} from "../models/city.model";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import Sequelize from "sequelize";
import {dbConfig} from "../models";

const {Master, MasterCity, City, MasterBusyDate, ROLE} = require('../models');
const ApiError = require('../exeptions/api-error')
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const mail = require("../services/mailServiсe");
const tokenService = require('../services/tokenServiсe')

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
            const isEmailUniq: MasterModel = await Master.findOne({where: {email}})
            if (isEmailUniq) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `Master with this email is already registered`,
                param: "email",
                location: "body"
            }))
            const randomString: string = uuid.v4();
            const password: string = randomString.slice(0, 6)
            const hashPassword: string = await bcrypt.hash(password, 5)
            const activationLink: string = uuid.v4();
            const newMaster: MasterModel = await Master.create({
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
            const findOneCity = (cityId: number): Promise<CityModel> => {
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
                            MasterCity.create({masterId: newMaster.id, cityId: city.id})
                                .then(() => {
                                    if (count === citiesID.length) {
                                        Master.findOne({
                                            where: {email},
                                            attributes: {exclude: ['password', 'activationLink']},
                                            include: [{model: City}]
                                        }).then((master: MasterModel) => res.status(201).json(master))
                                    }
                                })
                        })
                    },
                    error => next(error)
                )
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async getAllMasters(req: CustomRequest<null, null, GetAllMastersQuery, null>, res: Response, next: NextFunction) {
        try {
            let {limit, offset, city_id} = req.query
            if (limit && +limit > 50) limit = '50'
            if (!offset) offset = '0'
            if (!city_id) {
                const masters: MasterModel[] = await Master.findAndCountAll({
                    where: {isActivated: true}, //display masters who have confirmed their mail
                    attributes: {exclude: ['password', 'activationLink']},
                    include: {model: City, required: false},
                    limit,
                    offset
                })
                if (!masters) return next(ApiError.BadRequest("Masters not found"))
                res.status(200).json(masters)
            }
            if (city_id) {
                const masters: MasterModel[] = await Master.findAndCountAll({
                    include: [{
                        where: {
                            id: city_id,
                            isActivated: true,
                            isApproved: true
                        },
                        model: City,
                        required: true
                    }],
                    attributes: {exclude: ['password', 'activationLink']},  ///
                    limit,
                    offset
                })
                if (!masters) return next(ApiError.BadRequest("Masters not found"))
                res.status(200).json(masters)
            }
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async getOneMaster(req: CustomRequest<null, MasterId, null, null>, res: Response, next: NextFunction) {
        try {
            const masterId = req.params.masterId
            const master: MasterModel = await Master.findOne({
                    include: {all: true},
                    where: {id: masterId},
                    attributes: {exclude: ['password', 'activationLink']},
                }
            )
            if (!master) return next(ApiError.BadRequest("Master not found"))
            res.status(200).json(master)
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async updateMaster(req: CustomRequest<UpdateMasterBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {id, name, email, citiesId} = req.body
            const isEmailUniq: MasterModel = await Master.findOne({where: {email}})
            if (isEmailUniq && isEmailUniq.id !== id) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `Master with this email is already registered`,
                param: "email",
                location: "body"
            }))
            const citiesID: number[] = JSON.parse(citiesId)
            //const citiesID: number[] = citiesId.split(',');
            if (!citiesID) return next(ApiError.ExpectationFailed({
                value: citiesId,
                msg: `CitiesId field must have at least 1 items`,
                param: "citiesId",
                location: "body"
            }))
            await MasterCity.destroy({where: {masterId: id}})
            const createMasterCity = (cityId: number): Promise<CityModel> => {
                return new Promise(function (resolve, reject) {
                    resolve(MasterCity.create({masterId: id, cityId: Number(cityId)}))
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
                            ).then((master: MasterModel) => {
                                master.update({name, email})
                                    .then((master: MasterModel) => res.status(200).json(master))
                            })
                        })
                    },
                    error => next(error)
                )
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e))
        }
    }

    async deleteMaster(req: CustomRequest<null, MasterId, null, null>, res: Response, next: NextFunction) {
        try {
            const {masterId} = req.params
            if (!masterId) next(ApiError.BadRequest("id is not defined"))
            const candidate: MasterModel = await Master.findOne({where: {id: masterId}})
            if (!candidate) next(ApiError.BadRequest(`master with id:${masterId} is not defined`))
            const masterBusyDate: MasterBusyDateModel = await MasterBusyDate.destroy({where: {masterId}})
            const master: MasterModel = await Master.destroy({where: {id: masterId}})
            res.status(200).json({message: `master with id:${masterId} was deleted`, master: candidate})
        } catch (e) {
            next(ApiError.BadRequest(e))
        }
    }

    async approveMaster(req: CustomRequest<null, MasterId, null, null>, res: Response, next: NextFunction) {
        try {
            const {masterId} = req.params
            if (!masterId) next(ApiError.BadRequest("id is not defined"))
            const master: MasterModel = await Master.findOne({where: {id: masterId}})
            if (!master) next(ApiError.BadRequest(`master with id:${masterId} is not defined`))
            const isApprove: boolean = master.isApproved
            await master.update({isApproved: !isApprove})
            await mail.sendApproveMail(master.email, master.isApproved)
            res.status(200).json({message: `master with id:${masterId} changed status approve`, master})
        } catch (e) {
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

    async getFreeMasters(req: CustomRequest<GetFreeMastersBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {cityId, dateTime, clockSize} = req.body
            if (+new Date(dateTime) < +Date.now()) return next(ApiError.BadRequest("The date may be later than the date now"))
            if (clockSize > 3 || clockSize < 1) next(ApiError.BadRequest("Max clockSize is 3"))
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
            })
            if (masters.length === 0) return next(ApiError.BadRequest("masters is not found"))

            const isThisTimeBusy = (cs: number, master: MasterModel): Promise<boolean> => {
                return new Promise((resolve, reject) => {
                    const time = new Date(dateTime)
                    let count = 0
                    time.setHours(time.getHours() + cs)
                    MasterBusyDate.findOne({
                        where: {
                            masterId: master.id,
                            dateTime: String(time.toISOString())
                        }
                    }).then((busy: MasterBusyDateModel) => {
                        console.log(!!busy)
                        if (busy) resolve(true)
                        resolve(false)
                    })
                })
            }

            const isMasterFree = (master: MasterModel): Promise<MasterModel> => {
                return new Promise((resolve, reject) => {
                    const arrayOfClockSize: number[] = Array.from({length: clockSize}, (_, i) => i + 1)
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
            res.status(200).json(freeMasters)
        } catch (e) {
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
        const isEmailUniq: MasterModel = await Master.findOne({where: {email}})
        if (isEmailUniq) return next(ApiError.ExpectationFailed({
            value: email,
            msg: "Master with this email is already registered",
            param: "email",
            location: "body"
        }))
        const hashPassword: string = await bcrypt.hash(firstPassword, 5)
        const activationLink: string = uuid.v4();
        try {
            let result: MasterModel = await dbConfig.transaction(async (t: Sequelize.Transaction) => {
                const findCity = (cityId: number): Promise<CityModel> => {
                    return new Promise((resolve, reject) => {
                        City.findOne({where: {id: cityId}, transaction: t}).then((city: CityModel) => {
                                if (city === null) reject(`City with id: ${cityId} is not found`)
                                return resolve(city)
                            }
                        ).catch((err: Error) => {
                            console.log(99)
                            reject(err)
                        })
                    })
                }
                let count = 0
                return new Promise((resolve, reject) => {
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
                                                                console.log(count, citiesId.length)
                                                                if (count === citiesId.length) {
                                                                    resolve(newMaster)
                                                                }
                                                            }
                                                        ).catch((err: Error) => {
                                                        console.log(88)
                                                        console.log(err)
                                                    })
                                                }
                                            )
                                        }
                                    ).catch((err: Error) => {
                                    console.log(77)
                                    console.log(err)
                                })
                            }
                        ).catch((err: Error) => {
                        console.log(66)
                        console.log(err)
                    })
                })
            }).catch((e: Error) => {
                console.log(55)
                console.log(e)
            })
            console.log(result)
            await mail.sendActivationMail(email,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                result.role
            )

            interface MasterModelWithCity extends MasterModel {
                dataValues: CityModel
            }

            const master: MasterModelWithCity = await Master.findOne(
                {
                    where: {email: result.email},
                    attributes: {exclude: ['password', 'activationLink']},
                    include: [{model: City}]
                },
            )
            console.log(master)
            const token: string = tokenService.generateJwt(master.id, master.email, master.role)
            return res.status(201).json({token})
        } catch
            (err) {
            console.log(err)
            next(err)
        }
    }

    async changeEmail(req: CustomRequest<ChangeEmailBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {password, currentEmail, newEmail} = req.body
            const master: MasterModel = await Master.findOne({where: {email: currentEmail}})
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
            const activationLink: string = uuid.v4();
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
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new MasterController()