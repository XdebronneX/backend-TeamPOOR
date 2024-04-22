const OrderModel = require('../models/order')
const OrderItemModel = require('../models/order-item')
const ErrorHandler = require('../utils/errorHandler')

exports.productSales = async (req, res, next) => {
    try {
        const monthlySales = await OrderModel.aggregate([
            {
                $unwind: "$orderItems" // Unwind to deconstruct orderItems array
            },
            {
                $lookup: {
                    from: "orderitems", // The name of the orderitems collection
                    localField: "orderItems",
                    foreignField: "_id",
                    as: "orderItem"
                }
            },
            {
                $unwind: "$orderItem"
            },
            {
                $lookup: {
                    from: "products", // The name of the products collection
                    localField: "orderItem.product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$dateOrdered" }, // Extract year from dateOrdered
                        month: { $month: "$dateOrdered" } // Extract month from dateOrdered
                    },
                    totalPrice: { $sum: { $multiply: ["$orderItem.quantity", "$product.price"] } } // Calculate total price only
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } } // Sort by year and month
        ]);

        res.status(200).json({
            success: true,
            monthlySales
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.mostPurchasedProduct = async (req, res, next) => {
    try {
        const mostPurchasedProduct = await OrderItemModel.aggregate([
            {
                $group: {
                    _id: "$product",
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "product.brand",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                $unwind: "$brand"
            },
            {
                $sort: { totalQuantity: -1 } // Sort by total quantity in descending order
            },
            {
                $project: {
                    _id: "$product._id",
                    name: "$product.name",
                    brand: "$brand.name",
                    totalQuantity: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            mostPurchasedProduct: mostPurchasedProduct
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.mostLoyalUser = async (req, res, next) => {
    try {
        const mostPurchasedUser = await OrderModel.aggregate([
            {
                $group: {
                    _id: "$user",
                    totalPurchased: { $sum: "$totalPrice" } // Sum up the totalPrice for each user
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $sort: { totalPurchased: -1 } // Sort by totalPurchased in descending order
            }
        ]);

        res.status(200).json({
            success: true,
            mostPurchasedUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.mostPurchasedBrand = async (req, res, next) => {
    try {
        const mostPurchasedBrand = await OrderItemModel.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "product.brand",
                    foreignField: "_id",
                    as: "product.brand"
                }
            },
            {
                $unwind: "$product.brand"
            },
            {
                $group: {
                    _id: "$product.brand.name",
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            {
                $sort: { totalQuantity: -1 } // Sort by total quantity in descending order
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            mostPurchasedBrand: mostPurchasedBrand
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
