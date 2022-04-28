'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.bulkInsert('cities', [{
                            cityName: "Днепр",
                            price: "200",
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }], {transaction: t}),
                        queryInterface.bulkInsert('cities', [{
                            cityName: "Киев",
                            price: "300",
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }], {transaction: t})
                    ]
                )
            }
        )
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('cities', null, {});
    }
}


