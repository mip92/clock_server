const ApiError = require('../exeptions/api-error')
const {Admin} = require('../models/models')
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
        const adminLength = await Admin.findAll()
        if(adminLength.length===0){
            const email = process.env.ADMIN_EMAIL
            const password = process.env.ADMIN_PASSWORD
            const hashPassword = await bcrypt.hash(password, 5)
            await Admin.create({email, password: hashPassword})
        }
        const {email, password} = req.body
        const admin = await Admin.findOne({where: {email}})
        if (!admin) {
            return next(ApiError.BadRequest('User is not found or password is wrong'))
        }
        let comparePassword = bcrypt.compareSync(password, admin.password)
        if (!comparePassword) {
            return next(ApiError.BadRequest('User is not found or password is wrong'))
        }
        const token = generateJwt(admin.id, admin.email, admin.role)
        return res.status(200).json({token})
    }
}

module.exports = new AdminController()