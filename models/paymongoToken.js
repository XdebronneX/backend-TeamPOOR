const mongoose = require("mongoose");

const paymongoTokenSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('PaymongoToken', paymongoTokenSchema);