import {getMasters} from "./getMasters.test";
import axios from "axios";
import {dbConfig, Master, MasterCity, ROLE} from "../models";

describe('registration master', () => {
    test('registration master with short name', async () => {
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
    test('registration master with not valid email', async () => {
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
    test('registration and remove master', async () => {
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
    test('registration master with duplicate email', async () => {
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

describe('delete one master', () => {
    let id
    let token

    beforeEach(async () => {
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

    test('delete master', async () => {
        const response = await axios.delete(`${process.env.API_URL}/api/masters/${id}`,
            {headers: {Authorization: `Bearer ${token}`}})
        expect(response.data.message).toStrictEqual(`master with id:${id} was deleted`)
    })
    test('delete master with randomId', async () => {
        function randomInteger(min, max) {
            let rand = min + Math.random() * (max + 1 - min);
            return Math.floor(rand);
        }

        const randomId = randomInteger(5000000, 7000000)
        try {
            await axios.delete(`${process.env.API_URL}/api/masters/${randomId}`,
                {headers: {Authorization: `Bearer ${token}`}})
        } catch (e: any) {
            expect(e.response.data.message).toStrictEqual(`master with id:${randomId} is not defined`)
        }
    })

})

describe('Approve Master', () => {
    let id
    let token

    beforeEach(async () => {
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
    test('Approve master mast be true', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/getOneMaster/${id}`)
        expect(response.data.isApproved).toStrictEqual(true)
    })
    test('Approve master', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/masters/approve/${id}`,
            {headers: {Authorization: `Bearer ${token}`}})
        expect(response.data.message).toStrictEqual(`master with id:${id} changed status approve`)
    })


})