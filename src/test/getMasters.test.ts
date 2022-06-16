const axios = require("axios");

export const getMasters = async ({limit, offset, cities,sortBy, select, filter}) => {
    try {
        const response = await axios.get(`${process.env.API_URL}/api/masters?limit=${limit}&offset=${offset}&cities=${cities}&sortBy=${sortBy}&select=${select}&filter=${filter}`)
        return response.data
    } catch (e) {

    }
}
module.exports = {getMasters}
