import axios from "axios";
import {dbConfig, Master, MasterBusyDate, MasterCity, Order, ROLE, STATUSES, User} from "../models";

describe('create order', () => {
    let id: number
    beforeEach(async () => {
        await dbConfig.authenticate()
        await dbConfig.sync()
        const master = await Master.create({
            name: 'longName',
            email: "some@valid.email",
            password: "hashPassword",
            role: ROLE.Master,
            isActivated: true,
            isApproved: true,
            activationLink: "link"
        });
        id = master.id
        await MasterCity.create({
            masterId: id,
            cityId: 1
        })
    });
    afterEach(async () => {
        await MasterCity.destroy({where: {masterId: id}})
        await Master.destroy({where: {id}})
    })

    test('create order with valid data', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        expect(response.data.cities[0].id).toStrictEqual(1)
        expect(response.data.email).toStrictEqual("some@valid.email")
        const response2 = await axios.get(`${process.env.API_URL}/api/masters/getFreeMasters?cityId=1&dateTime=2022-06-23T05:00:00.000Z&clockSize=1&limit=50&offset=0`)
        const ourMaster = response2.data.some((master) => master.id === id)
        expect(ourMaster).toEqual(true)
        const response3 = await axios.post(`${process.env.API_URL}/api/order`,{
            cityId: 1,
            clockSize: 1,
            dateTime: "2022-06-23T05:00:00.000Z",
            email: "sdd@dd.dc",
            masterId: id,
            name: "dddddd",
        })
        expect(response3.data.status).toEqual(STATUSES.Approval)
        expect(response3.data.masterId).toEqual(id)
        await Order.destroy({where:{id:response3.data.id}})
        await User.destroy({where:{id:response3.data.userId}})
    })
    test('create order with not valid data', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        expect(response.data.cities[0].id).toStrictEqual(1)
        expect(response.data.email).toStrictEqual("some@valid.email")
        const response2 = await axios.get(`${process.env.API_URL}/api/masters/getFreeMasters?cityId=1&dateTime=2022-06-23T05:00:00.000Z&clockSize=1&limit=50&offset=0`)
        const ourMaster = response2.data.some((master) => master.id === id)
        expect(ourMaster).toEqual(true)

        function randomInteger(min, max) {
            let rand = min + Math.random() * (max + 1 - min);
            return Math.floor(rand);
        }
        const randomId = randomInteger(500000, 700000)
        try {
            await axios.post(`${process.env.API_URL}/api/order`, {
                cityId: 1,
                clockSize: 1,
                dateTime: "2022-06-23T05:00:00.000Z",
                email: "sdd@dd.dc",
                masterId: randomId,
                name: "dddddd",
            })
        }catch (e:any) {
            expect(e.response.data.message).toEqual('master is not found')
        }
    })
    test('master is busy', async () => {
        const response0 = await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        expect(response0.data.id).toStrictEqual(id)
        const response = await axios.post(`${process.env.API_URL}/api/order`, {
            cityId: "1",
            clockSize: '1',
            dateTime: "2022-06-23T05:00:00.000Z",
            email: "user@gmail.com",
            masterId: id,
            name: "longUserName"
        })
        expect(response.data.masterId).toStrictEqual(id)
        try {
            const response2 = await axios.get(`${process.env.API_URL}/api/masters/getFreeMasters?cityId=1&dateTime=2022-06-23T05:00:00.000Z&clockSize=1&limit=50&offset=0`)
            const ourMaster = response2.data.filter((master) => master.id === id)
            expect(ourMaster.length).toStrictEqual(0)
        } catch (e: any) {
            expect(e.response.data.message).toStrictEqual("masters is not found")
            Order.destroy({where: {masterId: id}})
            MasterBusyDate.destroy({where: {masterId: id}})
        }
    })
})

