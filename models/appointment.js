const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mechanic:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    appointmentServices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AppointmentService',
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
    },
    city: {
        type: String,
    },
    barangay: {
        type: String,
    },
    postalcode: {
        type: String,
    },
    address: {
        type: String,
    },
    fuel: {
        type: String,
        required: [true, "Please enter the motorcycle fuel type"],
    },
    brand: {
        type: String,
        required: [true, "Please enter the motorcycle brand"],
    },
    year: {
        type: String,
        required: [true, "Please enter the year"],
    },
    plateNumber: {
        type: String,
        required: [true, "Please enter your plate number"],
    },
    engineNumber: {
        type: String,
        required: [true, "Please enter your engine number"],
    },
    type: {
        type: String,
        required: [true, "Please enter the motorcycle type"],
    },
    serviceType: {
        type: String,
        required: true
    },
    appointmentStatus: [
        {
            status: {
                type: String,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
            message: {
                type: String,
            },
        },
    ],
    backJob: {
        comment:{
            type:String,
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    totalPrice: {
        type: Number,
    },
    employeeUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    parts: [{
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
    }],
    totalPartPrice: {
        type: Number,
    },
    mechanicProof: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    customerProof: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Appointment', appointmentSchema);