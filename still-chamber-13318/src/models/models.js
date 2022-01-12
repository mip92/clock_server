const sequelize = require('../db')
const {DataTypes} = require('sequelize')



const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true,},
    role: {type: DataTypes.STRING, defaultValue: "USER"},
    name:{type: DataTypes.STRING, allowNull: false},
})

const Order = sequelize.define('order', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    clockSize: {type: DataTypes.INTEGER, allowNull: false},
    userId:{
        type: DataTypes.INTEGER,
        references:{
            model: User,
            key:'id'
        }
    },
})

const Master = sequelize.define('master', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, unique: true, allowNull: false},
    rating: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 5},
})
const City = sequelize.define('city', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    city_name: {type: DataTypes.STRING, unique: true, allowNull: false},
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


MasterBusyDate.hasMany(Order);
Order.belongsTo(MasterBusyDate);

City.hasMany(Order);
Order.belongsTo(City)

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
    User
}