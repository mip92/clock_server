import path from "path";
import express from 'express';
import dotenv from 'dotenv'

dotenv.config({
    path: `.env.${process.env.NODE_ENV}`,
})
const PORT = process.env.PORT || 5000
import cors from 'cors';
import errorMiddleware from './middlwares/error-middleware';
import router from './routes';
import fileupload from "express-fileupload";
import {dbConfig} from "./models";
import cron from 'node-cron';

const app = express()
app.use(express.json())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))

app.use(fileupload())
app.use('/api', router)
app.use(express.static(path.join(__dirname, 'static')))

app.use(errorMiddleware)

cron.schedule('0 * * * *', () => {
    const now = new Date(Date.now())
    console.log(now)
    now.setMinutes(0)
    now.setSeconds(0)
    now.setMilliseconds(0)
    const hour = now.getHours()
    now.setHours(hour+1)
    console.log(now.toISOString())
});

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