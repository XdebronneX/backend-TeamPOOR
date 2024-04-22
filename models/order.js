const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
        required: true
    }],
    fullname: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    province: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    barangay: {
        type: String,
        required: true
    },
    postalcode: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    orderStatus: [
        {
            status: {
                type: String,
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            message: {
                type: String,
                required: true,
            },
        },
    ],
    totalPrice: {
        type: Number,
    },
    employeeUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateOrdered: {
        type: Date,
        default: Date.now,
    },
    dateReceived: {
        type: Date,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model('Order', orderSchema);