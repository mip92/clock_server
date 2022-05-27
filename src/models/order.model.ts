import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface OrderAttributes {
    id: number;
    clockSize: number,
    originalCityName: string,
    dealPrice: number,
    userId: number,
    status: string,
    payPalOrderId: string,
    totalPrice:number | null
}
export interface OrderModel extends Model<Partial<OrderAttributes>>, OrderAttributes {}
export class Order extends Model<OrderModel, OrderAttributes> {}

export type OrderStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): OrderModel ;
};

export function OrderFactory (sequelize: Sequelize): OrderStatic  {
    return <OrderStatic>sequelize.define("order", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        clockSize: {type: DataTypes.INTEGER, allowNull: false},
        originalCityName: {type: DataTypes.STRING, allowNull: false},
        dealPrice: {type: DataTypes.FLOAT, allowNull: false},
        /*userId: {
            type: DataTypes.INTEGER,
            references: {
                model: User,
                key: 'id'
            }
        },*/
        status: {type: DataTypes.STRING, allowNull: false},
        payPalOrderId: {type: DataTypes.STRING, allowNull: true},
        totalPrice:{type: DataTypes.FLOAT, allowNull: true}
    });
}