const ApiError = require('../exeptions/api-error')
const {Admin, User, Master} = require('../models/models')
const Status = require('../services/status.service')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class AdminController {

    async login(req, res, next) {
        try {
            const admin = await Admin.findAll()
            if (!admin) {
                const email = process.env.ADMIN_EMAIL
                const password = process.env.ADMIN_PASSWORD
                const hashPassword = await bcrypt.hash(password, 5)
                await Admin.create({email, password: hashPassword})
                const statuses = await Status.getAllStatuses()
                if (!statuses) {
                    await Status.createStatuses()
                }
            }
            const {email, password} = req.body
            let user = await User.findOne({where: {email}})
            if (!user) user = await Master.findOne({where: {email}})
            if (!user) user = await Admin.findOne({where: {email}})
            if (!user) return next(ApiError.BadRequest('User is not found or password is wrong'))
            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) return next(ApiError.BadRequest('User is not found or password is wrong'))
            const token = generateJwt(user.id, user.email, user.role)
            return res.status(200).json({token})
        }catch (e) {
            console.log(e)
        }
    }
}

module.exports = new AdminController()