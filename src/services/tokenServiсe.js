const jwt = require('jsonwebtoken')

class TokenService {
    generateJwt (id, email, role){
        return jwt.sign(
            {id, email, role},
            process.env.SECRET_KEY,
            {expiresIn: '24h'}
        )
    }
}
module.exports = new TokenService()