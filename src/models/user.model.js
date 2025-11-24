import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: { type: String, require: true, trim: true },
    lastName: {type: String, require: true, trim: true },
    email: { type: String, require: true, trim: true },
    password: { type: String, require: true, trim: true },
    admin_connections: [{type: String}],
    cashiers_connections: [
        {token: {type: String}, id: {type: String}}
    ],
    store: { type: Schema.Types.ObjectId, ref: 'store'},
    systemConfig: { type: Schema.Types.ObjectId, ref: 'systemConfig' }
}, { timestamps: true } )

export default model('user', userSchema)