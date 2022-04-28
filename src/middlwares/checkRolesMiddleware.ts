const jwt = require('jsonwebtoken')
import * as express from 'express';
const {ROLE} = require('../models');

module.exports = function (roles : typeof ROLE[]) {
    return function (req:express.Request, res:express.Response, next:express.NextFunction) {
        if (req.method === "OPTIONS") {
            next()
        }
        try {
            const token = req?.headers?.authorization?.split(' ')[1] // Bearer asfasnfkajsfnjk
            if (!token) {
                return res.status(401).json({message: "Unauthorized"})
            }
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            const isTrue = roles.some((r)=>decoded.role === r)
            if (isTrue) {
                return next()
            }
            return res.status(403).json({message: "Forbidden"})

        } catch (e) {
            res.status(401).json({message: "Unauthorized"})
        }
    };
}



