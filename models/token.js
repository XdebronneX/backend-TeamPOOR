const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    verifyUser: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    verificationTokenExpire: Date,
})

module.exports = mongoose.model('Token', tokenSchema);