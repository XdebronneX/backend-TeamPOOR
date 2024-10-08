const FuelModel = require('../models/fuel');
const ErrorHandler = require("../utils/errorHandler");
const MotorcycleModel = require("../models/motorcycle");
const sendtoEmail = require("../utils/sendtoEmail");
const NotificationModel = require("../models/notification");


const createFuel = async (req, res, next) => {
    try {
        const { date, motorcycle, odometer, price, quantity, totalCost, fillingStation, notes } = req.body;
        const userId = req.user.id;

        const userMotorcycle = await MotorcycleModel.findOne({ owner: userId });

        if (!userMotorcycle) {
            return next(new ErrorHandler("User does not have a motorcycle", 404));
        }

        const newFuel = await FuelModel.create({
            date,
            odometer,
            price,
            quantity,
            totalCost,
            fillingStation,
            notes,
            user: userId,
            motorcycle
        });

        try {
            if (odometer >= 1000 && odometer % 1000 === 0) {
                const { brand, plateNumber } = userMotorcycle;

                let notification = new NotificationModel({
                    user: userId,
                    title: "PMS Reminder",
                    message: `Time for PMS! Your motorcycle ${brand} (${plateNumber}) hit ${odometer} km.`,
                });

                notification = await notification.save();

                let emailContent = `
                    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
                        <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
                            <h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Odometer Alert</h1>
                            <p style="font-size: 16px; color: #555;">Hello,</p>
                            <p style="font-size: 16px; color: #555;">The odometer of your motorcycle <strong>${brand} - ${plateNumber}</strong> has reached ${odometer} km on ${new Date(date).toLocaleDateString()}.</p>
                            <p style="font-size: 16px; color: #555;">Please check and perform the necessary maintenance.</p>
                            <p style="font-size: 16px; color: #555;">Best regards,<br>TeamPoor</p>
                        </div>
                    </div>
                `;

                if (req.user.email) {
                    await sendtoEmail(
                        req.user.email,
                        "PMS Alert",
                        emailContent,
                        true
                    );

                    console.log("Notification email sent.");
                } else {
                    console.log("User email is not defined.");
                }
            } else {
                console.log("Odometer value is below 1000 or not a multiple of 1000.");
            }
        } catch (error) {
            console.error("Error sending notification:", error);
        }

        res.status(201).json({
            success: true,
            newFuel,
        });
    } catch (error) {
        return next(new ErrorHandler("Failed to create a new fuel tracker", 500));
    }
};

const getFuelDetails = async (req, res, next) => {
    try {
        const fuel = await FuelModel.findById(req.params.id);

        if (!fuel) {
            return next(
                new ErrorHandler(`Fuel not found with id: ${req.params.id}`)
            );
        }

        res.status(200).json({
            success: true,
            fuel,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching fuel details'));
    }
};

const getFuelProfile = async (req, res, next) => {
    try {
        const userFuel = await FuelModel.find({ user: req.user._id }).populate('motorcycle');
        if (!userFuel) {
            return next(new ErrorHandler("User fuels not found", 404));
        }
        res.status(200).json({
            success: true,
            userFuel,
        });
    } catch (error) {
        console.log(error);
        next(new ErrorHandler("Internal Server Error", 500));
    }
};

const updateFuelDetails = async (req, res, next) => {
    try {
        const newFuelData = {
            odometer: req.body.odometer,
            price: req.body.price,
            quantity: req.body.quantity,
            totalCost: req.body.totalCost,
            fillingStation: req.body.fillingStation,
            note: req.body.note,
        };

        const fuel = await FuelModel.findByIdAndUpdate(req.params.id, newFuelData, {
            new: true,
            runValidators: true,
        });

        if (!fuel) {
            return next(new ErrorHandler(404, 'Motorcycle not found'));
        }

        res.status(200).json({
            success: true,
            fuel
        });
    } catch (error) {
        return next(new ErrorHandler('An error occurred while updating the fuel', 500));
    }
};

const deleteFuel = async (req, res, next) => {
    try {
        const fuel = await FuelModel.findById(req.params.id);
        if (!fuel) {
            return next(
                new ErrorHandler(`Fuel does not exist with id: ${req.params.id}`)
            );
        }
        await fuel.deleteOne();
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        return next(new ErrorHandler('Error deleting the fuel', 500));
    }
}

module.exports = {
    createFuel,
    getFuelDetails,
    getFuelProfile,
    updateFuelDetails,
    deleteFuel,
}