import jwt from "jsonwebtoken"
import asyncHandler from "../utils/asynHandler.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"

export const verifyJWT = asyncHandler(async(req, res, next) => {
try {
        const Token = req.cookies?.accessToken || req.header("Autherization")?.replace("Bearer", "")
    
        if(!Token){
            throw new ApiError("No token found", 401)
        }
    
        const decodedToken = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select( "-password -refreshToken")
    
        if(!user){
            throw new ApiError("User not found", 401)
        }
    
        req.user = user
        next()
} catch (ApiError) {
    throw new ApiError("Invalid Access Token", 401)
}

    
})