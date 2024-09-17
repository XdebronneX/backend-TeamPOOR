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

        const appointmentServiceIds = await Promise.all(
            req.body.appointmentServices.cartServices.map(async (appointmentService) => {
                let newServiceItem = new AppointmentServiceModel({
                    service: appointmentService._id
                });

                const foundService = await ServiceModel.findById(appointmentService._id);

                if (!foundService) {
                    validationErrors.push(`Service with ID ${appointmentService._id} not found.`);
                    return null;
                }

                if (!foundService.isAvailable) {
                    validationErrors.push(`The service ${foundService.name} is no longer available.`);
                    return null;
                }

                newServiceItem = await newServiceItem.save();
                return newServiceItem._id;
            })
        );

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join("\n")
            });
        }

        const initialAppointmentStatus = {
            status: 'PENDING',
            timestamp: new Date(),
            message: 'Appointment scheduled successfully. Awaiting confirmation.',
        };

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

exports.allBookings = async (req, res, next) => {
    try {
        const allbookings = await AppointmentModel.find().populate('mechanic', 'firstname lastname');
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

exports.requestForBackjob = async (req, res, next) => {
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
            status: 'BACKJOBPENDING',
            timestamp: Date.now(),
            message: 'Back job requested. We will process your request shortly.',
        };

        booking.appointmentStatus.push(initialAppointmentStatus);

        booking.backJob.comment = req.body.comment;
        booking.backJob.createdAt = Date.now();

        await booking.save();

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

        if (req.body.appointmentDate) {
            booking.appointmentDate = req.body.appointmentDate;
        }
        if (req.body.timeSlot) {
            booking.timeSlot = req.body.timeSlot;
        }

        await booking.save();

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
        const mechanics = await UserModel.find({ role: 'mechanic' });

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

exports.additionalServices = async (req, res, next) => {
    try {
        const { id } = req.params;
        const appointment = await AppointmentModel.findById(id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const services = req.body.services;

        const validServices = await Promise.all(services.map(async (service) => {
            const foundService = await ServiceModel.findById(service.serviceId);
            if (!foundService) {
                throw new Error(`Service ${service.serviceId} not found`);
            }
            return {
                service: foundService._id,
                serviceName: foundService.name,
                servicePrice: foundService.price,
            };
        }));

        const appointmentServices = await Promise.all(validServices.map(async (service) => {
            return await AppointmentServiceModel.create({
                service: service.service,
                note: [],
            });
        }));

        console.log("Appointment services:", appointmentServices);

        const servicePrices = validServices.map(service => service.servicePrice);

        console.log("Service prices:", servicePrices);

        // Ensure all service prices are valid numbers
        if (servicePrices.some(price => price === undefined || isNaN(price))) {
            return res.status(400).json({ success: false, message: 'Invalid service prices' });
        }

        const totalPriceSum = servicePrices.reduce((total, price) => total + price, 0);

        console.log("Total price sum:", totalPriceSum);

        let totalServicePrice = appointment.totalPrice || 0;

        console.log("Previous total price:", totalServicePrice);

        totalServicePrice += totalPriceSum;

        console.log("Updated total price:", totalServicePrice);

        // Check if totalServicePrice is a valid number
        if (isNaN(totalServicePrice)) {
            return res.status(400).json({ success: false, message: 'Invalid total price calculation' });
        }

        appointment.totalPrice = totalServicePrice;

        // Update appointmentServices
        appointment.appointmentServices = [...appointment.appointmentServices, ...appointmentServices.map(service => service._id)];

        await appointment.save();

        res.status(200).json({
            success: true,
            appointment: appointment
        });
    } catch (error) {
        console.log(error);
        return next(new Error('Error updating services'));
    }
};

exports.deleteAddedService = async (req, res, next) => {
    try {
        const { serviceId, id } = req.params;

        const appointment = await AppointmentModel.findById(id).populate({
            path: 'appointmentServices',
            populate: {
                path: 'service',
                model: 'Service'
            }
        });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        const appointmentService = appointment.appointmentServices.find(service => service._id.toString() === serviceId);

        if (!appointmentService) {
            return res.status(404).json({ success: false, error: 'Service not found in appointment services' });
        }

        if (!appointmentService.service || appointmentService.service.price === undefined) {
            return res.status(500).json({ success: false, error: 'Service price not found' });
        }

        const servicePrice = appointmentService.service.price;
        appointment.appointmentServices = appointment.appointmentServices.filter(service => service._id.toString() !== serviceId);
        appointment.totalPrice -= servicePrice;

        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Service removed from appointment successfully',
            appointment
        });
    } catch (error) {
        next(error);
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