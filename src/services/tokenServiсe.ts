export {};
const jwt = require('jsonwebtoken')
const {ROLE} = require('../models/index');

class TokenService {
    generateJwt(id: number, email: string, role: typeof ROLE) {
        const token: string = jwt.sign(
            {id, email, role},
            process.env.SECRET_KEY,
            {expiresIn: '24h'}
        )
        return token
    }
}

module.exports = new TokenService()