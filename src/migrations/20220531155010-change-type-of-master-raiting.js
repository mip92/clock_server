'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.changeColumn('masters', 'rating', {
                            type: Sequelize.DataTypes.FLOAT,
                            defaultValue: 0,
                            allowNull: false
                        }, {transaction: t})
                    ]
                )
            }
        )
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                        queryInterface.changeColumn('masters', 'rating', {
                            type: Sequelize.DataTypes.INTEGER,
                            defaultValue: 0,
                            allowNull: false
                        }, {transaction: t})
                    ]
                )
            }
        )
    }
};