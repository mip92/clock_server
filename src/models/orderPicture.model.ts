import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";
const {Order, Picture} = require('../models/index');


export interface OrderPictureAttributes {
    id: number;
    orderId: number
    pictureId: number
    createdAt?: Date;
    updatedAt?: Date;
}
export interface OrderPictureModel extends Model<OrderPictureAttributes>, OrderPictureAttributes {}
export class OrderPicture extends Model<OrderPictureModel, OrderPictureAttributes> {}

export type OrderPictureStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): OrderPictureModel;
};

export function OrderPictureFactory (sequelize: Sequelize): OrderPictureStatic {
    return <OrderPictureStatic>sequelize.define("orderPicture", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        /*orderId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Order',
                key: 'id',
            }
        },
        pictureId: {
            type: DataTypes.INTEGER,
            references: {
                model: Picture,
                key: 'id',
            }
        }*/
    });
}