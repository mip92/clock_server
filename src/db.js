const {Sequelize} = require('sequelize')

if (process.env.NODE_ENV === 'development') {
    module.exports = new Sequelize(
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
            database: process.env.DB_NAME,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: 5432,
            dialect: "postgres",
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false // <<<<<<< YOU NEED THIS
                }
            }
        }
    )
}

