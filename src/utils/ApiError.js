
class ApiError extends Error{
    constructor(message, statusCode = "Something Went Wrong", errors=[], stack=""){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.message = message;
        this.stack = stack;
        this.success = false;
    

    if (stack){
        this.stack = stack
    }
    else {
        Error.captureStackTrace(this, this.constructor);
    }
}}

export default ApiError;