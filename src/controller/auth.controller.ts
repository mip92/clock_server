import {Response, NextFunction} from 'express';
import {UserModel} from "../myModels/user.model";
import {MasterModel} from "../myModels/master.model";
import {AdminModel} from "../myModels/admin.model";
import {AuthRegistrationBody, CustomRequest, Link, LoginBody} from "../interfaces/RequestInterfaces";

const ApiError = require('../exeptions/api-error');
const {Master, User, Admin} = require('../myModels/index');
const userController = require("./user.controller");
const masterController = require("./master.controller");
const bcrypt = require('bcrypt')
const tokenService = require('../services/tokenServiсe')


class AuthController {

    async login(req: CustomRequest<LoginBody, null, null, null>, res: Response, next: NextFunction) {
        try {
            const admin: AdminModel[] = await Admin.findAll()
            if (admin.length === 0) {
                const email: string = process.env.ADMIN_EMAIL as string
                const password: string = process.env.ADMIN_PASSWORD as string
                const hashPassword: string = await bcrypt.hash(password, 5)
                const admin: AdminModel = await Admin.create({email, password: hashPassword})
            }
            const {email, password} = req.body
            let user: UserModel | MasterModel | AdminModel = await User.findOne({where: {email: email}})
            if (!user) user = await Master.findOne({where: {email}})
            if (!user) user = await Admin.findOne({where: {email}})
            if (!user) return next(ApiError.ExpectationFailed({
                value: email,
                msg: "User is not found or password is wrong",
                param: "email",
                location: "body"
            }))
            let comparePassword: boolean = bcrypt.compareSync(password, user.password)
            if (!comparePassword) return next(ApiError.ExpectationFailed({
                value: email,
                msg: "User is not found or password is wrong",
                param: "email",
                location: "body"
            }))
            const token = tokenService.generateJwt(user.id, user.email, user.role)
            return res.status(200).json({token, name: "name" in user ? user.name : "admin"})
        } catch (e) {
            console.log(e)
        }
    }

    async registration(req: CustomRequest<AuthRegistrationBody, null, null, null>, res: Response, next: NextFunction) {
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
        }
    }

    async activate(req: CustomRequest<null, Link, null, null>, res: Response, next: NextFunction) {
        try {
            const activationLink: string = req.params.link;
            const user: UserModel = await User.findOne({where: {activationLink}})
            if (user){
                await user.update({isActivated: true})
                return res.redirect(`${process.env.CLIENT_URL}`);
            }
            const master: MasterModel = await Master.findOne({where: {activationLink}})
            if (master){
                await master.update({isActivated: true})
                return res.redirect(`${process.env.CLIENT_URL}`);
            }
            return next(ApiError.BadRequest('Incorrect activation link'))
        } catch (e) {
            console.log(e)
        }
    }

    async loginActivate(req: CustomRequest<null, Link, null, null>, res: Response, next: NextFunction) {
        try {
            const activationLink: string = req.params.link;
            const user: UserModel = await User.findOne({where: {activationLink}})
            if (user){
                await user.update({isActivated: true})
                return res.redirect(process.env.CLIENT_URL + '/login');
            }
            const master: MasterModel = await Master.findOne({where: {activationLink}})
            if (master){
                await master.update({isActivated: true})
                return res.redirect(process.env.CLIENT_URL + '/login');
            }
            return next(ApiError.BadRequest('Incorrect activation link'))
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new AuthController()