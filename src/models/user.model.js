const mongoose = require("mongoose")
const bcrypt=require("bcryptjs")

const userSchema= new mongoose.Schema({
        email:{
                type: String,
                require: [true, "Email is required for creating a user"],
                lowercase:true,
                trim:true,
                match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        "Invalid email"
                ],
                unique:[true, "Email already exists"],

        },
        name:{
                type:String,
                require:[true, "Name is required"],

        },
        password:{
                type:String,
                require:[true, "password is required"],
                minlength:[6, "password should contain more than 6 characters"],
                select:false, //pw will not come in user query by default
        },
        systemUser:{
                type:Boolean,
                default:false,
                immutable:true, //no rando user can take value of system user
                select:false,
        }

}, {timestamps: true})
// func gets executed before saving in db
userSchema.pre("save", async function(next){
        if(!this.isModified("password")){
                return 
        }
        const hash=await bcrypt.hash(this.password, 10);
        this.password=hash

        return 
})

userSchema.methods.comparePassword = async function(password){
        return await bcrypt.compare(password,this.password);
}

const userModel= mongoose.model("user",userSchema);

module.exports=userModel;