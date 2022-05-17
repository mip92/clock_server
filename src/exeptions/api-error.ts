interface jsonError {
    value: string
    msg: string,
    param: string,
    location: string
}

module.exports = class ApiError extends Error {
    status;
    constructor(status:number, message:string) {
        super(message);
        this.status = status;
    }
    static UnauthorizedError(){
        return new ApiError(401,"User not authorized")
    }
    static BadRequest(message:string ){
        return new ApiError(404, message)
    }
    static ExpectationFailed(message:jsonError){
        return new ApiError(417, JSON.stringify(message))
    }

    static Internal(message:string){
        return new ApiError(500, message)
    }
    static Forbiden(message:string){
        return new ApiError(403, message)
    }
}