const ProductModel = require("../models/product");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const APIFeatures = require('../utils/apiFeatures')
const PriceHistoryModel = require("../models/priceHistory")

const createProduct = async (req, res, next) => {
    try {
        let images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];

        const imagesLinks = await Promise.all(images.map(async (image) => {
            const result = await cloudinary.v2.uploader.upload(image, {
                folder: 'products'
            });

            return {
                public_id: result.public_id,
                url: result.secure_url
            };
        }));

        req.body.images = imagesLinks;

        let product = await ProductModel.create(req.body);

        product = await ProductModel.findById(product._id).populate("brand");

        const stockChange = product.stock;

        const user = req.user;

        product.stockLogs.push({
            name: product.name,
            brand: product.brand.name,
            quantity: stockChange,
            status: "Initial",
            by: `${user.firstname} - ${user.role}`,
        });

        await product.save();

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {

        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
};

const getSingleProduct = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(404).json({ success: false, message: 'Product ID not found!' })

    const product = await ProductModel.findById(id)
        .populate(["brand", "category"])
        .populate({
            path: "reviews",
            populate: { path: "user", model: "User" },
        });

    if (!product)
        return res.status(404).json({ success: false, message: 'Product not found!' });

    return res.status(202).json({ success: true, product })
}


const getAllProducts = async (req, res, next) => {
    try {
        console.log(req.query);
        const apiFeatures = new APIFeatures(ProductModel.find().populate('brand'), req.query).search().filter();
        const products = await apiFeatures.query;
        const productsCount = await ProductModel.countDocuments();
        const filteredProductsCount = products.length;

        res.status(200).json({
            success: true,
            productsCount,
            filteredProductsCount,
            products,
        });
    } catch (error) {
        if (error.name === 'CastError' && error.path === 'category') {
            return res.status(400).json({ success: false, error: 'Invalid category ID' });
        }
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

const getAdminProducts = async (req, res, next) => {
    try {
        const products = await ProductModel.find().populate("brand").sort({ _id: -1 });
        const totalProducts = await ProductModel.countDocuments();

        return res.status(200).json({
            success: true,
            totalProducts,
            products
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching product data',
        });
    }
};


const priceChangeHistory = async (req, res) => {
    try {
        const priceHistoryLog = await PriceHistoryModel.find()
            .sort({ createdAt: -1 })
            .populate("product")
            .populate({
                path: "product",
                populate: { path: "brand", model: "Brand" },
            })

        res.json({ success: true, priceHistoryLog });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const getProductDetails = async (req, res, next) => {
    try {
        const product = await ProductModel.findById(req.params.id);

        if (!product) {
            return next(
                new ErrorHandler(`Product not found with id: ${req.params.id}`)
            );
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error while fetching product details'));
    }
};

const updateProduct = async (req, res, next) => {
    let product = await ProductModel.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    let images = [];

    if (typeof req.body.images === 'string') {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    if (images !== undefined) {

        for (let i = 0; i < product.images.length; i++) {
            const result = await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        let imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: 'products'
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            });
        }
        req.body.images = imagesLinks;
    }

    if (product.price != req.body.price) {
        const priceHistory = new PriceHistoryModel({
            product: product.id,
            price: req.body.price,
            status:
                req.body.price < product.price
                    ? "Decreased"
                    : req.body.price > product.price
                        ? "Increased"
                        : "Initial",
        });

        await priceHistory.save();
        console.log(priceHistory);
    }

    product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    if (!product) {
        return res.status(500).send("The product cannot be updated!");
    } else {
        res.status(200).json({
            success: true,
            product
        });
    }
}

const updateStock = async (req, res, next) => {
    let product = await ProductModel.findById(req.params.id).populate("brand");

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    const stockChange = parseInt(product.stock) + parseInt(req.body.stock);
    const updateProduct = await ProductModel.findOneAndUpdate(
        { _id: req.params.id },
        {
            $set: { stock: stockChange },
            $push: {
                stockLogs: {
                    name: product.name,
                    brand: product.brand.name,
                    quantity: req.body.stock,
                    status: req.body.stock > 0 ? "Restocked" : "Sold",
                    by: `${req.user.firstname} - ${req.user.role}`
                }
            }
        },
        { new: true }
    );

    res.status(200).json({
        success: true,
        updateProduct
    });
}

const stockHistoryLogs = async (req, res, next) => {
    try {
        const allProducts = await ProductModel.find({}).populate("brand");
        let allStockLogs = [];

        allProducts.forEach((product) => {
            allStockLogs = allStockLogs.concat(product.stockLogs);
        });

        if (allStockLogs.length === 0) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "No stock logs found for any product",
                });
        }

        allStockLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, stockLogs: allStockLogs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const deleteProduct = async (req, res, next) => {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    await product.deleteOne();
    res.status(200).json({
        success: true,
        message: "Product deleted",
    });
};

const createProductReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const fullname = `${req.user.firstname} ${req.user.lastname}`;
    const review = {
        user: req.user._id,
        name: fullname,
        rating: Number(rating),
        comment,
    };

    console.log(req.user.firstname);

    try {
        const product = await ProductModel.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const isReviewed = product.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (isReviewed) {
            product.reviews.forEach((review) => {
                if (review.user.toString() === req.user._id.toString()) {
                    review.comment = comment;
                    review.rating = rating;
                    review.name = fullname;
                }
            });
        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }

        product.ratings = product.reviews.reduce(
            (acc, item) => item.rating + acc,
            0
        ) / product.reviews.length;

        await product.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getProductReviews = async (req, res, next) => {
    const product = await ProductModel.findById(req.query.id);

    res.status(200).json({
        success: true,
        reviews: product.reviews,
    });
};

const deleteReview = async (req, res, next) => {
    const product = await ProductModel.findById(req.query.productId);

    console.log(req);

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await ProductModel.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
}

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    getAdminProducts,
    priceChangeHistory,
    getProductDetails,
    updateProduct,
    updateStock,
    stockHistoryLogs,
    deleteProduct,
    createProductReview,
    getProductReviews,
    deleteReview,
}