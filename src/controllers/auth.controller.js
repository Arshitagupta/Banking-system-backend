const userModel=require("../models/user.model");
const jwt=require("jsonwebtoken")
const emailService=require("../services/email.service");
const tokenBlackListModel=require("../models/blackList.model")


async function userRegisterController(req,res) {
        const {email, name, password}=req.body;

        const isExists= await userModel.findOne({email:email})

        if(isExists){
                return res.status(422).json({
                        message:"user exists with this email id",
                        status:"failed"
                })
        }

        const user=await userModel.create({
                email, password, name
        })

        const token=await jwt.sign({
                userId:user._id
        },process.env.JWT_SECRET,
        {expiresIn:"3d"})
        
        res.cookie("token",token)
        res.status(201).json({
                message:"user created",
                user:{
                        _id:user._id,
                        email:user.email,
                        name:user.name,
                },
                token
        })

        await emailService.sendRegistrationEmail(user.email,user.name);
         
}

async function userLoginController(req,res){
        const {email, password}=req.body;
        const user= await userModel.findOne({email:email}).select("+password")
        if(!user){
                return res.status(401).json({
                        message:"user does not exists with this email id",
                })
        }
       const isValidPassword=user.comparePassword(password)

       if(!isValidPassword){
        return res.status(401).json({
                        message:"user does not exists with this email id",
                })
       }
       const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET, {expiresIn: "3d"})
       res.cookie("token",token);

       res.status(200).json({
        user:{
                _id:user._id,
                email:user.email,
                name:user.name
        },
        token
       })


}
async function userLogoutController(req,res) {
        const token=req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

        if(!token){
                return res.status(200).json({
                        message:"User logged out successfully"
                })
        }
        

        await tokenBlackListModel.create({
                token:token
        })
        res.clearCookie("token")
        return res.status(200).json({
                message:"User logged out successfully"
        })

}

module.exports={userRegisterController, userLoginController, userLogoutController}