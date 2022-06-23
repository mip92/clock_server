import {Transporter} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {ROLE} from "../models";
import nodemailer from 'nodemailer';
import {OrderModelWithMasterBusyDateMasterAndUser} from "./cronService";

class MailService {
    private transporter: Transporter<SMTPTransport.SentMessageInfo>;

    constructor() {
        // @ts-ignore
        this.transporter = nodemailer.createTransport({host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    async sendMailToNewUser(to: string, masterName: string, date: string, clockSize: number,
                            password: string, activationLink: string) {
        const dateTime = new Date(date)
        const url = `${process.env.API_URL}/api/auth/login/activate/${activationLink}`
        await this.transporter.sendMail(
            {
                from: process.env.SMTP_USER,
                to,
                subject: "Order was created",
                text: "",
                html:
                    `
            <div>
                <h1>Order is processed</h1>
                <br>
                <div>You have successfully paid for the order</div>
                <br>
                <div>Master ${masterName} will come to you ${dateTime.getDate()}.${dateTime.getMonth()}.${dateTime.getFullYear()} at ${dateTime.getHours()}:00 to repair the clock, estimated repair time is ${clockSize} hours</div>
                <br>
                <div>This is a temporary password, change it to a more secure one in your account ${password}</div>
                <br>
                <div>To activate mail, follow the link and login</div>
                <a href=${url}>Authorization<a/>
            <div/>
            `
            })
    }

    async sendMail(to: string, masterName: string, date: string, clockSize: number) {
        const dateTime = new Date(date)
        await this.transporter.sendMail(
            {
                from: process.env.SMTP_USER,
                to,
                subject: "Order on site " + process.env.CLIENT_URL + " was created",
                text: "",
                html:
                    `
            <div>
                <h1>Order is processed</h1>
                <br>
                <div>You have successfully paid for the order</div>
                <br>
                <div>Master ${masterName} will come to you ${dateTime.getDate()}.${dateTime.getMonth()}.${dateTime.getFullYear()} at ${dateTime.getHours()}:00 to repair the clock, estimated repair time is ${clockSize} hours</div>
            <div/>
            `
            })
    }

    async sendActivationMail(to: string, link: string, role: string, password: string | null = null) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: "Aктивация аккаунта" + process.env.CLIENT_URL,
            text: "",
            html:
                `
            <div>
                <h1>To activate mail, follow the link</h1>
                <a href=${link}>${link}<a/>
                <div>${role == ROLE.Master ? 'Your application will be reviewed by the administrator within two business days, wait for a response' : ""}</div>
                <div>${password ? `This is a temporary password, change it to a more secure one in your account ${password}` : ""}</div>
            </div>
            `
        })
    }

    async sendApproveMail(to: string, status: boolean) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: "Статус изменен",
            text: "",
            html:
                `
                    <div>
                        <div>${status ? "Your status has been changed to confirmed." : "Your status has been changed to not confirmed."}</div>
                        <div>${status ? "Now you can work in our company": "Now you can't work in our company" }</div>
                    </div>
                `
        })
    }
    async sendRatingMail(to: string, link: string, pdfBase64: string) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            attachments: [
                {
                    filename: 'score.pdf',
                    content: Buffer.from(
                        pdfBase64
                        ,'base64'
                    ),
                },
            ],

            subject: "Please comment our service",
            text: "",
            html:
                `
                    <div>
                        <div>Please comment our service</div>
                        <a href=${link}>link<a/>
                    </div>
                `
        })
    }
    async sendScheduleMail(to: string,order: OrderModelWithMasterBusyDateMasterAndUser, date: Date){
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: "Reminder",
            text: "",
            html:
                `
                    <div>
                        <div>Watch repair scheduled in an hour at ${date.getDate()}.${date.getMonth()}.${date.getFullYear()} at ${date.getHours()}:00</div>
                        <div>city: ${order.originalCityName}</div>
                        <div>deal price: ${order.dealPrice}</div>
                        <div>clock size: ${order.clockSize === 1 ? 'small' : order.clockSize === 2 ? 'middle' : 'big'}</div>
                        <div>total price: ${order.totalPrice}</div>
                        <div>user name: ${order.user.name}</div>
                        <div>user email: ${order.user.email}</div>
                    </div>
                `
        })
    }
}


export default new MailService()
