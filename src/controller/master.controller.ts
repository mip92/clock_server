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
import {PictureModel} from "../models/picture.model";

const sequelize = require("../db");
const {Master, MasterCity, City, MasterBusyDate, ROLE} = require('../models/index');
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
                                    if (count == citiesID.length) {
                                        Master.findOne({
                                            where: {email},
                                            include: [{model: City}]
                                        }).then((master: MasterModel) => res.status(201).json(master))
                                    }
                                })
                        })
                    },
                    error => next(error)
                )
            /*const master = await Master.findOne({where: {email}, include: [{model: City}]})
            return res.status(201).json(master)*/
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
                    where: {isActivated: true}, //отображать мастеров которые подтвердили свою почту
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
                            if (count == citiesID.length) Master.findOne({where: {id}, include: [{model: City}]})
                                .then((master: MasterModel) => {
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
            const master:MasterModel = await Master.destroy({where: {id: masterId}})
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
            const freeMasters = []
            for (let i = 0; i < masters.length; i++) {
                let isThisMasterBusy = false
                for (let cs = 0; cs < clockSize; cs++) {
                    const time = new Date(dateTime)
                    time.setHours(time.getHours() + cs)
                    const busy: MasterBusyDateModel = await MasterBusyDate.findOne({
                        where: {
                            masterId: masters[i].id,
                            dateTime: String(time.toISOString())
                        }
                    })
                    if (busy) isThisMasterBusy = true
                }
                if (!isThisMasterBusy) freeMasters.push(masters[i])
            }
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
            let result: MasterModel = await sequelize.transaction(async (t:Sequelize.Transaction) => {
                const newMaster: MasterModel = await Master.create({
                    name,
                    email,
                    password: hashPassword,
                    role: ROLE.Master,
                    activationLink
                }, {transaction: t});
                if (!newMaster) throw new Error('Error with creating master');
                for (let i = 0; i < citiesId.length; i++) {
                    const city = await City.findOne({where: {id: citiesId[i]}, transaction: t})
                    if (!city) throw ApiError.BadRequest(`city with this id :${citiesId[i]} is not found`);
                    await MasterCity.create({masterId: newMaster.id, cityId: citiesId[i]}, {transaction: t})
                }
                return newMaster
            });
            await mail.sendActivationMail(email,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                result.role
            )
            interface MasterModelWithCity extends MasterModel{
                dataValues: CityModel
            }
            const master: MasterModelWithCity = await Master.findOne(
                {where: {email: result.email}, include: [{model: City}]})
            const token:string = tokenService.generateJwt(master.id, master.email, master.role)
            return res.status(201).json({token})
        } catch (err) {
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
            const changedMaster: MasterModel = await master.update({email: newEmail, isActivated: false, activationLink})
            const token: string = tokenService.generateJwt(changedMaster.id, changedMaster.email, changedMaster.role)
            await mail.sendActivationMail(newEmail,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                changedMaster.role)
            return res.status(200).json({token})
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new MasterController()