const jwt = require('jsonwebtoken')
const sequelize = require("../db");
const {Master, MasterCity, City, MasterBusyDate} = require('../models/models')
const CityController = require('../controller/city.controller')
const ApiError = require('../exeptions/api-error')
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const mail = require("../services/mailServiсe");
const tokenService = require('../services/tokenServiсe')


const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class MasterController {
    async createMaster(req, res, next) {
        try {
            const {name, email, citiesId} = req.body
            const citiesID = JSON.parse(citiesId)
            const isEmailUniq = await Master.findOne({where: {email}})
            if (citiesID.length==0) return next(ApiError.ExpectationFailed({
                value: citiesId,
                msg: `CitiesId field must have at least 1 items`,
                param: "citiesId",
                location: "body"
            }))
            if (isEmailUniq) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `Master with this email is already registered`,
                param: "email",
                location: "body"
            }))
            const password = uuid.v4();
            const hashPassword = await bcrypt.hash(password.slice(0, 6), 5)
            const activationLink = uuid.v4();
            const newMaster = await Master.create({
                name,
                email,
                password: hashPassword,
                role: "MASTER",
                isActivated: false,
                isApproved: true,
                activationLink
            });
            await mail.sendActivationMail(email,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                newMaster.role,
                password.slice(0, 6)
            )
            const findOneCity = (citiesID) => {
                return new Promise(function (resolve, reject) {
                    resolve(City.findOne({where: {id: citiesID}}))
                    reject(ApiError.BadRequest(`city with this id: ${citiesID} is not found`))
                })
            }
            Promise.all(citiesID.map(findOneCity))
                .then(results => {
                        results.map(city => MasterCity.create({masterId: newMaster.id, cityId: city.id}))
                    },
                    error => next(error)
                )
            const master = await Master.findOne({where: {email}, include: [{model: City}]})
            return res.status(201).json(master)
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async getAllMasters(req, res, next) {
        try {
            let {limit, offset, city_id} = req.query
            if (limit > 50) limit = 50
            if (!offset) offset = 0
            let masters
            if (!city_id) {
                const m = await Master.findAll({
                    where: {isActivated: true}, //отображать мастеров которые подтвердили свою почту
                    include: {model: City, required: false},
                    limit,
                    offset
                })
                const c = await Master.count({
                    where: {isActivated: true},
                    limit,
                    offset
                })
                masters = {count: c, rows: m}
            }
            if (city_id) masters = await Master.findAndCountAll({
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
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async getOneMaster(req, res, next) {
        try {
            const masterId = req.params.masterId
            const master = await Master.findOne({
                    include: {all: true},
                    where: {id: masterId},
                }
            )
            if (!master) return next(ApiError.BadRequest("Master not found"))
            res.status(200).json(master)
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async updateMaster(req, res, next) {
        try {
            const {id, name, email, citiesId} = req.body
            const isEmailUniq = await Master.findOne({where: {email}})
            if (isEmailUniq && isEmailUniq.id!==id) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `Master with this email is already registered`,
                param: "email",
                location: "body"
            }))

            const citiesID = citiesId.split(',');
            if (!citiesID) return next(ApiError.ExpectationFailed({
                value: citiesId,
                msg: `CitiesId field must have at least 1 items`,
                param: "citiesId",
                location: "body"
            }))
            await MasterCity.destroy({where: {masterId: id}})
            for (let i = 0; i < citiesID.length; i++) {
                await MasterCity.create({masterId: id, cityId: Number(citiesID[i])})
            }
            const master = await Master.findOne({where: {id}, include: [{model: City}]})
            await master.update({name, email})
            console.log(master)
            res.status(200).json(master.dataValues)
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async deleteMaster(req, res, next) {
        try {
            const {masterId} = req.params
            if (!masterId) next(ApiError.BadRequest("id is not defined"))
            const candidate = await Master.findOne({where: {id: masterId}})
            if (!candidate) next(ApiError.BadRequest(`master with id:${masterId} is not defined`))
            await MasterBusyDate.destroy({where: {masterId}})
            await Master.destroy({where: {id: masterId}})
            res.status(200).json({message: `master with id:${masterId} was deleted`, master: candidate})
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async approveMaster(req, res, next) {
        try {
            const {masterId} = req.params
            if (!masterId) next(ApiError.BadRequest("id is not defined"))
            const master = await Master.findOne({where: {id: masterId}})
            if (!master) next(ApiError.BadRequest(`master with id:${masterId} is not defined`))
            const isApprove = master.isApproved
            await master.update({isApproved: !isApprove})
            await mail.sendApproveMail(master.email, master.isApproved)
            res.status(200).json({message: `master with id:${masterId} changed status approve`, master})
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async timeReservation(masterId, dateTime, cityId, next) {
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
    }
    async getFreeMasters(req, res, next) {
        try {
            const {cityId, dateTime, clockSize} = req.body
            if (+new Date(dateTime) < +Date.now()) return next(ApiError.BadRequest("the date may be later than the date now"))
            if (clockSize > 3 || clockSize < 1) next(ApiError.BadRequest("max clockSize is 3"))
            const masters = await Master.findAll({
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
                    const busy = await MasterBusyDate.findOne({
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
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async registration(req, res, next) {
        const {email, name, citiesId, firstPassword} = req.body
        if (citiesId.length === 0) return next(ApiError.ExpectationFailed({
            value: citiesId,
            msg: "Please mark your cities",
            param: "citiesId",
            location: "body"
        }))
        const isEmailUniq = await Master.findOne({where: {email}})
        if (isEmailUniq) return next(ApiError.ExpectationFailed({
            value: email,
            msg: "Master with this email is already registered",
            param: "email",
            location: "body"
        }))
        const hashPassword = await bcrypt.hash(firstPassword, 5)
        const activationLink = uuid.v4();
        try {
            let result = await sequelize.transaction(async (t) => {
                const newMaster = await Master.create({
                    name,
                    email,
                    password: hashPassword,
                    role: "MASTER",
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
            const master = await Master.findOne({where: {email: result.email}, include: [{model: City}]})
            const token = tokenService.generateJwt(master.id, master.email, master.role)
            return res.status(201).json({token})
        } catch (err) {
            next(err)
        }
    }

    async changeEmail(req, res, next) {
        try {
            const {password, currentEmail, newEmail} = req.body
            const master = await Master.findOne({where: {email: currentEmail}})
            if (!master) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "Master is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            let comparePassword = bcrypt.compareSync(password, master.password)
            if (!comparePassword) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "Master is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            const activationLink = uuid.v4();
            const changedMaster = await master.update({email: newEmail, isActivated: false, activationLink})
            const token = generateJwt(changedMaster.id, changedMaster.email, changedMaster.role)
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