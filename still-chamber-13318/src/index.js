const express = require('express')
/*require('dotenv').config()*/
require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})
const cors = require('cors')
const errorMiddleware=require('./middlwares/error-middleware')
const models = require('./models/models')
const router = require('./routes')
let expressValidator = require('express-validator');

const PORT = process.env.PORT || 5000
const sequelize= require('./db')

const app = express()
app.use(express.json())
console.log(process.env.CLIENT_URL)
app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL
}))
app.use('/api',router)

app.use(errorMiddleware)

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(PORT, () => console.log("Server started on port: " + PORT))
    } catch (e) {
        console.log(e)
    }
}
start()