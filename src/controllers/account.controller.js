const accountModel=require("../models/account.model")

async function createAccountController(req,res) {
        const user=req.user;

        const account= await accountModel.create({
                user:user._id
        })
        return res.status(201).json({
                account
        })
}

//for fetching balance and details
async function getUserAccountsController(req,res) {
        const accounts= await accountModel.find({user:req.user._id})

        return res.status(200).json({
                accounts
        })
}


async function getAccountBalanceController(req,res) {
        const {accountId} = req.params

        console.log("accountId:", accountId);
        console.log("req.user._id:", req.user._id);

        const account= await accountModel.findOne({
                _id:accountId,
                user:req.user._id, //to make sure the same user whose account is this, is asking for the req
        })

        console.log("account:", account);

        if(!account){ //either id is wrong or the wrong user is asking for details fo that acc
                return res.status(404).json({
                         message:"account not found"
                })
        }
        const balance= await account.getBalance();
        return res.status(200).json({
                accountId: account._id,
                balance:balance,
        })

}
module.exports={createAccountController, getUserAccountsController, getAccountBalanceController}