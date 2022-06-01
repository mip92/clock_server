import jwt from 'jsonwebtoken';

class TokenService {
    generateJwt(id: number, email: string, role: string) {
        const token: string = jwt.sign(
            {id, email, role},
            process.env.SECRET_KEY as string,
            {expiresIn: '24h'}
        )
        return token
    }
}
export default new TokenService()