const ApiError = require('../exeptions/api-error')
const {Master, User, City, MasterCity} = require('../models/models')
const tokenService = require("../services/tokenServiсe")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const uuid = require('uuid')
let mail = require("../services/mailServiсe");


class AuthController {
    async registration(req, res, next) {
        try {
            const {email, name, firstPassword, secondPassword, isRulesChecked, isMaster, citiesId} = req.body
            if (firstPassword !== secondPassword) {
                return next(ApiError.BadRequest('Passwords do not match'))
            }
            if (!isRulesChecked) {
                return next(ApiError.BadRequest('Use of service rules is not confirmed'))
            }

            if (!isMaster) {
                let user = await User.findOne({where: {email}})
                if (user) return next(ApiError.BadRequest('User with this email is already registered'))
                if (!user) {
                    const hashPassword = await bcrypt.hash(firstPassword, 5)
                    const activationLink = uuid.v4();
                    const user = await User.create({
                        password: hashPassword,
                        email,
                        role: "USER",
                        name,
                        activationLink
                    })
                    await mail.sendActivationMail(email,
                        `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                        user.role)
                    const token = tokenService.generateJwt(user.id, user.email, user.role)
                    return res.status(201).json({token})
                }
            } else {
                if (citiesId.length === 0) return next(ApiError.BadRequest('Please mark your cities'))
                const isEmailUniq = await Master.findOne({where: {email}})
                if (isEmailUniq) return next(ApiError.BadRequest("Master with this email is already registered"))
                const hashPassword = await bcrypt.hash(firstPassword, 5)
                const activationLink = uuid.v4();
                const newMaster = await Master.create({
                    name,
                    email,
                    password: hashPassword,
                    role: "MASTER",
                    activationLink
                });
                await mail.sendActivationMail(email,
                    `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                    newMaster.role
                )
                for (let i = 0; i < citiesId.length; i++) {
                    const city = await City.findOne({where: {id: Number(citiesId[i])}})
                    if (!city) return next(ApiError.BadRequest(`city with this ${citiesId[i]} is not found`))
                    await MasterCity.create({masterId: newMaster.id, cityId: citiesId[i]})
                }
                const master = await Master.findOne({where: {email}, include: [{model: City}]})
                const token = tokenService.generateJwt(master.id, master.email, master.role)
                return res.status(201).json({token})
            }
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            let user = await User.findOne({where: {activationLink}})
            if (!user) user = await Master.findOne({where: {activationLink}})
            if (!user) return next(ApiError.BadRequest('Incorrect activation link'))
            await user.update({isActivated: true})
            return res.redirect(process.env.CLIENT_URL);
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }
}

module.exports = new AuthController()