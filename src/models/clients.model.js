import { Schema, model } from "mongoose";

const clientSchema = new Schema({
    name:{type: String},
    lastName: {type: String},
    id_client: {type: String},
    phoneNumber: {type: String},
    id_document: {type: String},
    address: {type: String},
    email: {type: String},
    store: {type: Schema.Types.ObjectId, ref:'store'},
    sales:[{ type: Schema.Types.ObjectId, ref:'sale'}],
}, {timestamps:true})

export default model('client', clientSchema)