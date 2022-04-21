import * as express from "express";

const {validationResult} = require("express-validator");
module.exports=function (req:express.Request, res:express.Response, next:express.NextFunction){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message=errors.array()[0].msg
        return res.status(400).json({message})
    }
    next();
};