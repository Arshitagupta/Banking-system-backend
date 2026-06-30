const {Router}=require("express");
const authMiddleware=require("../middleware/auth.middleware")
const transactionController=require("../controllers/transaction.controller");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");

const transactionRoutes=Router();


//post- /api/transaction/ -> create a transaction
transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)

//post- /api/transaction/system/initial-funds
transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports=transactionRoutes;