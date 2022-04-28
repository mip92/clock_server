'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.bulkInsert('masters', [{
                            name: "Andrew",
                            email: "19mip92@gmail.com",
                            role: "MASTER",
                            password: "secreteHashPassword",
                            activationLink: "secreteActivationLink",
                            isActivated: true,
                            isApproved: true,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }], {transaction: t}),
                        queryInterface.bulkInsert('master_cities', [{
                            masterId: 1,
                            cityId: 1,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }], {transaction: t}),
                        queryInterface.bulkInsert('master_cities', [{
                            masterId: 1,
                            cityId: 2,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }], {transaction: t})
                    ]
                )
            }
        )
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.bulkDelete('masters', null, {transaction: t}),
                        queryInterface.bulkDelete('master_cities', null, {transaction: t})
                    ]
                )
            }
        )
    }
}
