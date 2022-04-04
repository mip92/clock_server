const ApiError = require('../exeptions/api-error');
const {Master, User, City, MasterCity, Admin, Status} = require('../models/models');
const userController = require("../controller/user.controller");
const masterController = require("../controller/master.controller");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const statusService = require('../services/status.service')

const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class AuthController {

    async login(req, res, next) {
        try {
            const admin = await Admin.findAll()
            if (admin.length===0) {
                const email = process.env.ADMIN_EMAIL
                const password = process.env.ADMIN_PASSWORD
                const hashPassword = await bcrypt.hash(password, 5)
                await Admin.create({email, password: hashPassword})
                const statuses = await statusService.getAllStatuses()
                if (statuses.length===0) {
                    await statusService.createStatuses()
                }
            }
            const {email, password} = req.body
            let user = await User.findOne({where: {email}})
            if (!user) user = await Master.findOne({where: {email}})
            if (!user) user = await Admin.findOne({where: {email}})
            if (!user) return next(ApiError.BadRequestJSON({
                value: email,
                msg: "User is not found or password is wrong",
                param: "email",
                location: "body"
            }))
            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) return next(ApiError.BadRequestJSON({
                value: email,
                msg: "User is not found or password is wrong",
                param: "email",
                location: "body"
            }))
            const token = generateJwt(user.id, user.email, user.role)
            return res.status(200).json({token})
        }catch (e) {
            console.log(e)
        }
    }
    async registration(req, res, next) {
        try {
            const {firstPassword, secondPassword, isRulesChecked, isMaster} = req.body
            if (firstPassword !== secondPassword) {
                return next(ApiError.BadRequest('Passwords do not match'))
            }
            if (!isRulesChecked) {
                return next(ApiError.BadRequest('Use of service rules is not confirmed'))
            }
            if (!isMaster) await userController.registration(req, res, next)
            else await masterController.registration(req, res, next)
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