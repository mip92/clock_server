const {User} = require('../models/models')
const ApiError = require('../exeptions/api-error')
const tokenService = require('../services/tokenServiсe')
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mail = require("../services/mailServiсe");

const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class UserController {
    async createUser(req, res, next) {
        try {
            const {email, name} = req.body
            const isUserUnique = await User.findOne({where: {email}})
            if (isUserUnique) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `User with this email is already registered`,
                param: "email",
                location: "body"
            }))
            else {
                const password = uuid.v4();
                const hashPassword = await bcrypt.hash(password.slice(0, 6), 5)
                const activationLink = uuid.v4();
                const newUser = await User.create({
                    password: hashPassword,
                    email,
                    role: ROLE.User,
                    name,
                    activationLink
                })
                await mail.sendActivationMail(email, activationLink, ROLE.User, password.slice(0, 6))
                return res.status(201).json(newUser)
            }
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async findUser(req, res, next) {
        try {
            const {email} = req.query
            const isUserCreated = await User.findOne({where: {email}})
            if (isUserCreated) return next(ApiError.BadRequest("User with this email is already registered"))
            else res.status(200).json(email)
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }


    async getAllUsers(req, res, next) {
        try {
            let {limit, offset} = req.query
            if (limit > 50) limit = 50
            if (!offset) offset = 0
            let users = await User.findAndCountAll({limit, offset})
            if (!users) return next(ApiError.BadRequest("Users not found"))
            res.status(200).json(users)
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async getOneUser(req, res, next) {
        try {
            const userId = req.params.userId
            const user = await User.findOne({
                    include: {all: true},
                    where: {id: userId},
                }
            )
            if (!user) return next(ApiError.BadRequest("User not found"))
            res.status(200).json(user)
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async updateUser(req, res, next) {
        try {
            const {id, newEmail, newName} = req.body
            const user = await User.findOne({where: {id}})
            if (!user) return next(ApiError.ExpectationFailed({
                value: newEmail,
                msg: `User with this id is not found`,
                param: "newEmailOfUser",
                location: "body"
            }))
            const isUserUnique = await User.findOne({where: {email: newEmail}})
            if (isUserUnique && isUserUnique.id !== id) {
                return  res.status(417).json({message: `User with this email is already registered`})
            } else await user.update({email: newEmail, name: newName})
            const newUser = {id, email: newEmail, name: newName}
            res.status(200).json(newUser)
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async deleteUser(req, res, next) {
        try {
            const {userId} = req.params
            if (!userId) next(ApiError.BadRequest("id is not defined"))
            const candidate = await User.findOne({where: {id: userId}})
            if (!candidate) next(ApiError.BadRequest(`user with id:${userId} is not defined`))
            await User.destroy({where: {id: userId}})
            res.status(200).json({message: `user with id:${userId} was deleted`, user: candidate})
        } catch (e) {
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async registration(req, res, next) {
        try {
            const {email, name, firstPassword} = req.body
            const user = await User.findOne({where: {email}})
            if (user) return next(ApiError.ExpectationFailed({
                value: email,
                msg: "User with this email is already registered",
                param: "email",
                location: "body"
            }))
            if (!user) {
                const hashPassword = await bcrypt.hash(firstPassword, 5)
                const activationLink = uuid.v4();
                const user = await User.create({
                    password: hashPassword,
                    email,
                    role: ROLE.User,
                    name,
                    activationLink
                })
                await mail.sendActivationMail(email,
                    `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                    user.role)
                const token = tokenService.generateJwt(user.id, user.email, user.role)
                return res.status(201).json({token})
            }
        } catch (e) {
            console.log(e)
            next(ApiError.BadRequest(e.parent.detail))
        }
    }

    async changeEmail(req, res, next) {
        try {
            const {password, currentEmail, newEmail} = req.body
            const user = await User.findOne({where: {email: currentEmail}})
            if (!user) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "User is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "User is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            const activationLink = uuid.v4();
            const changedUser = await user.update({email: newEmail, isActivated: false, activationLink})
            const token = generateJwt(changedUser.id, changedUser.email, changedUser.role)
            await mail.sendActivationMail(newEmail,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                changedUser.role)
            return res.status(200).json({token})
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new UserController()