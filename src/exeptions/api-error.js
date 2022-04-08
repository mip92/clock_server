module.exports = class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
    static UnauthorizedError(){
        return new ApiError(401,"User not authorized")
    }
    static BadRequest(message){
        return new ApiError(404, message)
    }
    static ExpectationFailed(message){
        return new ApiError(417, JSON.stringify(message))
    }

    static Internal(message){
        return new ApiError(500, message)
    }
    static Forbiden(message){
        return new ApiError(403, message)
    }
}