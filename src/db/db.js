import mongoose from "mongoose";

export const connectionDB = async() =>{
    try {
        await mongoose.connect('mongodb://localhost/test')
        console.log("db is connected")
    } catch (error) {
        console.error('database failed', error)
    }
}