const mongoose = require('mongoose');

const appointmentServiceSchema = mongoose.Schema({
    note: [{
        remark: { type: String },
        
    }],
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }
});

module.exports = mongoose.model('AppointmentService', appointmentServiceSchema);