import {getMasters} from "./getMasters.test";
import axios from "axios";
import {dbConfig, Master, ROLE} from "../models";


describe('registration master', () => {
        test('registration master with short name', async () => {
            const response = await axios.post(`${process.env.API_URL}/api/auth/login`, {
                email: "admin@example.com",
                password: "passwordsecret",
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
                email: "admin@example.com",
                password: "passwordsecret",
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
                email: "admin@example.com",
                password: "passwordsecret",
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
                email: "admin@example.com",
                password: "passwordsecret",
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
    }
)

describe('get masters', () => {
    test('master length must be 2', async () => {
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

    beforeEach(async () => {
        await dbConfig.authenticate()
        await dbConfig.sync()
        await Master.create({
            name: 'longName',
            email: "some@valid.email",
            password: "hashPassword",
            role: ROLE.Master,
            isActivated: false,
            isApproved: true,
            activationLink: "link"
        });
    });

    test('get one master', async () => {
        const response = await axios.get(`${process.env.API_URL}/api/getOneMaster/:masterId`)
        return response.data
    })
})
/*test('env vars and global vars', () => {
    expect(process.env.FOO).toBe('FOO');
});*/
