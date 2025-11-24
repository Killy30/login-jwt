import { Schema, model } from "mongoose";

const products_categorySchema = new Schema({
    name: {type: String},
    store: { type: Schema.Types.ObjectId, ref: 'store'},
})

export default model('category', products_categorySchema)