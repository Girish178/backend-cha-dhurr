import { User } from "../models/user.model.js"
import { deleteFromCloudinary, uploadOnCloudinary } from  "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apierror.js"
import { upload } from "../middlewares/multer.middleware.js"
import jwt from "jsonwebtoken"

const generaateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "something went wrong while generating the access and refresh tokens!!")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    console.log(req.body);
    console.log(req.files);
    
    const {fullname, email, username, password } = req.body
    console.log("fullname: ", fullname);

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req,res) => {

    //req.body--data
    //username and email retrival
    //find the  user
    //password check
    //assign access and refresh token
    // cookies

    const {email,username,password} = req.body;

    if(!(email || username)){                   //if(!email && !username)
        throw new ApiError(400,"email or username is required!!")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"Invalid User Credentials")

    }
    console.log(user);
    const {accessToken,refreshToken} = generaateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:false
    }
    
    return  res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In successfully!!"
        )
    )

})

const logoutUser = asyncHandler(async (req,res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true
            }
        )

    const options={
    httpOnly:true,
    secure:false
    }

    return  res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Logged out successfully!!"
        ))
})

const refreshAccessToken=asyncHandler(async (req,res) => {
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request!!")
    }

    try {
        const decodedToken=jwt(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const {accessToken,newrefreshToken} = await generaateAccessAndRefreshToken(user?._id)
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken:newrefreshToken
                },
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh Token")
    }

})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully!!"))
})

//USER DETAILS UPDATE CONTROLLER
const changeCurrentPassword = asyncHandler(async (req,res) => {

    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password!!")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully!!"))
})

const updateAccountDetails = asyncHandler(async (reqq,res) => {
    const {fullname,email} = req.body

    if(!(fullname || email)){
        throw new ApiError(400,"All fields are required!!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
              user  
            },
            "Account Details Updated successfully!!"
        )
    )
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalpath = req.file?.path

    if(!avatarLocalpath){
        throw ApiError(400,"avatar files is missing!!")
    }
    //const oldDelete = await deleteFromCloudinary(req.user.avatar.url)
    // if(!oldDelete){
    //     const avatar = await uploadOnCloudinary(avatarLocalpath)

    // }
    const avatar = await uploadOnCloudinary(avatarLocalpath)

    if(!avatar){
        throw new ApiError(400,"something went wrong while uploading the avatar file!!")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            {user},
            "avatar updated successfully!!"
        )
    )
})
const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalpath = req.file?.path

    if(!coverImageLocalpath){
        throw ApiError(400,"coverImage files is missing!!")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if(!coverImage){
        throw new ApiError(400,"something went wrong while uploading the coverImage file!!")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            {user},
            "avatar updated successfully!!"
        )
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage


}

