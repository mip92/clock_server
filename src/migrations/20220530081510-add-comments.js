'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                    queryInterface.addColumn('ratings', 'comment', {
                        type: Sequelize.DataTypes.STRING,
                        allowNull: true
                    }, { transaction: t }),
                    queryInterface.addColumn('ratings', 'link', {
                        type: Sequelize.DataTypes.STRING,
                        allowNull: true
                    }, { transaction: t }),
                    ]
                )
            }
        )
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
                return Promise.all([
                    queryInterface.removeColumn('ratings', 'comment', { transaction: t }),
                    queryInterface.removeColumn('ratings', 'link', { transaction: t }),
                    ]
                )
            }
        )
    }
};