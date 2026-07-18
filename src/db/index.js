import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL?.trim();

        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not defined in your .env file");
        }

        const uri = new URL(mongoUrl);
        uri.pathname = `/${DB_NAME}`;

        const connectionInstance = await mongoose.connect(uri.toString());

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB connection FAILED", error);
        process.exit(1);
    }
};

export default connectDB
