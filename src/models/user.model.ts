import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";
import {CityAttributes} from "./city.model";

export interface UserAttributes {
    id: number;
    email: string;
    role: string;
    name: string;
    password: string;
    activationLink: string;
    isActivated: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UserModel extends Model<Partial<UserAttributes>>, UserAttributes {}
export class User extends Model<UserModel, UserAttributes> {}

export type UserStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): UserModel;
};

export function UserFactory (sequelize: Sequelize): UserStatic {
    return <UserStatic>sequelize.define("user", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        email: {type: DataTypes.STRING, unique: true},
        role: {type: DataTypes.STRING, defaultValue: "USER"},
        name: {type: DataTypes.STRING, allowNull: false},
        password: {type: DataTypes.STRING, unique: false, allowNull: true},
        activationLink: {type: DataTypes.STRING, allowNull: true},
        isActivated: {type: DataTypes.BOOLEAN, defaultValue: false}
    });
}