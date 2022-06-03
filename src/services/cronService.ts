import {Master, MasterBusyDate, Order, User} from "../models";
import {OrderModelWithMasterBusyDate} from "../controller/order.controller";
import {MasterBusyDateModel} from "../models/masterBusyDate.model";
import {MasterModel} from "../models/master.model";
import {UserModel} from "../models/user.model";


export interface OrderModelWithMasterBusyDateMasterAndUser extends OrderModelWithMasterBusyDate {
    master_busyDate: MasterBusyDateModel
    master: MasterModel
    user: UserModel
}

class CronService {
    async findMasters(date: string) {
        // @ts-ignore
        const orders: OrderModelWithMasterBusyDateMasterAndUser[] = await Order.findAll({
                include: [
                    {model: MasterBusyDate, where: {dateTime: date}},
                    {model: Master},
                    {model: User}
                ]
            }
        )
        return orders
    }

}


export default new CronService()