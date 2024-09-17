const MotorModel = require("../models/motorcycle");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");

const createNewMotorcycle = async (req, res, next) => {
    try {

        const existingPlateNumber = await MotorModel.findOne({ plateNumber: req.body.plateNumber });

        if (existingPlateNumber) {
            return res.status(400).json({ message: 'Plate number already exists!' });
        }

        const imgMotorcycle = await cloudinary.v2.uploader.upload(req.body.imageMotorcycle, {
            folder: 'motorcycles',
            width: 150,
            crop: 'scale'
        }, (err, cloudinaryRes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Image of motorcycle upload failed!' });
            }
            console.log(cloudinaryRes);
        });

        const imgPlatenumber = await cloudinary.v2.uploader.upload(req.body.imagePlateNumber, {
            folder: 'orcr',
            width: 150,
            crop: 'scale'
        }, (err, cloudinaryRes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Image of plate number upload failed!' });
            }
            console.log(cloudinaryRes);
        });

        const {year, brand, plateNumber, engineNumber, type, fuel } = req.body;

        const owner = req.user.id;

        const motorcycle = await MotorModel.create({
            year,
            brand,
            plateNumber,
            engineNumber,
            type,
            fuel,
            owner,
            imageMotorcycle: {
                public_id: imgMotorcycle.public_id,
                url: imgMotorcycle.secure_url
            },
            imagePlateNumber: {
                public_id: imgPlatenumber.public_id,
                url: imgPlatenumber.secure_url
            }
        });

        res.status(201).json({
            success: true,
            motorcycle,
        });
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Failed to create a new motorcycle", 500));
    }
};

const getMotorProfile = async (req, res, next) => {
    try {
        const userMotorcycles = await MotorModel.find({ owner: req.user._id });
        if (!userMotorcycles) {
            return next(new ErrorHandler("User motorcycles not found", 404));
        }
        res.status(200).json({
            success: true,
            userMotorcycles,
        });
    } catch (error) {
        next(new ErrorHandler("Internal Server Error", 500));
    }
};

const updateMotor = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return next(new ErrorHandler("Invalid ID", 404));

    try {
        const loggedInUserId = req.user.id;

        const motorcycle = await MotorModel.findOne({ _id: id });

        if (!motorcycle)
            return next(new ErrorHandler("Motorcycle not found", 404));

        if (motorcycle.owner.toString() !== loggedInUserId) {
            return next(new ErrorHandler("Unauthorized Access", 403));
        }

        const updatedMotorcycle = await MotorModel.findByIdAndUpdate(id, req.body, { new: true });

        return res.json({ success: true, motorcycle: updatedMotorcycle });
    } catch (err) {
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};


const getAllMotorcycles = async (req, res, next) => {
    try {
        const motorcycles = await MotorModel.find();
        const totalMotorcycles = await MotorModel.countDocuments();
        return res.status(200).json({
            success: true,
            totalMotorcycles,
            motorcycles
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching motorcycle data',
        });
    }
};

const getMotorcycleDetails = async (req, res, next) => {
    try {
        const motorcycle = await MotorModel.findById(req.params.id);

        if (!motorcycle) {
            return next(
                new ErrorHandler(`Motorcycle not found with id: ${req.params.id}`)
            );
        }

        res.status(200).json({
            success: true,
            motorcycle,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching user details'));
    }
};

const updatedMotorcycleDetails = async (req, res, next) => {
    try {
        const newMotorcycleData = {
            year: req.body.year,
            brand: req.body.brand,
            plateNumber: req.body.plateNumber,
        };

        const motorcycle = await MotorModel.findByIdAndUpdate(req.params.id, newMotorcycleData, {
            new: true,
            runValidators: true,
        });

        if (!motorcycle) {
            return next(new ErrorHandler(404, 'Motorcycle not found'));
        }

        res.status(200).json({
            success: true,
            motorcycle
        });
    } catch (error) {
        // Handle errors using the ErrorHandler
        next(new ErrorHandler(500, 'An error occurred while updating the motorcycle', error));
    }
};

const deleteMotorcycle = async (req, res, next) => {
    try {
        const motorcycle = await MotorModel.findById(req.params.id);
        if (!motorcycle) {
            return next(
                new ErrorHandler(`Motorcycle does not exist with id: ${req.params.id}`)
            );
        }
        await motorcycle.deleteOne();
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        return next(new ErrorHandler('Error deleting the motorcycle', 500));
    }
};

module.exports = { 
    createNewMotorcycle, 
    getMotorProfile,
    updateMotor,

    getAllMotorcycles,
    getMotorcycleDetails,
    updatedMotorcycleDetails,
    deleteMotorcycle,
};
