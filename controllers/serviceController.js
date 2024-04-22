const ServiceModel = require("../models/service");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

const createService = async (req, res, next) => {
    try {
        // Ensure images is an array
        let images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];

        // Upload images to Cloudinary
        const imagesLinks = await Promise.all(images.map(async (image) => {
            const result = await cloudinary.v2.uploader.upload(image, {
                folder: 'services'
            });

            return {
                public_id: result.public_id,
                url: result.secure_url
            };
        }));

        req.body.images = imagesLinks;

        // Create the product in the database
        const service = await ServiceModel.create(req.body);

        // Respond with the created product
        res.status(201).json({
            success: true,
            service
        });
    } catch (error) {
        // Handle errors and respond with a meaningful message
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Failed to create service'
        });
    }
};

const getSingleService = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ success: false, message: 'Service ID not found!' })

    const service = await ServiceModel.findById(id);

    if (!service)
        return res.status(404).json({ success: false, message: 'Service not found!' });

    return res.status(202).json({ success: true, service })
}

const getAllServices = async (req, res, next) => {
    try {
        const services = await ServiceModel.find();

        if (services.length === 0) {
            return res.status(404).json({ success: false, message: "No services found" });
        }

        res.status(200).json({ success: true, count: services.length, services });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getAdminServices = async (req, res, next) => {
    try {
        const services = await ServiceModel.find();
        const totalServices = await ServiceModel.countDocuments();

        return res.status(200).json({
            success: true,
            totalServices,
            services
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product data',
        });
    }
};

const updateService = async (req, res, next) => {
    let service = await ServiceModel.findById(req.params.id);

    if (!service) {
        return next(new ErrorHandler('Service not found', 404));
    }

    let images = []

    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    if (images !== undefined) {

        // Deleting images associated with the product

        for (let i = 0; i < service.images.length; i++) {
            const result = await cloudinary.v2.uploader.destroy(service.images[i].public_id)
        }

        let imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: 'services'
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })
        }
        req.body.images = imagesLinks
    }

    service = await ServiceModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        service
    })
}

const deleteService = async (req, res, next) => {
    const service = await ServiceModel.findById(req.params.id);
    if (!service) {
        return next(new ErrorHandler("Service not found", 404));
    }
    await service.deleteOne();
    res.status(200).json({
        success: true,
        message: "Service deleted",
        service,
    });
};

module.exports = {
    createService,
    getSingleService,
    getAllServices,
    updateService,
    deleteService,
    getAdminServices,
}