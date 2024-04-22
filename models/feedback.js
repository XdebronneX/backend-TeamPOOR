const mongoose = require("mongoose");

const feedbackSchema = mongoose.Schema({
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true
    },
    mechanic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Feedback', feedbackSchema);