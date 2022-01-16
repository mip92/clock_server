const {User, Master, City, MasterCity, MasterBusyDate} = require('../models/models')
const ApiError = require('../exeptions/api-error')


class UserController {
    async createUser(req, res, next) {
        try {
            const {email, name} = req.body
            const isUserCreated = await User.findOne({where: {email}})
            if (isUserCreated) return res.status(201).json(isUserCreated)
            else {
                const newUser = await User.create({name, email});
                return res.status(201).json(newUser)
            }
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
            if (!user) return next(ApiError.BadRequest("User not found"))
            const isEmailUniq = await User.findOne({where: {email: newEmail}})
            if (isEmailUniq) return next(ApiError.BadRequest("User with this email is already be exist"))
            await user.update({email: newEmail, name: newName})
            const newUser = {id, email:newEmail, name:newName}
            res.status(200).json(newUser)
        } catch (e) {
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
}

module.exports = new UserController()