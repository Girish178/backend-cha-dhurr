class ApiError extends  Error{
    constructor(
        statusCode,
        message="something went wrong !!",
        errors=[],
        statch=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=true;
        this.errors=errors

        if(statch){
            this.statch=statch
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}