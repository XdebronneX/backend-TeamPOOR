const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        brand: {
            type: String,
        },
        quantity: {
            type: Number,
        },
        status: {
            type: String,
        },
        by: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    price: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    stock: {
        type: Number,
        default: 0,
    },
    images: [{
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    }],
    ratings: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: true,
            },
            name: {
                type: String,
                // required: true,
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
            date: {
                type: Date,
                default: Date.now
            }
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    stockLogs: [stockHistorySchema],
});

module.exports = mongoose.model('Product', productSchema);