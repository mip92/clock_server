const {Master, MasterCity, City, MasterBusyDate} = require('../models/models')
const ApiError = require('../exeptions/api-error')
const {where} = require("sequelize");
const uuid = require('uuid')
const bcrypt = require('bcrypt')
let mail = require("../services/mailServiсe");

/*const dateToString = (date) => {
    const validDate = new Date(date)
    return `${validDate.getFullYear()}:${validDate.getMonth() + 1}:${validDate.getDate()}:${validDate.getHours()}`
}*/

class MasterController {
    async createMaster(req, res, next) {
        try {
            const {name, email, cities_id} = req.body
            const citiesId = cities_id.split(',');
            const isEmailUniq = await Master.findOne({where: {email}})
            if (isEmailUniq) return next(ApiError.BadRequest("Master with this email is already registered"))
            const password = uuid.v4();
            const hashPassword = await bcrypt.hash(password.slice(0, 6), 5)
            const newMaster = await Master.create({
                name,
                email,
                password: hashPassword,
                role: "MASTER",
                isActivated: false,
                isApproved: true
            });
            const activationLink = uuid.v4();
            await mail.sendActivationMail(email,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                newMaster.role,
                password.slice(0, 6)
            )
            for (let i = 0; i < citiesId.length; i++) {
                const city = await City.findOne({where: {id: Number(citiesId[i])}})
                if (!city) return next(ApiError.BadRequest(`city with this ${citiesId[i]} is not found`))
                await MasterCity.create({masterId: newMaster.id, cityId: citiesId[i]})
            }
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
                    where:{isActivated:true}, //отображать мастеров которые подтвердили свою почту
                    include: {model: City, required: false},
                    limit,
                    offset
                })
                const c = await Master.count({
                    limit,
                    offset
                })
                masters = {count: c, rows: m}
            }
            if (city_id) masters = await Master.findAndCountAll({
                include: [{
                    where: {id: city_id,
                        isActivated:true,//отображать мастеров которые подтвердили свою почту
                        isApproved: true //отображать мастеров которых подтвердил администратор
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
            const {id, name, email, cities_id} = req.body
            const citiesId = cities_id.split(',');
            await MasterCity.destroy({where: {masterId: id}})
            for (let i = 0; i < citiesId.length; i++) {
                await MasterCity.create({masterId: id, cityId: Number(citiesId[i])})
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
            const approve = master.isApproved
            await master.update({isApproved: !approve})
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
            masterDateTime = await MasterBusyDate.create({masterId,dateTime: String(dateTime)})
            return masterDateTime
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    /*    async getFreeMasters(req, res, next) {
            try {
                const {cityId, dateTime, clockSize} = req.body
                if (+new Date(dateTime) < +Date.now()) return next(ApiError.BadRequest("the date may be later than the date now"))
                console.log(dateTime)
                if (clockSize > 3 || clockSize < 1) next(ApiError.BadRequest("max clockSize is 3"))
                let masters = await Master.findAll({
                    include: [{
                        where: {id: Number(cityId)},
                        model: City,
                        required: true
                    }],
                })
                if (masters.length === 0) return next(ApiError.BadRequest("masters is not found"))

                let freeMasters = masters
                let time = dateTime
                for (let cs = 0; cs < clockSize; cs++) {
                    time = dateToString(new Date(new Date(dateTime).getTime() + 3600000 * cs))
                    if ((new Date(dateTime)).getHours() + cs > 20) return next(ApiError.BadRequest("masters is not found"))
                    for (let m = 0; m < masters.length; m++) {
                        let theRightTime = await MasterBusyDate.findOne({
                            where: {
                                masterId: masters[m].id,
                                dateTime: time
                            }
                        })
                        if (theRightTime) freeMasters = freeMasters.filter(master => master.id !== theRightTime.masterId)
                    }
                }
                res.status(200).json(freeMasters)
            } catch (e) {
                next(ApiError.BadRequest(e.parent.detail))
            }
        }*/
    async getFreeMasters(req, res, next) {
        try {
            const {cityId, dateTime, clockSize} = req.body
            if (+new Date(dateTime) < +Date.now()) return next(ApiError.BadRequest("the date may be later than the date now"))
            if (clockSize > 3 || clockSize < 1) next(ApiError.BadRequest("max clockSize is 3"))
            let masters = await Master.findAll({
                where:{
                    isActivated:true,//отображать мастеров которые подтвердили свою почту
                    isApproved: true,//отображать мастеров которых подтвердил админ
                },
                include: [{
                    where: {id: Number(cityId)},
                    model: City,
                    required: true
                }],
            })
            if (masters.length === 0) return next(ApiError.BadRequest("masters is not found"))
            const freeMasters=[]
            for (let i = 0; i <masters.length ; i++) {
                let isThisMasterBusy = false
                for (let cs = 0; cs < clockSize; cs++) {
                    const time = new Date(dateTime)
                    time.setHours(time.getHours()+cs)
                    let busy= await MasterBusyDate.findOne({where:{
                            masterId:masters[i].id,
                            dateTime: String(time.toISOString())
                        }})
                    console.log(busy)
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
}

module.exports = new MasterController()