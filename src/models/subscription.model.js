import mongoose, {schema} from "mongoose"
import { User } from "./user.model"

const subscriptionSchema=new schema({
    subscriber:{
        type:mongoose.Schema.ObjectId,//one who is subscribing
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.ObjectId,//one to whom the "subscriber" is subscribing
        ref:"User"
    }
},{timestamps:true})

export const subscription=mongoose.model("subscription",subscriptionSchema)