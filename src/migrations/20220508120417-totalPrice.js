'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.addColumn('orders', 'totalPrice', {
                            type: Sequelize.DataTypes.FLOAT
                        }, { transaction: t }),
                    ]
                )
            }
        )
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.removeColumn('orders', 'totalPrice', { transaction: t }),
                    ]
                )
            }
        )
    }
};