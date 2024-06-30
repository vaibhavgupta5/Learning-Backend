import asynHandler from "../utils/asynHandler.js"
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudnairy.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynHandler.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefereshTokens = async(email) =>{
        const user = await User.findOne({email})
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    
}



export const registerUser = asynHandler( async (req, res) =>{
       // get details from user from Frontend
       // validation - not empty
       // check if user already exists: username, email
       //check for images, check for avatar
       // upload them to cloudinary: URL
       // create user object - create entry in DB
       // remove password and refresh token from response
       // check for user creation
       // return res
        const {fullname, username, email, password} = req.body;

        // if(fullname === ""){
        //     throw new ApiError("Full Name is required", 400);
        // }
        
        if([fullname, email, username, password].some((field) => field?.trim() === "")){
            throw new ApiError("All fields are required", 400);
        }
       

       const existedUser =  await User.findOne({
            $or: [{username},{email}]
        })

        if(existedUser){
            throw new ApiError("User already exists", 409);
        }

        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
           coverImageLocalPath = req.files.coverImage[0].path
        }

        if(!avatarLocalPath){
            throw new ApiError("Avatar is required", 400);
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!avatar) {
            throw new ApiError("Upload Avatar First", 400)
        }

       const user = await User.create({
            fullname,
            username: username.toLowerCase(),
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        })

        const createUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if(!createUser){
            throw new ApiError("Something went wrong while registering user", 500);
        }

        return res.status(201).json(
            new ApiResponse(200, createUser, "Uset registered successfuly")
        )

    })


     const loginUser = asyncHandler(async (req, res) => {
        // get data from user from frontend , req.body > data
        // check if not empty
        // check if user exists: username, email
        // check password
        // generate token
        // remove password and refresh token from response
        // send cookies
    
        const { email, password } =  req.body
    
    
        if (!(email)) {
            throw new ApiError(400, "username or email is required");
        }
    
        const user = await User.findOne({ email });
    
        if (!user) {
            throw new ApiError("User does not exist", 404);
        }
    
        const isPasswordValid = await user.isPasswordCorrect(password);
    
        if (!isPasswordValid) {
            throw new ApiError("Incorrect password", 401);
        }

    
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user.email);
    
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
        const options = {
            httpOnly: true,
            secure: true
        };
    
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully"));
    });
    

export const logOutUser = asynHandler( async(req, res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
       {
        $set:{
            refreshToken: undefined
        },
       },
       {
        new: true,
       } 
       
    )
    
   const options = {
    httpOnly: true,
    secure: true
   }

   return res.status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, null, "User logged out successfuly"))
 
})

export const refreshAccessToken = asynHandler(async(req, res)=>{
    // get token from cookie
    // validate token
    // generate new token
    // send new token to client

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError("No token found", 401)
   }

try {
       const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
       const user = await User.findById(decodedToken?._id)
    
       if(!user){
        throw new ApiError("No token found", 401)
       }
    
       if(user?.refreshToken !== incomingRefreshToken){
        throw new ApiError("Invalid token", 401)
       }    
    
       const options = {
        httpOnly : true,
        secure: true
       }
    
       const {accessToken ,newRefreshToken} = await generateAccessAndRefereshTokens(user.email)
    
    return res
    .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken: newRefreshToken,},
            "User logged in successfully" 
    )
      
      )
} catch (error) {
    throw new ApiError("Invalid token", 401)
}



})

export const changeCurrentPassword = asynHandler(async(req, res) =>{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)


    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    
    if(!isPasswordCorrect){
        throw new ApiError("Password Incorrect", 401)
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, "Password Changed Successfully"))
})

export const getCurrentUser = asynHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, "Cuurent user fetched Successfully")
})

export const uptadeAccountDetails = asynHandler(async(req,res)=>{
    const {fullname, email} = req.body;

    if(!(fullname || email)){
        throw new ApiError("Fullname or Email is required", 400)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email: email.toLowerCase(),
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

export const updateUserAvatar = asynHandler(async(req, res)=>{

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError("Upload Avatar First", 400)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError("Errro in uploading file", 400)
    }

    const User = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url,
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))

})

export const getUserChannelProfile = asynHandler(async (req, res) =>{
    //params == url

    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError("Username is missing", 400)
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond : {
                    if:{
                        $in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }

                }
            },
            {
                $project:{
                    _id: 1,
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    email:1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount: 1,
                    isSubscribed: 1
                }
            }
        ])

        if(!channel?.length){
            throw new ApiError("Channel not found", 404)
        }

        return res
       .status(200)
       .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
})
  
export const getWatchHistory = asynHandler(async (req, res) =>{

    const user = await User.aggregate([
        {
            $match:{

                //can;'t use _id = rq.user._id as moongose dos't work and id here is raw.

                _id: new mongoose.Types.ObjectId(req.user._id)
            }},
            {
                $lookup:{
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }]
                            }
                        }
                    ]
                }
            }

    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully")
    )
})

export {loginUser}