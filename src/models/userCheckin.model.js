import { Schema, model } from "mongoose";

const userCheckinSchema = new Schema({
    checkin: [{ type: Date }],
    checkout: [{ type: Date }],
    checkList: [{checkin: { type: Date }, checkout: { type: Date }}],
    cashier: { type: Schema.Types.ObjectId, ref: 'cashier'}
}, {timestamps: true})

export default model('userCheckin', userCheckinSchema)