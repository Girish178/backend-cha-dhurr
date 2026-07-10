import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config()

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is Running at PORT : ${process.env.PORT}`);
    })
    app.on("error",(error)=>{           //not necessary but to improve code base
        console.log("ERROR:",error);
        throw error;        
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed  !!!",err);
    
})

