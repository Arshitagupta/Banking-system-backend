const mongoose=require("mongoose");

function connectDb() {
        mongoose.connect(process.env.MONGO_URL)
                .then(()=>{
                        console.log("Connected to db");
                })
                .catch(err => {
                        console.log("error connecting to db", err);
                        process.exit(1);
                })

                
        
}

module.exports=connectDb;