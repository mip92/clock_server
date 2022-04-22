export {};
const express = require('express')
require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})
const PORT = process.env.PORT || 5000
const cors = require('cors')
const errorMiddleware=require('./middlwares/error-middleware')
const router = require('./routes')
const fileupload = require("express-fileupload");
const {dbConfig}= require("./myModels/index");

const app = express()
app.use(express.json())
app.use(cors({
    credentials:true,
    origin: process.env.CLIENT_URL
}))
app.use(fileupload())
app.use('/api',router)

app.use(errorMiddleware)

const start = async () => {
    try {
        await dbConfig.authenticate()
        await dbConfig.sync()
        app.listen(PORT, () => console.log("Server started on port: " + PORT))
    } catch (e) {
        console.log(e)
    }
}
start()