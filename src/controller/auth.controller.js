const ApiError = require('../exeptions/api-error')
const {Admin} = require('../models/models')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


class AuthController {

    async registration(req, res, next) {
        const {email, name, firstPassword, secondPassword, isRulesChecked, isMaster, citiesId} = req.body
        if (firstPassword !== secondPassword) {
            return next(ApiError.BadRequest('Passwords do not match'))
        }
        if (!isRulesChecked) {
            return next(ApiError.BadRequest('Use of service rules is not confirmed'))
        }

        if (!isMaster) {
            let user = await User.findOne({where: {email}})
            if (user) return next(ApiError.BadRequest('Пользователь с такиой почтой уже зарегестрирован'))
            if (!user) {
                const hashPassword = await bcrypt.hash(firstPassword, 5)
                const user = await User.create({
                    password: hashPassword,
                    email,
                    role: "USER",
                    name,
                })
                const token = generateJwt(user.id, user.email, user.role)
                return res.status(200).json({token})
            }
        }
        else{
            if (citiesId.length === 0)return next(ApiError.BadRequest('Please mark your cities'))
            const citiesId = citiesId.split(',');
            const isEmailUniq = await Master.findOne({where: {email}})
            if (isEmailUniq) return next(ApiError.BadRequest("Master with this email is already registered"))
            const newMaster = await Master.create({name, email});
            for (let i = 0; i < citiesId.length; i++) {
                const city = await City.findOne({where: {id: Number(citiesId[i])}})
                if (!city) return next(ApiError.BadRequest(`city with this ${citiesId[i]} is not found`))
                await MasterCity.create({masterId: newMaster.id, cityId: citiesId[i]})
            }
            const master = await Master.findOne({where: {email}, include: [{model: City}]})
            console.log(master)
            return res.status(201).json(master)
        }
    }
}

module.exports = new AuthController()