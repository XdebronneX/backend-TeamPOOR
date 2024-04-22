const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    region: {
        type: String,
        required: true,
    },
    province: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    barangay: {
        type: String,
        required: true,
    },
    postalcode: {
        type: Number,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Address', addressSchema)