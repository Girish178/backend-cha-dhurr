// import dotenv from "dotenv"
// dotenv.config({
//      path: "./.env"
// })
import "dotenv/config";

console.log(process.env.CLOUDINARY_API_KEY);
import connectDB from "./db/index.js";
import { app } from "./app.js";
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

