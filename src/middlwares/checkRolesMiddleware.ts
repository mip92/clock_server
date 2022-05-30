import jwt, {JwtPayload} from 'jsonwebtoken';
import * as express from 'express';
import {ROLE} from '../models';

export default function (roles: ROLE[]) {
    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
        if (req.method === "OPTIONS") {
            next()
        }
        try {
            const token: string | undefined = req?.headers?.authorization?.split(' ')[1] // Bearer asfasnfkajsfnjk
            if (!token) {
                return res.status(401).json({message: "Unauthorized"})
            }

            const decoded: JwtPayload | string = jwt.verify(token, process.env.SECRET_KEY as string)
            // @ts-ignore
            const isTrue = roles.some((r) => decoded?.role == String(r))
            if (isTrue) {
                return next()
            }
            return res.status(403).json({message: "Forbidden"})

        } catch (e) {
            res.status(401).json({message: "Unauthorized"})
        }
    };
}



