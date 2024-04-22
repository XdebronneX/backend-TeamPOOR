const mongoose = require("mongoose");

const supplierLogSchema = new mongoose.Schema({
    products: [
        {
            productName: {
                type: String,
            },
            brandName: {
                type: String,
            },
            quantity: {
                type: Number,
            },
            price: {
                type: Number,
            }
        },
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    invoiceId: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        // required: true,
    },
    dateDelivered: {
        type: Date,
        required: true,
    },
    supplier: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
});

module.exports = mongoose.model('SupplierLog', supplierLogSchema);