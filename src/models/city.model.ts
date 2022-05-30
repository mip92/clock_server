import {BuildOptions, DataTypes, Model, Sequelize} from "sequelize";

export interface CityAttributes {
    id: number;
    cityName: string,
    price: number,
}

export interface CityModel extends /*Model<Partial<CityAttributes>>*/ Model<Partial<CityAttributes>>, CityAttributes {
}

export class City extends Model<CityModel, CityAttributes> {
}

export type CityStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): CityModel;
};

export function CityFactory(sequelize: Sequelize): CityStatic {
    return <CityStatic>sequelize.define("city", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        cityName: {type: DataTypes.STRING, unique: true, allowNull: false},
        price: {type: DataTypes.FLOAT, allowNull: false},
    });
}