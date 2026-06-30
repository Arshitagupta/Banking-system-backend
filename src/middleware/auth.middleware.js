const userModel=require("../models/user.model")
const jwt=require("jsonwebtoken")
const tokenBlackListModel=require("../models/blackList.model")

async function authMiddleware(req,res,next) {
        const token=req.cookies.token || req.header.authorization?.split(" ")[ 1 ]

        if(!token){
                return res.status(401).json({
                        message:"unauthorized access, token is missing"
                })
        }

        const isBlacklisted= await tokenBlackListModel.findOne({
                token
        })
        if(isBlacklisted){
                return res.status(401).json({
                        message:"Unauthorised, token is invalid"
                })
        }

        try {
                const decoded=jwt.verify(token, process.env.JWT_SECRET)
                const user=await userModel.findById(decoded.userId)
                req.user=user
                return next()

        } catch (error) {
                return res.status(401).json({
                        message:"unauthorized access, token is invalid"
                })
        }
}

async function authSystemUserMiddleware(req,res,next){
        const token= req.cookies.token || req.header.authorization?.split(" ")[ 1 ]

        if(!token){
                return res.status(401).json({
                        message:"Unauthorized access, token is missing"
                })
        }
        const isBlacklisted= await tokenBlackListModel.findOne({
                token
        })
        if(isBlacklisted){
                return res.status(401).json({
                        message:"Unauthorised, token is invalid"
                })
        }
        try {
                const decoded=jwt.verify(token, process.env.JWT_SECRET);

                const user=await userModel.findById(decoded.userId).select("+systemUser")
                if(!user.systemUser){
                        return res.status(403).json({
                                message:"Forbidden user, not a system user"
                        })
                }
                req.user=user;

                return next()

        } catch (error) {
                return res.status(401).json({
                        message:"Unauthorized access, token is missing"
                })
        }
}

module.exports={authMiddleware, authSystemUserMiddleware}