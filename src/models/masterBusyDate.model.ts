import {BuildOptions, DataTypes, Model, Sequelize} from "sequelize";
import {CityAttributes} from "./city.model";

export interface MasterBusyDateAttributes {
    id: number;
    masterId: number
    dateTime: string,
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MasterBusyDateModel extends Model<Partial<MasterBusyDateAttributes>>, MasterBusyDateAttributes {
}

export class MasterBusyDate extends Model<MasterBusyDateModel, MasterBusyDateAttributes> {
}

export type MasterBusyDateStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): MasterBusyDateModel;
};

export function MasterBusyDateFactory(sequelize: Sequelize): MasterBusyDateStatic {
    return <MasterBusyDateStatic>sequelize.define("master_busyDate", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        /* masterId: {
             type: DataTypes.INTEGER,
             references: {
                 model: Master,
                 key: 'id',
             }
         },*/
        dateTime: {type: DataTypes.STRING},
    });
}