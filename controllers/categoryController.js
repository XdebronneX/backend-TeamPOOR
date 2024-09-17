const CategoryModel = require("../models/category");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/errorHandler")

const createCategory = async (req, res, next) => {
    try {
        const existingCategory = await CategoryModel.findOne({ name: req.body.name });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category name already exists!' });
        }

        const cloudinaryFolderOption = {
            folder: 'category',
            width: 150,
            crop: 'scale'
        };

        const result = await cloudinary.v2.uploader.upload(req.body.images, cloudinaryFolderOption);

        const { name } = req.body;

        const category = await CategoryModel.create({
            name,
            images: {
                public_id: result.public_id,
                url: result.secure_url
            }
        });

        res.status(201).json({ success: true, category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create category' });
    }
};

const getAllCategory = async (req, res, next) => {
    try {
        const categories = await CategoryModel.find();
        const totalCategories = await CategoryModel.countDocuments();
        return res.status(200).json({
            success: true,
            totalCategories,
            categories
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching brand data',
        });
    }
};

const updateCategoryDetails = async (req, res, next) => {
    try {
        const newCategoryData = {
            name: req.body.name
        };

        const category = await CategoryModel.findByIdAndUpdate(req.params.id, newCategoryData, {
            new: true,
            runValidators: true,
        });

        if (!category) {
            return next(new ErrorHandler('Category not found', 404,));
        }

        res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        return next(new ErrorHandler('An error occurred while updating the category', 500));
    }
};

const getCategoryDetails = async (req, res, next) => {
    try {
        const category = await CategoryModel.findById(req.params.id);

        if (!category) {
            return next(
                new ErrorHandler(`Category not found with id: ${req.params.id}`)
            );
        }

        res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching category details'));
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const category = await CategoryModel.findById(req.params.id);
        if (!category) {
            return next(
                new ErrorHandler(`Category does not exist with id: ${req.params.id}`)
            );
        }
        await category.deleteOne();
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        return next(new ErrorHandler('Error deleting the category', 500));
    }
};

module.exports = {
    createCategory,
    getAllCategory,
    getCategoryDetails,
    updateCategoryDetails,
    deleteCategory
}