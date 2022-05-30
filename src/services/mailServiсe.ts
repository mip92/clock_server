import {Transporter} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {ROLE} from "../models";

import nodemailer from 'nodemailer';

class MailService {
    private transporter: Transporter<SMTPTransport.SentMessageInfo>;

    constructor() {
        // @ts-ignore
        this.transporter = nodemailer.createTransport({host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.NODE_ENV === 'production',
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
                subject: "Order on site " + process.env.CLIENT_URL + " was created",
                text: "",
                html:
                    `
            <div>
                <h1>Order is processed</h1>
                <div>Master ${masterName} will come to you ${dateTime.toLocaleString()} to repair the clock, estimated repair time is ${clockSize} hours</div>
                <div>This is a temporary password, change it to a more secure one in your account ${password}</div>
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
                <div>Master ${masterName} will come to you ${dateTime.toLocaleString()} to repair the clock, estimated repair time is ${clockSize} hours</div>
            <div/>
            `
            })
    }

    async sendActivationMail(to: string, link: string, role: string, password:string|null = null) {
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
                        <div>Your master status has been changed to</div>
                        <div>${status ? "confirmed" : "not confirmed"}</div>
                    </div>
                `
        })
    }
    async sendRatingMail(to: string, link: string) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
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
}


export default new MailService()