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
    },
);

const User = UserFactory(dbConfig);
const City = CityFactory(dbConfig);
const Master = MasterFactory(dbConfig);
const Order = OrderFactory(dbConfig);
const Picture = PictureFactory(dbConfig);
const OrderPicture = OrderPictureFactory(dbConfig);
const MasterBusyDate = MasterBusyDateFactory(dbConfig);
const Rating = RatingFactory(dbConfig);
const MasterCity = MasterCityFactory(dbConfig);
const Admin = AdminFactory(dbConfig);

export enum STATUSES{
    Approval= "Approval",
    Canceled="Canceled",
    Confirmed="Confirmed",
    Completed="Completed",
    NotCompleted="NotCompleted"
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