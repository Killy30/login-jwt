import { Schema, model } from "mongoose";

const systemConfigSchema = new Schema({
    admi_password: { type: String, trim: true },
    footText: {type: String, trim: true},
    itbis: { type: Boolean, default: false },
    sale_with_ITBIS: { type: Boolean, default: false },
    typePrint: { type: String, default: 'ticket' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
})

export default model('systemConfig', systemConfigSchema)