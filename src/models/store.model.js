import { model, Schema } from "mongoose";

const storeSchema = new Schema({
    storeName: { type: String },
    storeType: { type: String },
    phoneNumber: { type: Number },
    address: { type: String },
    address2: { type: String },
    categorys: [{ type: Schema.Types.ObjectId, ref: 'category'}],
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    products: [{ type: Schema.Types.ObjectId, ref: 'product'}],
    sales: [{ type: Schema.Types.ObjectId, ref: 'sale'}],
    cashiers: [{ type: Schema.Types.ObjectId, ref: 'cashier'}],
    clients: [{ type: Schema.Types.ObjectId, ref: 'client'}],
    checkouts: [{ type: Schema.Types.ObjectId, ref: 'checkout'}]
})

export default model('store', storeSchema)