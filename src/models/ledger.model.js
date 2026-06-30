const mongoose=require("mongoose")

//require to create all entries of money credited and debited
//everything in ledger will be immutable-> cannot be modified
const ledgerSchema= new mongoose.Schema({
        account:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"account",
                required:[true, "Ledger must be associated with an account"],
                index:true,
                immutable: true, //cannot modify entry
        },
        amount:{
                type: Number,
                required:[true, "Amount is requiored for creating aledger entry"],
                immutable:true,
        },
        transaction:{
                type: mongoose.Schema.Types.ObjectId,
                ref:"transaction",
                required:[true, "Ledger must be associated with a Transaction"],
                index:true,
                immutable:true,
        },
        type:{
                type:String,
                enum:{
                        values:["CREDIT", "DEBIT"],
                        message: "type can eother be credit and debit"
                },
                require:[true, "ledger type is required"],
                immutable: true,
        }

})

function preventLedgerModifications(){
        throw new Error("ledger entries are immutable and cannot be modified or deletd")
}

ledgerSchema.pre('findOneAndUpdate',preventLedgerModifications)
ledgerSchema.pre('updateOne',preventLedgerModifications)
ledgerSchema.pre('deleteOne',preventLedgerModifications)
ledgerSchema.pre('remove',preventLedgerModifications)
ledgerSchema.pre('deleteMany',preventLedgerModifications)
ledgerSchema.pre('updateMany',preventLedgerModifications)
ledgerSchema.pre('findOneAndDelete',preventLedgerModifications)
ledgerSchema.pre('findOneAndReplace',preventLedgerModifications)

const ledgerModel=mongoose.model("ledger",ledgerSchema);

module.exports=ledgerModel;