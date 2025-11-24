import { Schema, model } from "mongoose";

const productsSchema = new Schema({
    name: {type: String},
    price: {type: Number},
    code: {type: Number},
    itbis: {type: Number},
    description: {type: String},
    category: {type: String},
    status: {type: Boolean, default: true},
    store: { type: Schema.Types.ObjectId, ref: 'store'},
}, {timestamps: true})

export default model('product', productsSchema)