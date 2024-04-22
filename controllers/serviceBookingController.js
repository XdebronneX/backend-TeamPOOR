const AppointmentModel = require("../models/appointment");
const AppointmentServiceModel = require("../models/appointment-service");
const ProductModel = require("../models/product");
const ServiceModel = require("../models/service");
const UserModel = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("cloudinary");

exports.newBooking = async (req, res, next) => {
    try {
        const validationErrors = [];

        // console.log("reeeeq", req.body);
        // Now, you can safely proceed with mapping and further operations
        const appointmentServiceIds = await Promise.all(
            req.body.appointmentServices.cartServices.map(async (appointmentService) => {
                let newServiceItem = new AppointmentServiceModel({
                    service: appointmentService._id
                });


                // Check if the service exists
                const foundService = await ServiceModel.findById(appointmentService._id);

                if (!foundService) {
                    validationErrors.push(`Service with ID ${appointmentService._id} not found.`);
                    return null;
                }

                // Check if the service is available
                if (!foundService.isAvailable) {
                    validationErrors.push(`The service ${foundService.name} is no longer available.`);
                    return null;
                }

                newServiceItem = await newServiceItem.save();
                return newServiceItem._id;
            })
        );



        // Check if there were validation errors
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join("\n")
            });
        }

        // Create initial appointment status
        const initialAppointmentStatus = {
            status: 'PENDING', // Extract status from the object
            timestamp: new Date(), // Extract timestamp from the object
            message: 'Appointment scheduled successfully. Awaiting confirmation.', // Extract message from the object
        };

        // Create the appointment
        let appointment = new AppointmentModel({
            appointmentServices: appointmentServiceIds,
            // mechanic: req.body.mechanic,
            user: req.body.user,
            fullname: req.body.fullname,
            phone: req.body.phone,
            region: req.body.region,
            province: req.body.province,
            city: req.body.city,
            barangay: req.body.barangay,
            postalcode: req.body.postalcode,
            address: req.body.address,
            brand: req.body.brand,
            year: req.body.year,
            plateNumber: req.body.plateNumber,
            engineNumber: req.body.engineNumber,
            type: req.body.type,
            serviceType: req.body.serviceType,
            fuel: req.body.fuel,
            appointmentStatus: [initialAppointmentStatus],
            // employeeUser: req.body.employeeUser,
            appointmentDate: req.body.appointmentDate,
            timeSlot: req.body.timeSlot,
            totalPrice: req.body.totalPrice,
        });

        appointment = await appointment.save();

        const appointmentObject = appointment.toObject();
        res.status(200).json({ success: true, appointment: appointmentObject });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.myBookings = async (req, res, next) => {
    try {
        const bookings = await AppointmentModel.find({ user: req.user._id }).populate('mechanic');
        res.status(200).json({
            success: true,
            bookings,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
        });
    }
};

//** Admin control */
exports.allBookings = async (req, res, next) => {
    try {
        const allbookings = await AppointmentModel.find().populate('mechanic', 'firstname lastname');
        // console.log(allbookings);
        let totalAmountServices = 0;

        allbookings.forEach((booking) => {
            totalAmountServices += booking.totalPrice;
        });

        res.status(200).json({
            success: true,
            totalAmountServices,
            allbookings,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
        });
    }
};

exports.getSingleBooking = async (req, res, next) => {
    const booking = await AppointmentModel.findById(req.params.id).populate({
        path: 'user',
    })
        .populate({
            path: 'appointmentServices',
            populate: {
                path: 'service',
                model: 'Service',
            },
        })
        .sort({ dateOrdered: -1 })
        .lean();

    if (!booking) {
        return next(new ErrorHandler("No booking found with this ID", 404));
    }
    res.status(200).json({
        success: true,
        booking,
    });
};

