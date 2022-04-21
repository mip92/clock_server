/*import {Dialect} from "sequelize";

const {Dialect, Sequelize} = require('sequelize')

const databaseConfig = {
    database: process.env.DB_NAME as string,
    username: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres' as Dialect,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
}
if (process.env.NODE_ENV === 'development') {
    module.exports = new Sequelize(
        databaseConfig
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            dialect: 'postgres',
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
        }
    )
} else {
    module.exports = new Sequelize({
        repositoryMode: true,
            database: process.env.DB_NAME as string,
            username: process.env.DB_USER as string,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: 5432,
            dialect: 'postgres' as Dialect,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false // <<<<<<< YOU NEED THIS
                }
            }
        }
    )
}*/

