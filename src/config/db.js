import mongoose from "mongoose";

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb conncected");
    }catch (e) {
        console.log(`DB connection faile with message:-${e}`);
        process.exit(1)
    }
}

export default connectDB;