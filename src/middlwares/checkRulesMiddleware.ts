import * as express from "express";
import {validationResult} from "express-validator";

export default function (req: express.Request, res: express.Response, next: express.NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        return res.status(422).json({errors: errors.array()});
    }
    next();
};