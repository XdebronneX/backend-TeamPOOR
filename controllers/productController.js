const ProductModel = require("../models/product");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const APIFeatures = require('../utils/apiFeatures')
const PriceHistoryModel = require("../models/priceHistory")

/** Create Product by admin */
const createProduct = async (req, res, next) => {
    try {
        // Ensure images is an array
        let images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];

        // Upload images to Cloudinary
        const imagesLinks = await Promise.all(images.map(async (image) => {
            const result = await cloudinary.v2.uploader.upload(image, {
                folder: 'products'
            });

            return {
                public_id: result.public_id,
                url: result.secure_url
            };
        }));

        // Update req.body with the Cloudinary image details
        req.body.images = imagesLinks;

        // Create the product in the database
        let product = await ProductModel.create(req.body);

        // Fetch the created product with populated brand field
        product = await ProductModel.findById(product._id).populate("brand");

        // Initialize stock change to the initial stock value of the product
        const stockChange = product.stock;

        // Fetch user information from the request (or wherever it's available)
        const user = req.user; // Adjust according to your authentication mechanism

        // Log the initial stock in the stock history
        product.stockLogs.push({
            name: product.name,
            brand: product.brand.name,
            quantity: stockChange,
            status: "Initial",
            by: `${user.firstname} - ${user.role}`,
        });

        // Save the product after updating the stock history
        await product.save();

        // Respond with the created product
        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        // Handle errors and respond with a meaningful message
        console.error(error);
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

    const product = await ProductModel.findById(id);

    if (!product)
        return res.status(404).json({ success: false, message: 'Product not found!' });

    return res.status(202).json({ success: true, product })
}

//** Fetch all products */ 
const getAllProducts = async (req, res, next) => {
    try {
        console.log(req.query);
        // const resPerPage = 4;
        const apiFeatures = new APIFeatures(ProductModel.find().populate('brand'), req.query).search().filter();
        // apiFeatures.pagination(resPerPage);
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
        // Check if the error is due to ObjectId casting issue
        if (error.name === 'CastError' && error.path === 'category') {
            // Handle the error gracefully, perhaps by sending a 400 Bad Request response
            return res.status(400).json({ success: false, error: 'Invalid category ID' });
        }
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

//**Get all products by admin */
const getAdminProducts = async (req, res, next) => {
    try {
        const products = await ProductModel.find().populate("brand");
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

//** Price Change History */
const priceChangeHistory = async (req, res) => {
    try {
        // Fetch all price logs from PriceHistory model, sorted from latest to oldest
        const priceHistoryLog = await PriceHistoryModel.find()
            .sort({ createdAt: -1 }) 
            .populate("product")
            .populate({
                path: "product",
                populate: { path: "brand", model: "Brand" },
            })

        res.json({ success: true, priceHistoryLog });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

//**Get product details by admin  */ 
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
        // Handle errors here
        console.error(error);
        return next(new ErrorHandler('Error while fetching product details'));
    }
};

//**Update product by admin  */ 
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

        // Deleting images associated with the product

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
            product: product.id, // Set the product reference
            price: req.body.price, // Set the price from the product
            status:
                req.body.price < product.price
                    ? "Decreased"
                    : req.body.price > product.price
                        ? "Increased"
                        : "Initial", // Set the initial status
        });

        await priceHistory.save();

        console.log(priceHistory);
    }

    // Update the product here
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

    // Calculate stock change
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
        { new: true } // Return the updated document
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

        // Sort the allStockLogs array by timestamp (assuming the timestamp field is called 'createdAt')
        allStockLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, stockLogs: allStockLogs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

//**Delete product by admin */ 
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

    const fullname  = `${req.user.firstname} ${req.user.lastname}`;
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