import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: { type: String },
    email: { type: String, require: true, trim: true },
    password: { type: String, require: true, trim: true }
}, { timestamps: true } )

export default model('user', userSchema)