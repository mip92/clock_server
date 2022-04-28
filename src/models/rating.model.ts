import {BuildOptions, DataTypes, Model, Sequelize} from "sequelize";

export interface RatingAttributes {
    id: number;
    rating: number,
    masterId: number,
    orderId: number,
    createdAt?: Date,
    updatedAt?: Date
}

export interface RatingModel extends Model<RatingAttributes>, RatingAttributes {}

export class Rating extends Model<RatingModel, RatingAttributes> {}

export type RatingStatic = typeof Model & {
    new(values?: object, options?: BuildOptions): RatingModel;
};

export function RatingFactory(sequelize: Sequelize): RatingStatic {
    return <RatingStatic>sequelize.define("rating", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        rating: {type: DataTypes.INTEGER, allowNull: true},
        /*masterId: {
            type: DataTypes.INTEGER,
            references: {model: Master, key: 'id'}
        },*/
        orderId: {type: DataTypes.INTEGER, unique: true}
        /*orderId: {
            type: DataTypes.INTEGER, /!*unique: true,*!/
            references: {model: Order, key: 'id'}
        }*/
    });
}