exports.assignTask = async (req, res, next) => {
    try {
        const booking = await AppointmentModel.findById(req.params.id);

        // Update the mechanic if provided
        if (req.body.mechanic) {
            booking.mechanic = req.body.mechanic;
        }

        await booking.save();

        res.status(200).json({
            success: true,
            booking: { mechanic: booking.mechanic },
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error assigning mechanic', 500));
    }
};

exports.updateBooking = async (req, res, next) => {
    try {
        const booking = await AppointmentModel.findById(req.params.id);

        let message = "";

        if (req.body.appointmentStatus === "PENDING") {
            message = "Appointment scheduled successfully. Awaiting confirmation."
        } else if (req.body.appointmentStatus === "CONFIRMED") {
            message = "Appointment confirmed. See you at the scheduled time!"
        } else if (req.body.appointmentStatus === "INPROGRESS") {
            message = "Service in progress. Your motorcycle is being serviced."
        } else if (req.body.appointmentStatus === "DONE") {
            message = "Mechanic has completed servicing. Final checks in progress.";
        } else if (req.body.appointmentStatus === "COMPLETED") {
            message = "Service completed"
        } else if (req.body.appointmentStatus === "CANCELLED") {
            message = "Appointment cancelled. Please contact us for further assistance."
        } else if (req.body.appointmentStatus === "RESCHEDULED") {
            message = "Appointment rescheduled successfully. New date and time confirmed."
        } else if (req.body.appointmentStatus === "DELAYED") {
            message = "Apologies for the delay. Your appointment is being rescheduled."
        } else if (req.body.appointmentStatus === "NOSHOW") {
            message = "You missed your appointment. Please reschedule if needed."
        }

        const newStatus = req.body.appointmentStatus;

        const newAppointmentStatus = {
            status: newStatus,
            timestamp: Date.now(),
            message: message,
        };

        // Update the appointment status
        booking.appointmentStatus.push(newAppointmentStatus);

        await booking.save();

        res.status(200).json({
            success: true,
            booking: {
                _id: booking._id,
                appointmentStatus: booking.appointmentStatus.map((status) => ({
                    status: newStatus,
                    timestamp: status.timestamp,
                    message: status.message,
                })),
            },
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error updating order status', 500));
    }
};

exports.cancelledBooking = async (req, res, next) => {
    try {
        const booking = await AppointmentModel.findById(req.params.id);

        let message = "";

        if (req.body.appointmentStatus === "PENDING") {
            message = "Appointment scheduled successfully. Awaiting confirmation."
        } else if (req.body.appointmentStatus === "CONFIRMED") {
            message = "Appointment confirmed. See you at the scheduled time!"
        } else if (req.body.appointmentStatus === "INPROGRESS") {
            message = "Service in progress. Your motorcycle is being serviced."
        } else if (req.body.appointmentStatus === "DONE") {
            message = "Mechanic has completed servicing. Final checks in progress.";
        } else if (req.body.appointmentStatus === "COMPLETED") {
            message = "Service completed"
        } else if (req.body.appointmentStatus === "CANCELLED") {
            message = "Appointment cancelled. Please contact us for further assistance."
        } else if (req.body.appointmentStatus === "RESCHEDULED") {
            message = "Appointment rescheduled successfully. New date and time confirmed."
        } else if (req.body.appointmentStatus === "DELAYED") {
            message = "Apologies for the delay. Your appointment is being rescheduled."
        } else if (req.body.appointmentStatus === "NOSHOW") {
            message = "You missed your appointment. Please reschedule if needed."
        } else if (req.body.appointmentStatus === "BACKJOBPENDING") {
            message = "Back job requested. We weill process your request shortly."
        } else if (req.body.appointmentStatus === "BACKJOBCONFIRMED") {
            message = "Back job confirmed. Please proceed with the schedule back job."
        } else if (req.body.appointmentStatus === "BACKJOBCOMPLETED") {
            message = "Back job completed."
        }

        const initialAppointmentStatus = {
            status: 'BACKJOBPENDING', // Extract status from the object
            timestamp: Date.now(), // Extract timestamp from the object
            message: 'Back job requested. We will process your request shortly.', // Extract message from the object
        };

        // Update the appointment status
        booking.appointmentStatus.push(initialAppointmentStatus);

        // Set back job comment from request body
        booking.backJob.comment = req.body.comment;

        // Save changes to the database
        await booking.save();

        // Send response
        res.status(200).json({
            success: true,
            booking: booking
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error updating order status', 500));
    }
};

exports.reschedBooking = async (req, res, next) => {
    try {
        const booking = await AppointmentModel.findById(req.params.id);

        // Update the appointmentDate and timeSlot if they're provided in the request body
        if (req.body.appointmentDate) {
            booking.appointmentDate = req.body.appointmentDate;
        }
        if (req.body.timeSlot) {
            booking.timeSlot = req.body.timeSlot;
        }

        // Save changes to the database
        await booking.save();

        // Send response
        res.status(200).json({
            success: true,
            booking: booking
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error updating appointment date and time slot', 500));
    }
};


exports.sendMechanicProof = async (req, res, next) => {
    const newProofData = {};

    /** Update Mechanic Proof */
    if (req.body.mechanicProof !== "") {
        const appointment = await AppointmentModel.findById(req.params.id);

        if (!appointment) {
            return next(new ErrorHandler('Appointment not found', 404));
        }

        if (appointment.mechanicProof && appointment.mechanicProof.public_id) {
            const image_id = appointment.mechanicProof.public_id;
            await cloudinary.v2.uploader.destroy(image_id);
        }

        const result = await cloudinary.v2.uploader.upload(
            req.body.mechanicProof,
            {
                folder: "mechanicProof",
                width: 150,
                crop: "scale",
            }
        );

        newProofData.mechanicProof = {
            public_id: result.public_id,
            url: result.secure_url,
        };
    }

    const appointment = await AppointmentModel.findByIdAndUpdate(req.params.id, newProofData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        appointment,
    });
};

exports.getAllMechanics = async (req, res, next) => {
    try {
        // Fetch users with the role of mechanic
        const mechanics = await UserModel.find({ role: 'mechanic' });

        // Count total users with the role of mechanic
        const totalMechanics = mechanics.length;

        return res.status(200).json({
            success: true,
            totalMechanics,
            mechanics
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching mechanic data',
        });
    }
};

exports.additional = async (req, res, next) => {
    try {
        const { id } = req.params;
        const appointment = await AppointmentModel.findById(id);

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        const validationErrors = [];
        const products = await ProductModel.find({ _id: { $in: req.body.parts.map(part => part.productId) } }).populate("brand");

        if (!products || products.length !== req.body.parts.length) {
            throw new Error(`One or more products not found`);
        }

        const updatedParts = await Promise.all(req.body.parts.map(async (part) => {
            const product = products.find(product => product._id.toString() === part.productId);
            if (!product) {
                validationErrors.push(`Product ${part.productId} not found`);
                return null;
            }
            if (product.stock <= 0) {
                validationErrors.push(`Out of stock of product ${product.name}.`);
                return null;
            }
            if (product.stock < part.quantity) {
                validationErrors.push(`Not enough stock of product ${product.name}.`);
                return null;
            }
            product.stock -= part.quantity;

            const stockHistory = {
                name: product.name,
                brand: product.brand.name,
                quantity: part.quantity,
                status: 'Additional',
                by: 'secretary',
            };
            product.stockLogs.push(stockHistory);

            await product.save();

            return {
                productId: part.productId,
                productName: part.productName,
                brandName: part.brandName,
                quantity: part.quantity,
                price: product.price
            };
        }));

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join("\n")
            });
        }

        appointment.parts = updatedParts.filter(part => part !== null);

        const totalPartPrice = appointment.parts.reduce((total, part) => {
            return total + (part.quantity * part.price);
        }, 0);

        appointment.totalPartPrice = totalPartPrice;

        await appointment.save();

        res.status(200).json({
            success: true,
            appointment: appointment
        });
    } catch (error) {
        console.log(error);
        return next(new Error('Error updating parts'));
    }
};

exports.deleteBooking = async (req, res, next) => {
    const booking = await AppointmentModel.findById(req.params.id);

    if (!booking) {
        return next(new ErrorHandler("No booking found with this ID", 404));
    }

    await booking.deleteOne();

    res.status(200).json({
        success: true,
        booking
    });
};