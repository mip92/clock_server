const nodemailer  =require('nodemailer');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.NODE_ENV=='production' ? true: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    async sendMail(to, masterName, date, clockSize) {
        console.log(to, masterName, date, clockSize)
        console.log(process.env.NODE_ENV)
        const dateTime = new Date(date)
        const year = dateTime.getFullYear()
        const month=dateTime.getMonth()+1
        const day=dateTime.getDate()
        const hours =dateTime.getHours()
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: "Заказ на вызов мастера на сайте " + process.env.CLIENT_URL + " оформлен",
            text: "",
            html:
                `
            <div>
                <h1>Заказ оформлен</h1>
                <div>Мастер ${masterName} прибудет к Вам ${day}.${month}.${year} в ${hours}:00 для ремонта часов, примерное время ремонта составляет ${clockSize} часа</div>
            </div>
            `
        })
    }
}
module.exports = new MailService()