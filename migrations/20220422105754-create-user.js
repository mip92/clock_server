'use strict';
import {DataTypes} from "sequelize";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            email: {type: Sequelize.STRING, unique: true},
            role: {type: Sequelize.STRING, defaultValue: "USER"},
            name: {type: Sequelize.STRING, allowNull: false},
            password: {type: Sequelize.STRING, unique: false, allowNull: true},
            activationLink: {type: Sequelize.STRING, allowNull: true},
            isActivated: {type: Sequelize.BOOLEAN, defaultValue: false},
            createdAt: {allowNull: false, type: Sequelize.DATE},
            updatedAt: {allowNull: false, type: Sequelize.DATE}
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Users');
    }
};