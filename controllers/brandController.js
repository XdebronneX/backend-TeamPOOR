const BrandModel = require("../models/brand");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/errorHandler")

const createBrand = async (req, res, next) => {
    try {

        const existingBrand = await BrandModel.findOne({ name: req.body.name });

        if (existingBrand) {
            return res.status(400).json({ message: 'Brand name already exists!' });
        }

        const cloudinaryFolderOption = {
            folder: 'brands',
            width: 150,
            crop: 'scale'
        };

        const result = await cloudinary.v2.uploader.upload(req.body.images, cloudinaryFolderOption);

        const { name } = req.body;

        const brand = await BrandModel.create({
            name,
            images: {
                public_id: result.public_id,
                url: result.secure_url
            }
        });

        res.status(201).json({ success: true, brand });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create brand' });
    }
};

const getAllBrands = async (req, res, next) => {
    try {
        const brands = await BrandModel.find();
        const totalBrands = await BrandModel.countDocuments();
        return res.status(200).json({
            success: true,
            totalBrands,
            brands
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching brand data',
        });
    }
};

const getBrandDetails = async (req, res, next) => {
    try {
        const brand = await BrandModel.findById(req.params.id);

        if (!brand) {
            return next(
                new ErrorHandler(`Brand not found with id: ${req.params.id}`)
            );
        }

        res.status(200).json({
            success: true,
            brand,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching brand details'));
    }
};

const updateBrandDetails = async (req, res, next) => {
    try {
        const newUserData = {
            name: req.body.name,
        };

        const brand = await BrandModel.findByIdAndUpdate(req.params.id, newUserData, {
            new: true,
            runValidators: true,
        });

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        res.status(200).json({
            success: true,
            brand
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the brand',
        });
    }
};

const deleteBrand = async (req, res, next) => {
    try {
        const brand = await BrandModel.findById(req.params.id);
        if (!brand) {
            return next(
                new ErrorHandler(`Brand does not exist with id: ${req.params.id}`)
            );
        }
        await brand.deleteOne();
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        return next(new ErrorHandler('Error deleting the brand', 500));
    }
};

module.exports = {
    createBrand,
    getAllBrands,
    getBrandDetails,
    updateBrandDetails,
    deleteBrand,
}