import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, logOutUser, loginUser, refreshAccessToken, registerUser, updateUserAvatar, uptadeAccountDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
{
    name: "avatar",
    maxCount: 1,},
    {
        name: "coverImage",
        maxCount: 1,},
    ]),registerUser)


router.route("/login").post(loginUser)


router.route("/logout").post(verifyJWT, logOutUser)

router.route("/refresh-token", refreshAccessToken )

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, uptadeAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/c/username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router;