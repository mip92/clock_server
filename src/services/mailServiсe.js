const nodemailer = require('nodemailer');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.NODE_ENV === 'production',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    async sendMailToNewUser(to, masterName, date, clockSize, password, activationLink) {
        const dateTime = new Date(date)
        const year = dateTime.getFullYear()
        const month = dateTime.getMonth() + 1
        const day = dateTime.getDate()
        const hours = dateTime.getHours()
        const url =`${process.env.API_URL}/api/auth/login/activate/${activationLink}`
        await this.transporter.sendMail(
            {
                from: process.env.SMTP_USER,
                to,
                subject: "Заказ на вызов мастера на сайте " + process.env.CLIENT_URL + " оформлен",
                text: "",
                html:
                    `
            <div>
                <h1>Заказ оформлен</h1>
                <div>Мастер ${masterName} прибудет к Вам ${day}.${month}.${year} в ${hours}:00 для ремонта часов, примерное время ремонта составляет ${clockSize} часа</div>
                <div>Это временный пароль, измените его на более надежный в личном кабинете ${password}</div>
                <div>Для активации почты перейдите по ссылке и авторизуйтесь</div>
                <a href=${url}>Авторизация<a/>
            <div/>
            `
            })
    }

    async sendMail(to, masterName, date, clockSize) {
        const dateTime = new Date(date)
        const year = dateTime.getFullYear()
        const month = dateTime.getMonth() + 1
        const day = dateTime.getDate()
        const hours = dateTime.getHours()
        await this.transporter.sendMail(
            {
                from: process.env.SMTP_USER,
                to,
                subject: "Заказ на вызов мастера на сайте " + process.env.CLIENT_URL + " оформлен",
                text: "",
                html:
                    `
            <div>
                <h1>Заказ оформлен</h1>
                <div>Мастер ${masterName} прибудет к Вам ${day}.${month}.${year} в ${hours}:00 для ремонта часов, примерное время ремонта составляет ${clockSize} часа</div>
            <div/>
            `
            })
    }

    async sendActivationMail(to, link, role, password = null) {

        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: "Aктивация аккаунта" + process.env.CLIENT_URL,
            text: "",
            html:
                `
            <div>
                <h1>Для активации почты перейдите по ссылке</h1>
                <a href=${link}>${link}<a/>
                <div>${role == ROLE.Master ? 'Ваша заявка будет рассмотрена администратором в течении двух рабочих дней, ждите ответа' : ""}</div>
                <div>${password ? `Это временный пароль, измените его на более надежный в личном кабинете ${password}` : ""}</div>
            </div>
            `
        })
    }

    async sendApproveMail(to, status) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: "Статус изменен",
            text: "",
            html:
                `
                    <div>
                        <div>Ваш статус мастера был изменен на значение</div>
                        <div>${status ? "подтвержден" : "не подтвержден"}</div>
                    </div>
                    
                `
        })
    }
}

module.exports = new MailService()