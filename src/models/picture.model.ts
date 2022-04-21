import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface PictureAttributes {
    id: number;
    path: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface PictureModel extends Model<PictureAttributes>, PictureAttributes {}
export class Picture extends Model<PictureModel, PictureAttributes> {}

export type PictureStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): PictureModel;
};

export function PictureFactory (sequelize: Sequelize): PictureStatic {
    return <PictureStatic>sequelize.define("picture", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        path: {type: DataTypes.STRING, unique: true, allowNull: true},
    });
}