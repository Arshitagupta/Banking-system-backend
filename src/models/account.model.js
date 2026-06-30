const mongoose=require("mongoose");
const ledgerModel=require("../models/ledger.model")

const accountSchema= new mongoose.Schema({
        user:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
                require: ["true", "account must be associated with a user"],
                index:true,
        },
        status:{
                type:String,
                enum:{
                        values:["ACTIVE", "FROZON", "CLOSED"],
                        message:"status can be of these values only",
                        
                },
                default: "ACTIVE",
        },
        currency:{
                type:String,
                require: ["true", "currency is required for craeting an account"],
                default:"INR",
        }
},{
        timestamps: true
})
//compount indexing on basis on user and status
accountSchema.index({user:1, status:1}); 

accountSchema.methods.getBalance= async function() {
        const balanceData= await ledgerModel.aggregate([
                {$match : {account : this._id}},
                {
                        $group:{
                                _id:null,
                                totalDebit:{
                                        $sum:{
                                                $cond:[
                                                        {$eq: ["$type","DEBIT"]},
                                                        "$amount",
                                                        0
                                                ]
                                        }
                                },
                                totalCredit:{
                                        $sum:{
                                                $cond:[
                                                        {$eq:["$type", "CREDIT"]},
                                                        "$amount",
                                                        0
                                                ]
                                        }
                                }
                        }
                },
                {
                        $project:{
                                _id:0,
                                balance:{ $subtract: ["$totalCredit", "$totalDebit"]}
                        }
                }
        ])

        if(balanceData.length===0){
                return 0;
        }

        return balanceData[ 0 ].balance
}

const accountModel=mongoose.model("account", accountSchema);

module.exports=accountModel