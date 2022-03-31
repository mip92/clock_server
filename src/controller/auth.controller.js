const ApiError = require('../exeptions/api-error');
const {Master, User, City, MasterCity} = require('../models/models');
const userController = require("../controller/user.controller");
const masterController = require("../controller/master.controller");

class AuthController {
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