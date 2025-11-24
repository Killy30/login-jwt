import { Schema, model } from "mongoose";

const checkoutSchema = new Schema({
    checkout: {type: String},
    connected: {type: Boolean, default:false},
    idConnection: {type: String},
    status: {type: Boolean, default:true},
    machine: {type: String},
    entryCode: {type: String},
    totalSaleToday: {type: Number},
    cashier: {type: String},
    sales: [{type: Schema.Types.ObjectId, ref: 'sale'}],
    store: {type: Schema.Types.ObjectId, ref: 'store'}
}, {timestamps: true})

export default model('checkout', checkoutSchema) 