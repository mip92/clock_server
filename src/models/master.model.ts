import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";
import {ROLE} from "./index"

export interface MasterAttributes {
    id: number;
    email: string;
    name:string;
    role: typeof ROLE;
    password: string;
    activationLink: string;
    isActivated: boolean;
    rating: number;
    isApproved: boolean;
    createdAt?: Date;
    updatedAt?: Date;

}
export interface MasterModel extends Model<MasterAttributes>, MasterAttributes {}
export class Master extends Model<MasterModel, MasterAttributes> {}

export type MasterStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): MasterModel;
};

export function MasterFactory (sequelize: Sequelize): MasterStatic {
    return <MasterStatic>sequelize.define("master", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        name: {type: DataTypes.STRING, allowNull: false},
        email: {type: DataTypes.STRING, unique: true, allowNull: false},
        rating: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 5},
        role: {type: DataTypes.STRING, defaultValue: ROLE.Master},
        password: {type: DataTypes.STRING, unique: false, allowNull: false},
        activationLink: {type: DataTypes.STRING, allowNull: true},
        isActivated: {type: DataTypes.BOOLEAN, defaultValue: false},
        isApproved: {type: DataTypes.BOOLEAN, defaultValue: false},
    });
}