const jwt = require('jsonwebtoken')

module.exports = function(roles) {
    return function (req, res, next) {
        if (req.method === "OPTIONS") {
            next()
        }
        try {
            const token = req.headers.authorization.split(' ')[1] // Bearer asfasnfkajsfnjk
            if (!token) {
                return res.status(401).json({message: "Unauthorized"})
            }
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            for (let i = 0; i <roles.length ; i++) {
                if (decoded.role === roles[i]){
                    req.user = decoded;
                    return next()
                }
            }
            return res.status(403).json({message: "Forbidden"})

        } catch (e) {
            res.status(401).json({message: "Unauthorized"})
        }
    };
}



