import {OrderFactory} from "./order.model";

const {Sequelize} = require('sequelize')
import {UserFactory} from "./user.model";
import {MasterFactory} from "./master.model";
import {PictureFactory} from "./picture.model";
import {OrderPictureFactory} from "./orderPicture.model";
import {MasterBusyDateFactory} from "./masterBusyDate.model";
import {RatingFactory} from "./rating.model";
import {CityFactory} from "./city.model";
import {MasterCityFactory} from "./masterCity.model";
import {AdminFactory} from "./admin.model";

export const dbConfig = new Sequelize({
        database: process.env.DB_NAME as string,
        username: process.env.DB_USER as string,
        password: process.env.DB_PASSWORD,
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        "dialectOptions": {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    },
);

export const User = UserFactory(dbConfig);
export const City = CityFactory(dbConfig);
export const Master = MasterFactory(dbConfig);
export const Order = OrderFactory(dbConfig);
export const Picture = PictureFactory(dbConfig);
export const OrderPicture = OrderPictureFactory(dbConfig);
export const MasterBusyDate = MasterBusyDateFactory(dbConfig);
export const Rating = RatingFactory(dbConfig);
export const MasterCity = MasterCityFactory(dbConfig);
export const Admin = AdminFactory(dbConfig);

export enum STATUSES {
    Approval = "Approval",
    Canceled = "Canceled",
    Confirmed = "Confirmed",
    Completed = "Completed",
    NotCompleted = "NotCompleted",
    AwaitingPayment = "AwaitingPayment"
}

export enum ROLE {
    User = "USER",
    Admin = "ADMIN",
    Master = "MASTER"
}

Master.belongsToMany(City, {through: MasterCity})
City.belongsToMany(Master, {through: MasterCity})

User.hasMany(Order);
Order.belongsTo(User);

Picture.hasMany(OrderPicture);
OrderPicture.belongsTo(Picture)

Order.hasMany(OrderPicture);
OrderPicture.belongsTo(Order);

MasterBusyDate.hasMany(Order);
Order.belongsTo(MasterBusyDate);

Master.hasMany(Order);
Order.belongsTo(Master);

City.hasMany(Order);
Order.belongsTo(City)

Master.hasMany(Rating)
Rating.belongsTo(Master)

Order.hasOne(Rating, {foreignKey: 'orderId'})
Rating.belongsTo(Order, {foreignKey: 'orderId'})

/*Master.hasMany(MasterCity,{ foreignKey: 'masterId'});
MasterCity.belongsTo(Master, {foreignKey: 'masterId'});*/

MasterBusyDate.belongsTo(Master, {foreignKey: 'masterId'});
Master.hasMany(MasterBusyDate, {foreignKey: 'masterId'});

/*Man.hasOne(RightArm);      // ManId in RigthArm
RightArm.belongsTo(Man);  */ // ManId in RigthArm

module.exports = {
    dbConfig,
    Master,
    City,
    Rating,
    MasterCity,
    Admin,
    Order,
    OrderPicture,
    Picture,
    MasterBusyDate,
    User,
    STATUSES,
    ROLE
}