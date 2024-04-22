const mongoose = require("mongoose");

const fuelSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    motorcycle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Motorcycle",
        required: true,
    },
    odometer: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    totalCost: {
        type: Number,
        required: true,
    },
    fillingStation: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },

})

module.exports = mongoose.model('Fuel', fuelSchema);