const nodemailer  =require('nodemailer');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    async sendMail(to, masterName, date, clockSize) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: "Заказ на вызов мастера на сайте " + process.env.CLIENT_URL + " оформлен",
            text: "",
            html:
                `
            <div>
                <h1>Заказ оформлен</h1>
                <div>Мастер ${masterName} прибудет к Вам ${date}:00 для ремонта часов, примерное время ремонта составляет ${clockSize} часа</div>
            </div>
            `
        })
    }
}
module.exports = new MailService()