import { Schema, model } from "mongoose";

const cashierSchema = new Schema({
    id_code: {type: Number},
    id_document: {type: String},
    name: {type: String},
    lastName: {type: String},
    address: {type: String},
    phoneNumber: {type: Number},
    email: {type: String},
    connected: {type: Boolean, default: false},
    // connection: {type: Boolean, default: false},
    // online: {type: Boolean, default: false},
    // idConnection: {type: String},
    checkout: {
        checkout: {type: Number},
        id: {type: String}
    },
    status: {type: Boolean, default: false},
    sales: [{type: Schema.Types.ObjectId, ref: 'sale'}],
    clocks: [{type: Schema.Types.ObjectId, ref: 'clock'}],
    store: {type: Schema.Types.ObjectId, ref: 'store'},
},{timestamps: true})

export default model('cashier', cashierSchema)