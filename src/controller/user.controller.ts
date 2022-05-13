import {
    AuthRegistrationBody,
    ChangeEmailBody, CreateUserBody,
    CustomRequest,
    DeleteUserParams, FindUserQuery, GetOneUserParams,
    LimitOffsetType,
    UpdateUserBody
} from "../interfaces/RequestInterfaces";
import {NextFunction, Response} from "express";
import {UserModel} from "../models/user.model";
import {Attributes, FindAndCountOptions} from "sequelize";
import {OrderModel} from "../models/order.model";

const {User, ROLE, Order} = require('../models/index');
const ApiError = require('../exeptions/api-error')
const tokenService = require('../services/tokenServiсe')
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const mail = require("../services/mailServiсe");
const Op = require('Sequelize').Op;

class UserController {
    async createUser(req: CustomRequest<CreateUserBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {email, name} = req.body
            const isUserUnique: UserModel = await User.findOne({where: {email}})
            if (isUserUnique) return next(ApiError.ExpectationFailed({
                value: email,
                msg: `User with this email is already registered`,
                param: "email",
                location: "body"
            }))
            else {
                const randomString: string = uuid.v4();
                const password: string = randomString.slice(0, 6);
                const hashPassword: string = await bcrypt.hash(password, 5)
                const activationLink: string = uuid.v4();
                const newUser:UserModel = await User.create({
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
            next(ApiError.Internal(`server error`))
        }
    }

    async findUser(req: CustomRequest<null, null, FindUserQuery, null>, res: Response, next: NextFunction) {
        try {
            const {email} = req.query
            const isUserCreated: UserModel = await User.findOne({where: {email}})
            if (isUserCreated) return next(ApiError.BadRequest("User with this email is already registered"))
            else res.status(200).json(email)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getAllUsers(req: CustomRequest<null, null, LimitOffsetType, null>, res: Response, next: NextFunction) {
        try {
            const {limit, offset, sortBy, select, filter} = req.query
            console.log(limit, offset, sortBy, select, filter)
            const options: Omit<FindAndCountOptions<Attributes<typeof User>>, "group"> = {}
            options.where = {}
            //if ((filter !== '') && (filter != undefined) && filter) options.where = {name: {[Op.iLike]: `%${filter}%`}}
            if ((filter !== '') && (filter != undefined) && filter) options.where[Op.or] = [{name: {[Op.iLike]: `%${filter}%`}}, {email: {[Op.iLike]: `%${filter}%`}}]
            if (limit && +limit > 50) options.limit = 50
            else if(limit) options.limit = +limit
            if (!offset) options.offset = 0
            else options.offset = +offset
            if (sortBy && select) options.order = [[sortBy, select]]
            // @ts-ignore
            //options.distinct = "User.id"
            const users: UserModel = await User.findAndCountAll(options)
            if (!users) return next(ApiError.BadRequest("Users not found"))
            res.status(200).json(users)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async getOneUser(req: CustomRequest<null, GetOneUserParams, null, null>, res: Response, next: NextFunction) {
        try {
            const userId = req.params.userId
            const user: UserModel = await User.findOne({
                    include: {all: true},
                    where: {id: userId},
                }
            )
            if (!user) return next(ApiError.BadRequest("User not found"))
            res.status(200).json(user)
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }

    async updateUser(req: CustomRequest<UpdateUserBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {id, newEmail, newName} = req.body
            const user: UserModel = await User.findOne({where: {id}})
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
            next(ApiError.Internal(`server error`))
        }
    }

    async deleteUser(req: CustomRequest<null, DeleteUserParams, null, null>, res: Response, next: NextFunction) {
        try {
            const {userId} = req.params
            if (!userId) next(ApiError.BadRequest("id is not defined"))
            const candidate: UserModel = await User.findOne({where: {id: userId}, include:{all:true}})
            if (!candidate) next(ApiError.BadRequest(`user with id:${userId} is not defined`))
            const order: OrderModel = await Order.destroy({where: {userId}})
            await candidate.destroy({force: true})
            res.status(200).json({message: `user with id:${userId} was deleted`, user: candidate})
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async registration(req: CustomRequest<AuthRegistrationBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {email, name, firstPassword} = req.body
            const user: UserModel = await User.findOne({where: {email}})
            if (user) return next(ApiError.ExpectationFailed({
                value: email,
                msg: "User with this email is already registered",
                param: "email",
                location: "body"
            }))
            if (!user) {
                const hashPassword: string = await bcrypt.hash(firstPassword, 5)
                const activationLink: string = uuid.v4();
                const user: UserModel = await User.create({
                    password: hashPassword,
                    email,
                    role: ROLE.User,
                    name,
                    activationLink
                })
                await mail.sendActivationMail(email,
                    `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                    user.role)
                const token: string = tokenService.generateJwt(user.id, user.email, user.role)
                return res.status(201).json({token})
            }
        } catch (e) {
            console.log(e)
            next(ApiError.Internal(`server error`))
        }
    }

    async changeEmail(req: CustomRequest<ChangeEmailBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const {password, currentEmail, newEmail} = req.body
            const user: UserModel = await User.findOne({where: {email: currentEmail}})
            if (!user) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "User is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            let comparePassword: boolean = bcrypt.compareSync(password, user.password)
            if (!comparePassword) return next(ApiError.ExpectationFailed({
                value: currentEmail,
                msg: "User is not found or password is wrong",
                param: "currentEmail",
                location: "body"
            }))
            const activationLink:string = uuid.v4();
            const changedUser: UserModel = await user.update({email: newEmail, isActivated: false, activationLink})
            const token:string = tokenService.generateJwt(changedUser.id, changedUser.email, changedUser.role)
            await mail.sendActivationMail(newEmail,
                `${process.env.API_URL}/api/auth/activate/${activationLink}`,
                changedUser.role)
            return res.status(200).json({token})
        } catch (e) {
            next(ApiError.Internal(`server error`))
        }
    }
}

module.exports = new UserController()