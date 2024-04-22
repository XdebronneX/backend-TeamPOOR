const mongoose = require("mongoose");

const motorcycleSchema = new mongoose.Schema({
    year: {
        type: String,
        required: [true, "Please enter the year"],
    },
    brand: {
        type: String,
        required: [true, "Please enter the motorcycle brand"],
    },
    plateNumber: {
        type: String,
        required: [true, "Please enter your plate number"],
        unique: true,
    },
    engineNumber: {
        type: String,
        required: [true, "Please enter your engine number"],
        unique: true,
    },
    type: {
        type: String,
        required: [true, "Please enter the motorcycle type"],
    },
    fuel: {
        type: String,
        required: [true, "Please enter the motorcycle fuel"],
    },
    imagePlateNumber: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    imageMotorcycle: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Motorcycle", motorcycleSchema);
