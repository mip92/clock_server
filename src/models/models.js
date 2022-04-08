const sequelize = require('../db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true},
    role: {type: DataTypes.STRING, defaultValue: "USER"},
    name:{type: DataTypes.STRING, allowNull: false},
    password:{type:DataTypes.STRING, unique: false, allowNull: true},
    activationLink:{type: DataTypes.STRING, allowNull: true},
    isActivated:{type: DataTypes.BOOLEAN, defaultValue: false}
})

const Status = sequelize.define('status', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true, allowNull: false},
})

const Master = sequelize.define('master', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, unique: true, allowNull: false},
    rating: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 5},
    role: {type: DataTypes.STRING, defaultValue: "MASTER"},
    password:{type:DataTypes.STRING, unique: false, allowNull: false},
    activationLink:{type: DataTypes.STRING, allowNull: true},
    isActivated:{type: DataTypes.BOOLEAN, defaultValue: false},
    isApproved:{type: DataTypes.BOOLEAN, defaultValue: false},
})

const Order = sequelize.define('order', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    clockSize: {type: DataTypes.INTEGER, allowNull: false},
    originalCityName: {type: DataTypes.STRING, allowNull: false},
    dealPrice: {type: DataTypes.INTEGER, allowNull: false},
    userId:{
        type: DataTypes.INTEGER,
        references:{
            model: User,
            key:'id'
        }
    },
    statusId:{
        type: DataTypes.INTEGER,
        references:{
            model: Status,
            key:'id'
        },
        defaultValue: 1
    },
    masterId:{
        type: DataTypes.INTEGER,
        references:{
            model: Master,
            key:'id',
        }
    }
})




const City = sequelize.define('city', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    cityName: {type: DataTypes.STRING, unique: true, allowNull: false},
    price:{type: DataTypes.INTEGER, allowNull: false},
})

const Admin= sequelize.define('admin', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true, allowNull: false},
    password: {type: DataTypes.STRING, allowNull: false},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: 'ADMIN'},
})

const MasterBusyDate = sequelize.define('master_busyDate', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    masterId:{
        type: DataTypes.INTEGER,
        references:{
            model: Master,
            key:'id',
        }
    },
    dateTime: {type: DataTypes.STRING},
/*    cityId:{
        type: DataTypes.INTEGER,
        references:{
            model: City,
            key:'id',
        }
    },*/
})

const MasterCity = sequelize.define('master_city', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    masterId: {
        type: DataTypes.INTEGER,
        references: {
            model: Master,
            key: 'id'
        }
    },
    cityId: {
        type: DataTypes.INTEGER,
        references: {
            model: City,
            key: 'id'
        }
    }
})
const Rating = sequelize.define('rating', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    rating: {type: DataTypes.INTEGER, allowNull: false},
    masterId: {
        type: DataTypes.INTEGER,
        references: {
            model: Master,
            key: 'id'
        }
    },
    orderId: {
        type: DataTypes.INTEGER, unique: true,
        references: {
            model: Order,
            key: 'id'
        }
    }
})

/*Rating.hasMany(Order);
Order.belongsTo(Rating);*/

Master.belongsToMany(City, {through: MasterCity})
City.belongsToMany(Master, {through: MasterCity})

User.hasMany(Order);
Order.belongsTo(User);

MasterBusyDate.hasMany(Order);
Order.belongsTo(MasterBusyDate);

City.hasMany(Order);
Order.belongsTo(City)

Status.hasMany(Order);
Order.belongsTo(Status)

Master.hasMany(Rating)
Rating.belongsTo(Master)

module.exports = {
    Master,
    City,
    Rating,
    MasterCity,
    Admin,
    Order,
    MasterBusyDate,
    User,
    Status
}