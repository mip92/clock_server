import {BuildOptions, DataTypes, Model, Sequelize} from "sequelize";

export interface AdminAttributes {
    id: number;
    email: string,
    password: string,
    role: string,
}

export interface AdminModel extends Model<Partial<AdminAttributes>>, AdminAttributes {
}

export class Admin extends Model<AdminModel, AdminAttributes> {
}

export type AdminStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): AdminModel;
};

export function AdminFactory(sequelize: Sequelize): AdminStatic {
    return <AdminStatic>sequelize.define("admin", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        email: {type: DataTypes.STRING, unique: true, allowNull: false},
        password: {type: DataTypes.STRING, allowNull: false},
        role: {type: DataTypes.STRING, allowNull: false, defaultValue: "ADMIN"},
    });
}