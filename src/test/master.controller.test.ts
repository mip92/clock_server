import {getMasters} from "./getMasters.test";
import axios from "axios";
import {dbConfig, Master, MasterBusyDate, MasterCity, Order, ROLE} from "../models";
import {MasterModel} from "../models/master.model";

describe('create master', () => {
    test('create master with short name', async () => {
        const response = await axios.post(`${process.env.API_URL}/api/auth/login`, {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        })
        expect(response.data.name).toEqual('admin')
        expect(response.data.token).not.toBe(null);
        try {
            await axios.post(`${process.env.API_URL}/api/masters`, {
                name: "Short", email: "simple@valid.email", citiesId: 1,
            }, {headers: {Authorization: `Bearer ${response.data.token}`}/*headers.Authorization = `Bearer ${response.data.token}`*/})
        } catch (e: any) {
            expect(e.response.data.errors[0].msg).toEqual('name must be longer than 6 symbols')
        }
    })
    test('create master with not valid email', async () => {
        const response = await axios.post(`http://localhost:5000/api/auth/login`, {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        })
        expect(response.data.name).toEqual('admin')
        expect(response.data.token).not.toBe(null);
        try {
            const response2 = await axios.post(`http://localhost:5000/api/masters`, {
                name: "NormalLongName", email: "not@validemail", citiesId: 1,
            }, {headers: {Authorization: `Bearer ${response.data.token}`}/*headers.Authorization = `Bearer ${response.data.token}`*/})
        } catch (e: any) {
            expect(e.response.data.errors[0].msg).toEqual('email must be a valid email format')
        }
    })
    test('create and remove master', async () => {
        const response = await axios.post(`${process.env.API_URL}/api/auth/login`, {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        }) //generate token
        expect(response.data.name).toEqual('admin')
        expect(response.data.token).not.toBe(null);
        const response2 = await axios.post(`${process.env.API_URL}/api/masters`, {
            name: "NormalLongName", email: "example@gmail.com", citiesId: '[1]',
        }, {headers: {Authorization: `Bearer ${response.data.token}`}}) //add  master
        expect(response2.data.email).toBe('example@gmail.com')
        const response3 = await axios.delete(`${process.env.API_URL}/api/masters/${response2.data.id}`,
            {headers: {Authorization: `Bearer ${response.data.token}`}}) //remove master
        expect(response3.data.message).toBe(`master with id:${response2.data.id} was deleted`)
    })
    test('create master with duplicate email', async () => {
        const response = await axios.post(`${process.env.API_URL}/api/auth/login`, {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        })//generate token
        expect(response.data.name).toEqual('admin')
        expect(response.data.token).not.toBe(null);
        let response2
        try {
            response2 = await axios.post(`${process.env.API_URL}/api/masters`, {
                name: "NormalLongName", email: "example@gmail.com", citiesId: '[1]',
            }, {headers: {Authorization: `Bearer ${response.data.token}`}}) //add first master
            expect(response2.data.email).toBe('example@gmail.com')
            await axios.post(`${process.env.API_URL}/api/masters`, {
                name: "NormalLongName2", email: "example@gmail.com", citiesId: '[1]',
            }, {headers: {Authorization: `Bearer ${response.data.token}`}}) //add second master with email like first master
        } catch (e: any) {
            expect(JSON.parse(e.response.data.message).msg).toEqual('Master with this email is already registered')
            const response3 = await axios.delete(`${process.env.API_URL}/api/masters/${response2.data.id}`,
                {headers: {Authorization: `Bearer ${response.data.token}`}}) //remove first master
            expect(response3.data.message).toBe(`master with id:${response2.data.id} was deleted`)
        }

    })
})

