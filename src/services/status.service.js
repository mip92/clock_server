const ApiError = require('../exeptions/api-error')
const {Status} = require('../models/models')


class StatusService{
    async createStatuses() {
        try {
            const namesStatuses = ['canceled', 'confirmed', 'completed']
            for (let i = 0; i < namesStatuses.length; i++) {
                await Status.create({name: namesStatuses[i]})
            }
            const statuses = await Status.findAndCountAll()
            return statuses
        } catch (e) {
            console.log(e)
        }
    }

    async getStatusById(id) {
        try {
            const status = await Status.findByPk(id)
            return status
        } catch (e) {
            console.log(e)
        }
    }

    async getAllStatuses() {
        try {
            const statuses = await Status.findAll()
            return statuses
        } catch (e) {
            console.log(e)
        }
    }

    async getStatusByName(name) {
        try {
            const status = await Status.findOne({where: {name}})
            return status
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new StatusService()