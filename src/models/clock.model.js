import { Schema, model } from "mongoose";

const clockSchema = new Schema({
    clockin: [{ type: Date }],
    clockout: [{ type: Date }],
    checkout: {typr: String},
    clockList: [{clockin: { type: Date }, clockout: { type: Date }}],
    cashier: { type: Schema.Types.ObjectId, ref: 'cashier'}
}, {timestamps: true})

export default model('clock', clockSchema)