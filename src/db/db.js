import mongoose from "mongoose";

export const connectionDB = async() =>{
    try {
        await mongoose.connect('mongodb://localhost/pos_systemDB')
        console.log("db is connected")
    } catch (error) {
        console.error('database failed', error)
    }
}