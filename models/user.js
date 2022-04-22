'use strict';
import {DataTypes} from "sequelize";

const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
    }
  }
  User.init({
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true},
    role: {type: DataTypes.STRING, defaultValue: "USER"},
    name: {type: DataTypes.STRING, allowNull: false},
    password: {type: DataTypes.STRING, unique: false, allowNull: true},
    activationLink: {type: DataTypes.STRING, allowNull: true},
    isActivated: {type: DataTypes.BOOLEAN, defaultValue: false}
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};