describe('get masters', () => {
    test('masters count must be 2', async () => {
        const limit = '2';
        const offset = '';
        const cities = '';
        const sortBy = '';
        const select = '';
        const filter = '';
        const req = {
            query: {limit, offset, cities, sortBy, select, filter},
            body: null,
            params: null,
            files: null
        }
        const data = await getMasters({limit, offset, cities, sortBy, select, filter})
        expect(data.rows.length).toEqual(2)
    })
    test('masters must be undefined', async () => {
        const limit = '-5';
        const offset = '';
        const cities = '';
        const sortBy = '';
        const select = '';
        const filter = '';
        const data = await getMasters({limit, offset, cities, sortBy, select, filter})
        expect(data).toEqual(undefined)
    })
    test('master length must be less than 50', async () => {
        const limit = '51';
        const offset = '';
        const cities = '';
        const sortBy = '';
        const select = '';
        const filter = '';
        const data = await getMasters({limit, offset, cities, sortBy, select, filter})
        expect(data.rows.length).toBeLessThanOrEqual(50)
    })
    test('find masters with city id not equal 1', async () => {
        const limit = '';
        const offset = '';
        const cities = '1';
        const sortBy = '';
        const select = '';
        const filter = '';
        const data = await getMasters({limit, offset, cities, sortBy, select, filter})
        /*expect(getMasters).toBeCalledTimes(1)*/
        const citiesWithOtherId = data.rows.map((master) => {
            const cityWithOtherId = master.cities.filter((city) => city.id !== 1)
            return cityWithOtherId.length
        })
        const sumOtherCities = citiesWithOtherId.reduce(function (sum, elem) {
            return sum + elem;
        }, 0);
        expect(sumOtherCities).toBe(0)
    })
})

describe('get one master', () => {
    let id

    beforeAll(async () => {
        await dbConfig.authenticate()
        await dbConfig.sync()
        const master = await Master.create({
            name: 'longName',
            email: "some@valid.email",
            password: "hashPassword",
            role: ROLE.Master,
            isActivated: false,
            isApproved: true,
            activationLink: "link"
        });
        id = master.id
    });
    afterAll(async () => {
        await Master.destroy({where: {email: "some@valid.email"}})
    })

    test('masters values mast be valid', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        expect(response.data.cities).toStrictEqual([])
        expect(response.data.isActivated).toBe(false)
        expect(response.data.email).toBe("some@valid.email")
        expect(response.data.id).toBe(id)
        expect(response.data.role).toBe(ROLE.Master)
    })
    test('masters values mast be not valid', async () => {
        try {
            function randomInteger(min, max) {
                let rand = min + Math.random() * (max + 1 - min);
                return Math.floor(rand);
            }

            const id = randomInteger(5000000, 7000000)
            await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        } catch (e: any) {
            expect(e.response.data.message).toStrictEqual("Master not found")
        }
    })
})

describe('update one master', () => {
    let id
    let token

    beforeAll(async () => {
        await dbConfig.authenticate()
        await dbConfig.sync()
        const master = await Master.create({
            name: 'longName',
            email: "some@valid.email",
            password: "hashPassword",
            role: ROLE.Master,
            isActivated: false,
            isApproved: true,
            activationLink: "link"
        });
        const response = await axios.post(`${process.env.API_URL}/api/auth/login`, {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        })
        token = response.data.token
        id = master.id
    });
    afterAll(async () => {
        await MasterCity.destroy({where: {masterId: id}})
        await Master.destroy({where: {id}})
    })

    test('update master with not valid dates', async () => {
        try {
            await axios.put(`${process.env.API_URL}/api/masters/`,
                {id, name: "newNameAfterUpdate", email: "notValid@email"},
                {headers: {Authorization: `Bearer ${token}`}})
        } catch (e: any) {
            expect(e.response.data.errors[0].msg).toStrictEqual("email must be a valid email format")
            expect(e.response.data.errors[1].msg).toStrictEqual("cityId is required")
        }
    })
    test('update master with valid dates', async () => {
        const response = await axios.put(`${process.env.API_URL}/api/masters/`,
            {id, name: "newNameAfterUpdate", email: "new@validemail.com", citiesId: '1'},
            {headers: {Authorization: `Bearer ${token}`}})
        expect(response.data.cities[0].id).toStrictEqual(1)
        expect(response.data.name).toStrictEqual("newNameAfterUpdate")
        expect(response.data.email).toStrictEqual("new@validemail.com")
    })
    test('update master with random id', async () => {
        function randomInteger(min, max) {
            let rand = min + Math.random() * (max + 1 - min);
            return Math.floor(rand);
        }

        try {
            const randomId = randomInteger(5000000, 7000000)
            await axios.put(`${process.env.API_URL}/api/masters/`,
                {id: randomId, name: "newNameAfterUpdate", email: "new@validemail.com", citiesId: '1'},
                {headers: {Authorization: `Bearer ${token}`}})
        } catch (e: any) {
            expect(JSON.parse(e.response.data.message).msg).toStrictEqual("Master with this id is not found")
        }
    })
})

