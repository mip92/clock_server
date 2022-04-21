import * as express from "express";

const {validationResult} = require("express-validator");
module.exports=function (req:express.Request, res:express.Response, next:express.NextFunction){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }
    next();
};