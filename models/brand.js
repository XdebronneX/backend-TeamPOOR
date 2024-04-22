const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true, 
    },

    images: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Brand', brandSchema)
