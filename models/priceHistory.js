const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
        },
        price: {
            type: Number,
        },
        status: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model('PriceHistory', priceHistorySchema);