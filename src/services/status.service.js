const ApiError = require('../exeptions/api-error')
const {Status} = require('../models/models')


class StatusService{
    async createStatuses() {
        try {
            const namesStatuses = ['approval','canceled', 'confirmed', 'completed', 'not completed']
            //['админ рассматривает заказ',
            // 'админ или мастер или пользователь отменяет заказ',
            // 'мастер принимант заказ'
            // 'мастер и пользователь омечает, что выполнил заказ',
            // 'мастер или пользователь отмечает что заказ не выполнен']
            for (let i = 0; i < namesStatuses.length; i++) {
                const st =await Status.create({name: namesStatuses[i]})
            }
            const statuses = await Status.findAndCountAll()
            return statuses
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