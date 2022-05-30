import {BuildOptions, DataTypes, Model, Sequelize} from "sequelize";
import {CityAttributes} from "./city.model";

export interface MasterCityAttributes {
    id: number;
    masterId: number,
    cityId: number,
    createdAt?: Date,
    updatedAt?: Date
}

export interface MasterCityModel extends Model<Partial<MasterCityAttributes>>, MasterCityAttributes {
}

export class MasterCity extends Model<Partial<MasterCityModel>, MasterCityAttributes> {
}

export type MasterCityStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): MasterCityModel;
};

export function MasterCityFactory(sequelize: Sequelize): MasterCityStatic {
    return <MasterCityStatic>sequelize.define("master_city", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        /*        masterId: {
                    type: DataTypes.INTEGER,
                    references: {model: Master, key: 'id'}
                },
                cityId: {
                    type: DataTypes.INTEGER,
                    references: {model: City, key: 'id'}
                }*/
    });
}