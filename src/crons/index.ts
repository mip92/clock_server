import cron from "node-cron";
import cronService, {OrderModelWithMasterBusyDateMasterAndUser} from "../services/cronService";
import mail from "../services/mailServiсe";

export const everyFiveMinutes = cron.schedule('*/10 * * * *', () => {
    console.log('hello world')
})

export const everyHour = cron.schedule('0 * * * *', async () => { //0 * * * *
    const now = new Date(Date.now())
    now.setMinutes(0)
    now.setSeconds(0)
    now.setMilliseconds(0)
    const hour = now.getHours()
    now.setHours(hour + 1)
    const orders: OrderModelWithMasterBusyDateMasterAndUser[] = await cronService.findMasters(now.toISOString())
    const sendMail = (order: OrderModelWithMasterBusyDateMasterAndUser): Promise<string> => {
        return new Promise((resolve, reject) => {
            mail.sendScheduleMail(order.user.email, order, now).then((l) => {
                    resolve('letter sent')
                }
            ).catch(() => reject('letter not sent'))
        })
    }
    Promise.all(orders.map(order => sendMail(order))).then((results) => {
        results.map(result => console.log(result))
    })
})

export default {everyFiveMinutes, everyHour}
