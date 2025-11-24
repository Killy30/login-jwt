import { Schema, model } from "mongoose";

const salesSchema = new Schema({
    code: {type:String},
    products:[{ type: Schema.Types.ObjectId, ref: 'product'}],
    productsSold:[{ 
        productCode: Number, 
        productName: String,
        salePrice: Number,  
        itbis: Number
    }],
    totalPrice: {type:Number},
    subTotal: {type:Number},
    pay: {type:Number},
    change: {type:Number},
    paymentMethod: {type: String},
    itbis: {type:Number},
    useItbis: {type:Boolean, default: false},
    store: { type: Schema.Types.ObjectId, ref: 'store'},
    cashier: { type: Schema.Types.ObjectId, ref: 'cashier'},
    checkout: { type: Schema.Types.ObjectId, ref: 'checkout'},
    client: {type: Schema.Types.ObjectId, ref:'client'},
},{timestamps: true})

export default model('sale', salesSchema)