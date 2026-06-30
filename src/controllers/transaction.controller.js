const transactionModel=require("../models/transaction.model");
const userModel=require("../models/user.model")
const accountModel=require("../models/account.model")
const ledgerModel=require("../models/ledger.model")
const mongoose=require("mongoose")
const emailService=require("../services/email.service")


//create a new transaction
// 10 step transfer flow->
// 1) validate request
// 2) validate idempo key
// 3) check account status-> active
// 4) derive sender balance from ledger ->suffiecient balance
// 5) create transaction (pemding)
// 6) create debit ledger entry
// 7) create credit ledger entry
// 8) mark transaction complete
// 9) commit mongodb session
// 10) send email notif

async function createTransaction(req,res) {

        //validate request
        const {toAccount, fromAccount, amount, idempotencyKey} =req.body;

        if(!toAccount || !fromAccount || !amount || !idempotencyKey){
                return res.status(400).json({
                        message: "Either of toAccount, fromAccount, amount, idempotencyKey is missing"
                })
        }
        //step1-to check if from and to acc even exists or not
        const fromUserAccount=await accountModel.findOne({
                _id:fromAccount,
        })
        const toUserAccount= await accountModel.findOne({
                _id:toAccount,
        })

        if(!fromUserAccount || !toUserAccount){
                return res.status(400).json({
                        message: "invalid toAccount or fromAccount"
                })
        }

        //2-validate idempo key
        const isTransactionAlreadyExists =await transactionModel.findOne({
                idempotencyKey: idempotencyKey
        })

        if(isTransactionAlreadyExists){
                if(isTransactionAlreadyExists.status==="COMPLETED"){
                        return res.status(200).json({
                                message: "Transaction already exists",
                                transaction: isTransactionAlreadyExists
                        })
                }
                if(isTransactionAlreadyExists.status==="PENDING"){
                        return res.status(200).json({
                                message: "Transaction processing",
                        })
                }
                if(isTransactionAlreadyExists.status==="FAILED"){
                        return res.status(500).json({
                                message: "Transaction processing failed",
                        })
                }
                if(isTransactionAlreadyExists.status==="REVERSED"){
                        return res.status(500).json({
                                message: "Transaction reversed, try again",
                        })
                }
        }

        //step3 check acc status
        console.log(fromUserAccount.status);
        console.log(toUserAccount.status);
        if(fromUserAccount.status!=="ACTIVE" || toUserAccount.status!=="ACTIVE"){
                return res.status(400).json({
                        message: "Both accounts should be active for Transaction",
                })
        }

        //step 4->senders balance from ledger
        const balance=await fromUserAccount.getBalance()
        if(balance<amount){
                return res.status(400).json({
                        message: `Insufficient balance, Current balance is ${balance}. Requested balance ${amount}`
                })
        }

        //step5 create transaction
        //mongodb allows us to create a session for transaction, we need mongoose for it
        let transaction;
        try {
                /**
                 * 5. Create transaction (PENDING)
                 */
                const session = await mongoose.startSession()
                session.startTransaction()

                transaction = (await transactionModel.create([ {
                        fromAccount,
                        toAccount,
                        amount,
                        idempotencyKey,
                        status: "PENDING"
                } ], { session }))[ 0 ]

                const debitLedgerEntry = await ledgerModel.create([ {
                        account: fromAccount,
                        amount: amount,
                        transaction: transaction._id,
                        type: "DEBIT"
                } ], { session })

                await (() => {
                        return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
                })()

                const creditLedgerEntry = await ledgerModel.create([ {
                        account: toAccount,
                        amount: amount,
                        transaction: transaction._id,
                        type: "CREDIT"
                } ], { session })

                await transactionModel.findOneAndUpdate(
                        { _id: transaction._id },
                        { status: "COMPLETED" },
                        { session }
                )


                await session.commitTransaction()
                session.endSession()
        } catch (error) {

                return res.status(400).json({
                message: "Transaction is Pending due to some issue, please retry after sometime",
                })

        }

        //step 10 email

        await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
        return res.status(200).json({
                message:"Transaction created successfully",
                transaction:transaction,
        })
        
}

async function createInitialFundsTransaction(req,res) {
        const {toAccount,amount,idempotencyKey} = req.body
        

        if(!toAccount || !amount || !idempotencyKey){
                console.log("Validation failed");
                return res.status(400).json({
                        message:"toAccount,amount,idempotencyKey are required"
                })
        }
        console.log("3");

        const toUserAccount = await accountModel.findOne({
                _id:toAccount,
        })
        console.log("4", toUserAccount);

        if(!toUserAccount){
                return res.status(400).json({
                        message:"invalid toAccount"
                })
        }
        

        //from acc is of user acc
        console.log("req.user =", req.user);

        console.log("req.user._id =", req.user._id);
        const fromUserAccount=await accountModel.findOne({
                user:req.user._id
        })
        console.log("5", fromUserAccount);
        if (!fromUserAccount) {
                return res.status(400).json({
                message: "System user account not found"
                })
        }

        const session= await mongoose.startSession();
        session.startTransaction();

        //IMP- TRANSACTION TO BE CREATED AT CLIENT SIDE FIRST, ON SRVER, NOT ON DATABASE, 
        //SO WE USE NEW RATHER THAN CREATE
        const transaction=new transactionModel({
                fromAccount: fromUserAccount._id,
                toAccount,
                amount,
                idempotencyKey,
                status: "PENDING"
        })
console.log("fromUserAccount =", fromUserAccount);
console.log("toUserAccount =", toUserAccount);

console.log("typeof fromUserAccount =", typeof fromUserAccount);
console.log("typeof toUserAccount =", typeof toUserAccount);
        //whenver we use seesion, we pass it in array format
        const debitLedgerEntry=await ledgerModel.create([{
                account: fromUserAccount._id,
                amount:amount,
                transaction:transaction._id,
                type: "DEBIT",
        }], {session})

        const creditLedgerEntry=await ledgerModel.create([{
                account: toAccount,
                amount:amount,
                transaction:transaction._id,
                type: "CREDIT",
        }], {session})

        transaction.status ="COMPLETED"
        await transaction.save({session})

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
                message: "Initial funds transaction completed successfully",
                transaction: transaction
        })
}

module.exports={createTransaction, createInitialFundsTransaction}