describe('delete one master',  () => {
    let id
    let token

    beforeAll(async () => {
        await dbConfig.authenticate()
        await dbConfig.sync()
        const master = await Master.create({
            name: 'longName',
            email: "some@valid.email",
            password: "hashPassword",
            role: ROLE.Master,
            isActivated: false,
            isApproved: true,
            activationLink: "link"
        });
        const response = await axios.post(`${process.env.API_URL}/api/auth/login`, {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        })
        token = response.data.token
        id = master.id
    });
    afterEach(async () => {
        await MasterCity.destroy({where: {masterId: id}})
        await Master.destroy({where: {id}})
    })

    test('delete master', async () => {
        const response = await axios.delete(`${process.env.API_URL}/api/masters/${id}`,
            {headers: {Authorization: `Bearer ${token}`}})
        expect(response.data.message).toStrictEqual(`master with id:${id} was deleted`)
    })
    /*test('delete master with randomId', async () => {
        try {
            await axios.delete(`${process.env.API_URL}/api/masters/${555555}`,
                {headers: {Authorization: `Bearer ${token}`}})
        } catch (e: any) {
            expect(e.response.data.message).toStrictEqual(`master with id:${555555} is not defined`)
        }
    })*/

})

describe('approve Master', () => {
    let id
    let token

    beforeAll(async () => {
        await dbConfig.authenticate()
        await dbConfig.authenticate()
    })
    beforeEach(async () => {
        const master = await Master.create({
            name: 'longName',
            email: "some2@valid.email",
            password: "hashPassword",
            role: ROLE.Master,
            isActivated: false,
            isApproved: true,
            activationLink: "link"
        });
        const response = await axios.post(`${process.env.API_URL}/api/auth/login`, {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
        })
        token = response.data.token
        id = master.id
    });
    afterEach(async () => {
        await MasterCity.destroy({where: {masterId: id}})
        await Master.destroy({where: {email: "some2@valid.email"}})
    })
    test('Approve master mast be true', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        expect(response.data.isApproved).toStrictEqual(true)
    })
    test('Approve master', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/approve/${id}`,
            {headers: {Authorization: `Bearer ${token}`}})
        expect(response.data.message).toStrictEqual(`master with id:${id} changed status approve`)
    })
    test('Approve master with randomId', async () => {
            function randomInteger(min, max) {
                let rand = min + Math.random() * (max + 1 - min);
                return Math.floor(rand);
            }

            const randomId = randomInteger(5000000, 7000000)
            try {
                await axios.get(`${process.env.API_URL}/api/masters/approve/${randomId}`,
                    {headers: {Authorization: `Bearer ${token}`}})
            } catch (e: any) {
                expect(e.response.data.message).toStrictEqual(`master with id:${randomId} is not defined`)
            }
        }
    )
})

describe('get free masters', () => {
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

    test('master is free', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        expect(response.data.cities[0].id).toStrictEqual(1)
        expect(response.data.email).toStrictEqual("some@valid.email")
        const response2 = await axios.get(`${process.env.API_URL}/api/masters/getFreeMasters?cityId=1&dateTime=2022-06-23T05:00:00.000Z&clockSize=1&limit=50&offset=0`)
        const ourMaster = response2.data.filter((master) => master.id === id)
        expect(ourMaster.length).toStrictEqual(1)
    })
    /*test('master is busy', async () => {
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
    })*/
    test('not valid date', async () => {
        try {
            await axios.get(`${process.env.API_URL}/api/masters/getFreeMasters?cityId=1&dateTime=aaaww&clockSize=1&limit=50&offset=0`)
        } catch (e: any) {
            expect(e.response.data.message).toStrictEqual(`Not valid date format`)
        }
    })
})


describe('registration master', () => {
    test('token must be not null', async () => {
        const response = await axios.post(`${process.env.API_URL}/api/auth/registration`, {
            firstPassword: 123456, secondPassword: 123456, isRulesChecked: true, isMaster: true,
            email: "some@valid.email", name: "someValidName", citiesId: [1],
        })
        expect(response.data.token).not.toBe(null)
        const master: MasterModel | null = await Master.findOne({where: {email: "some@valid.email"}})
        master && await MasterCity.destroy({where: {masterId: master.id}})
        master && await Master.destroy({where: {id: master.id}})
    })
    test('not valid password', async () => {
        try {
            await axios.post(`${process.env.API_URL}/api/auth/registration`, {
                firstPassword: 12, secondPassword: 1, isRulesChecked: true, isMaster: true,
                email: "some@valid.email", name: "someValidName", citiesId: [1],
            })
        } catch (e: any) {
            expect(e.response.data.errors[0].msg).toStrictEqual(`password must be longer than 3 symbols`)
        }

    })
    test('two different passwords', async () => {
        try {
            await axios.post(`${process.env.API_URL}/api/auth/registration`, {
                firstPassword: 123456, secondPassword: 123457, isRulesChecked: true, isMaster: true,
                email: "some@valid.email", name: "someValidName", citiesId: [1],
            })
        } catch (e: any) {
            expect(e.response.data.message).toStrictEqual(`Passwords do not match`)
        }

    })
})


describe('change master email', () => {
    test('change to valid email', async () => {
        const response = await axios.post(`${process.env.API_URL}/api/auth/registration`, {
            firstPassword: 123456, secondPassword: 123456, isRulesChecked: true, isMaster: true,
            email: "some@valid.email", name: "someValidName", citiesId: [1]
        })
        expect(response.data.token).not.toBe(null)

        const response2 = await axios.put(`${process.env.API_URL}/api/masters/changeEmail`, {
            password: 123456, currentEmail: "some@valid.email", newEmail: "some@valid2.com"
        }, {headers: {Authorization: `Bearer ${response.data.token}`}})
        expect(response2.data.token).not.toBe(null)
        const master: MasterModel | null = await Master.findOne({where: {email: "some@valid2.com"}})
        master && await MasterCity.destroy({where: {masterId: master.id}})
        master && await Master.destroy({where: {email: "some@valid2.com"}})
    })
    test('change to not valid email', async () => {
        const response = await axios.post(`${process.env.API_URL}/api/auth/registration`, {
            firstPassword: 123456, secondPassword: 123456, isRulesChecked: true, isMaster: true,
            email: "some@valid.email", name: "someValidName", citiesId: [1]
        })
        expect(response.data.token).not.toBe(null)
        try {
            await axios.put(`${process.env.API_URL}/api/masters/changeEmail`, {
            password: 123456, currentEmail: "some@valid.email", newEmail: "somevalid.com"}, {headers: {Authorization: `Bearer ${response.data.token}`}})
        }catch (e:any) {
            expect(e.response.data.errors[0].msg).toBe('email must be a valid email format')
            const master: MasterModel | null = await Master.findOne({where: {email: "some@valid.email"}})
            master && expect(master.email).toBe("some@valid.email")
            master && await MasterCity.destroy({where: {masterId: master.id}})
            master && await Master.destroy({where: {id: master.id}})
        }
    })
    test('change random email', async () => {
        const response = await axios.post(`${process.env.API_URL}/api/auth/registration`, {
            firstPassword: 123456, secondPassword: 123456, isRulesChecked: true, isMaster: true,
            email: "some@valid.email", name: "someValidName", citiesId: [1]
        })
        expect(response.data.token).not.toBe(null)
        try {
            await axios.put(`${process.env.API_URL}/api/masters/changeEmail`, {
                password: 123456, currentEmail: "Random@valid.randomEmail", newEmail: "someRandom@valid.email"}, {headers: {Authorization: `Bearer ${response.data.token}`}})
        }catch (e:any) {
            expect(JSON.parse(e.response.data.message).msg).toBe('Master is not found or password is wrong')
            const master: MasterModel | null = await Master.findOne({where: {email: "some@valid.email"}})
            master && expect(master.email).toBe("some@valid.email")
            master && await MasterCity.destroy({where: {masterId: master.id}})
            master && await Master.destroy({where: {id: master.id}})
        }
    })
})
