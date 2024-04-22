const OrderModel = require("../models/order");
const OrderItemsModel = require("../models/order-item");
const ProductModel = require("../models/product");
const UserModel = require("../models/user")
const ErrorHandler = require("../utils/errorHandler");
const PaymongoToken = require("../models/paymongoToken");
const axios = require("axios");
const sendtoEmail = require("../utils/sendtoEmail");
const crypto = require("crypto");
const NotificationModel = require("../models/notification");

const handlePayMongo = async (orderItemsDetails, temporaryLink) => {
    try {
        const lineItems = orderItemsDetails.map((orderItem) => ({
            currency: "PHP",
            amount: orderItem.price * orderItem.quantity * 100, // Assuming price is stored in orderItem
            description: orderItem.productName,
            name: orderItem.productName,
            quantity: orderItem.quantity,
        }));

        console.log(lineItems, "line");

        const options = {
            method: "POST",
            url: "https://api.paymongo.com/v1/checkout_sessions",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                authorization:
                    "Basic c2tfdGVzdF9KMlBMVlp3ZHV3OExwV3hGeWhZZnRlQWQ6cGtfdGVzdF9kYmpQaUZDVGJqaHlUUnVCbmVRdW1OSkY=",
            },
            data: {
                data: {
                    attributes: {
                        send_email_receipt: true,
                        show_description: true,
                        show_line_items: true,
                        line_items: lineItems,
                        payment_method_types: ["gcash"], // Specify the payment method types you accept
                        description: "Order payment", // Description for the payment
                        success_url: `${temporaryLink}`, // Redirect URL after successful payment
                    },
                },
            },
        };

        console.log(options, "options");

        const response = await axios.request(options);

        console.log(response, "rees");
        const checkoutUrl = response.data.data.attributes.checkout_url;

        return checkoutUrl; // Return the checkout URL
    } catch (error) {
        // console.error("Error creating PayMongo checkout session:", error);
        // throw error;
    }
};

exports.newOrder = async (req, res, next) => {
    try {
        const validationErrors = [];
        const user = await UserModel.findById(req.body.user);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const orderItemsDetails = [];

        const orderItemsIds = await Promise.all(
            req.body.orderItems.map(async (orderItem) => {
                const product = await ProductModel.findById(orderItem.product).populate("brand");

                if (!product) {
                    validationErrors.push(`Product with ID ${orderItem.id} not found.`);
                    return null;
                }

                if (product.stock <= 0) {
                    validationErrors.push(`Out of stock of product ${product.name}.`);
                    return null;
                }

                if (product.stock < orderItem.quantity) {
                    validationErrors.push(`Not enough stock of product ${product.name}.`);
                    return null;
                }

                // Check if payment method is Cash On Delivery
                if (req.body.paymentMethod === "Cash On Delivery") {
                    // Log the stock change
                    const stockChange = -orderItem.quantity;

                    // Update the stockLogs
                    product.stockLogs.push({
                        name: product.name,
                        brand: product.brand.name,
                        quantity: stockChange,
                        status: "Sold",
                        by: `${user.firstname} - ${user.role}`,
                    });

                    if (product) {
                        product.stock -= orderItem.quantity;
                        await product.save();
                    }
                }

                let newOrderItem = new OrderItemsModel({
                    quantity: orderItem.quantity,
                    product: orderItem.product,
                });

                orderItemsDetails.push({
                    productName: product.name,
                    quantity: orderItem.quantity,
                    price: product.price,
                });

                newOrderItem = await newOrderItem.save();
                return newOrderItem._id;
            })
        );

        // Check if there were validation errors
        if (validationErrors.length > 0) {
            console.log(validationErrors);
            return res.status(400).send(validationErrors.join("\n"));
        }

        const initialOrderStatus = {
            // Add the initial status when creating the order
            status: req.body.paymentMethod === "GCash" ? "TOPAY" : "Pending",
            timestamp: new Date(),
            message:
                req.body.paymentMethod === "GCash"
                    ? "Order placed successfully. Proceed to payment using GCash."
                    : "Order placed successfully.",
        };

        let order = new OrderModel({
            orderItems: orderItemsIds,
            user: req.body.user,
            fullname: req.body.fullname,
            phone: req.body.phone,
            region: req.body.region,
            province: req.body.province,
            city: req.body.city,
            barangay: req.body.barangay,
            postalcode: req.body.postalcode,
            address: req.body.address,
            orderStatus: [initialOrderStatus], // Include the initial order status
            totalPrice: req.body.totalPrice,
            customerUser: req.body.customerUser,
            employeeUser: req.body.employeeUser,
            dateOrdered: req.body.dateOrdered,
            dateReceived: req.body.dateReceived,
            paymentMethod: req.body.paymentMethod,
        });

        order = await order.save();

        const orderObject = order.toObject();

        console.log(orderItemsDetails, "this is order");

        const paymongoToken = await new PaymongoToken({
            orderId: order._id,
            token: crypto.randomBytes(32).toString("hex"),
            verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
        }).save();

        // HTML content for the email
        let emailContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
    <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
        <h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Order Details</h1>
        <p style="font-size: 16px; color: #555;">Hello ${user.firstname},</p>
        <p style="font-size: 16px; color: #555;">Thank you for your order with <strong>teamPOOR - Motorcycle Parts & Services</strong>.</p>
        
        <!-- Order items table -->
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Product Name</th>
                    <th style="padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Quantity</th>
                    <th style="padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${orderItemsDetails.map(item => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.productName}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.quantity}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.price}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <!-- End of order items table -->
        
        <p style="font-size: 16px; color: #555; margin-top: 20px;">If you have any questions or concerns about your order, please feel free to contact us.</p>
        <p style="font-size: 16px; color: #555;">Best regards,<br>teamPOOR - Motorcycle Parts & Services</p>
    </div>
</div>

    `;

        await sendtoEmail(
            user.email,
            "teamPOOR - Order Confirmation",
            emailContent,
            true // Set the last parameter to true to indicate HTML content
        );

        if (req.body.paymentMethod === "GCash") {
            const temporaryLink = `${process.env.FRONTEND_URL}/paymongo-gcash/${paymongoToken.token}/${order._id}`;
            console.log();

            const checkoutUrl = await handlePayMongo(
                orderItemsDetails,
                temporaryLink
            );

            console.log(checkoutUrl, "checkout");

            return res.json({ checkoutUrl });
        }

        return res.send(orderObject);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
};

exports.PaymentOrder = async (req, res, next) => {
    try {
        const order = await OrderModel.findById(req.params.id);

        if (!order) {
            return res.status(400).send("Invalid Link");
        }

        console.log(order, "order");

        const orderItemsDetails = [];

        for (const orderItemId of order.orderItems) {
            console.log(orderItemId);

            const orderItem = await OrderItemsModel.findById(orderItemId).populate(
                "product"
            );

            if (!orderItem) {
                return res
                    .status(404)
                    .send(`Order item with ID ${orderItemId} not found`);
            }

            orderItemsDetails.push({
                productId: orderItem.product._id, // assuming 'product' is the populated field
                productName: orderItem.product.name,
                quantity: orderItem.quantity,
                price: orderItem.product.price,
            });
        }

        console.log(orderItemsDetails, "item details");

        let paymongoToken = await PaymongoToken.findOne({ orderId: order._id });

        const temporaryLink = `${process.env.FRONTEND_URL}/paymongo-gcash/${paymongoToken.token}/${order._id}`;

        const checkoutUrl = await handlePayMongo(orderItemsDetails, temporaryLink);

        console.log(checkoutUrl, "checkout");

        res.json({ checkoutUrl });

        // res.send(user);
    } catch (error) {
        // Handle any other errors that may occur during the process
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

exports.gcashPayment = async (req, res, next) => {
    try {
        const order = await OrderModel.findById(req.params.id)
            .populate({
                path: "orderItems",
                populate: {
                    path: "product",
                    model: "Product",
                    populate: {
                        path: "brand",
                        model: "Brand"
                    }
                }
            });

        if (!order) {
            return res.status(400).send("Invalid Link");
        }

        const user = await UserModel.findOne({ _id: order.user });

        let paymongoToken = await PaymongoToken.findOne({ orderId: order._id });

        if (paymongoToken) {
            paymongoToken.token = req.params.token;
            await paymongoToken.save();
        } else {
            paymongoToken = new PaymongoToken({
                orderId: order._id,
                token: req.params.token,
            });
            await paymongoToken.save();
        }

        // Deduct product stock from order items and update stockLogs
        for (const orderItem of order.orderItems) {
            const product = orderItem.product;
            if (!product) {
                return res
                    .status(404)
                    .send(`Product not found for order item: ${orderItem}`);
            }
            const stockChange = -orderItem.quantity;

            // Update product stock
            await ProductModel.updateOne(
                { _id: product._id },
                { $inc: { stock: stockChange } }
            );

            // Update stockLogs
            product.stockLogs.push({
                name: product.name,
                brand: product.brand.name,
                quantity: stockChange,
                status: "Sold",
                by: `${user.firstname} - ${user.role}`,
            });

            await product.save();
        }

        // Update order status to "PAID"
        const orderStatusUpdatePaid = {
            status: "PAID",
            timestamp: new Date(),
            message: "Payment completed successfully",
        };

        order.orderStatus.push(orderStatusUpdatePaid);

        // Set isPaid field to true
        order.isPaid = true;

        await order.save();

        res.status(200).json({ message: "Payment completed successfully" });
    } catch (error) {
        // Handle any other errors that may occur during the process
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

exports.myOrders = async (req, res, next) => {
    const orders = await OrderModel.find({ user: req.user._id }).sort({ dateOrdered: -1 });
    // console.log(req.user)
    res.status(200).json({
        success: true,
        orders,
    });
};

exports.allOrders = async (req, res, next) => {
    const alllistorders = await OrderModel.find().sort({ dateOrdered: -1 });
    // console.log(orders)
    let totalAmount = 0;

    alllistorders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        totalAmount,
        alllistorders,
    });
};

exports.getSingleOrder = async (req, res, next) => {
    const order = await OrderModel.findById(req.params.id).populate({
        path: 'user',
    })
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                model: 'Product',
            },
        })
        .sort({ dateOrdered: -1 })
        .lean();

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }
    res.status(200).json({
        success: true,
        order,
    });
};

exports.updateOrder = async (req, res, next) => {
    try {
        const order = await OrderModel.findById(req.params.id);

        let message = "";

        if (req.body.orderStatus === "TOPAY") {
            message = "Please proceed to payment for your order."
        } else if (req.body.orderStatus === "TOSHIP") {
            message = "Your order is prepared and ready for shipping."
        } else if (req.body.orderStatus === "TORECEIVED") {
            message = "Your order is currently out for delivery."
            let notification = new NotificationModel({
                user: order.user,
                title: "Your Parcel is Out for Delivery",
                // message: `Your motorcycle has reached 1500 kilometers on the odometer. It's time to schedule Preventive Maintenance Service (PMS).`,
                message: `Order #${order._id} is Out for Delivery`,
            });

            notification = await notification.save();
        } else if (req.body.orderStatus === "FAILEDATTEMPT") {
            message = "Your recent delivery attempt was unsuccessful."
        } else if (req.body.orderStatus === "RETURNED") {
            message = "Unfortunately, we were unable to deliver your order despite multiple attempts. It has been returned to our facility."
        } else if (req.body.orderStatus === "DELIVERED") {
            message = "Your order has been successfully delivered."
        } else if (req.body.orderStatus === "CANCELLED") {
            message = "Your order has been cancelled"
        } else if (req.body.orderStatus === "COMPLETED") {
            message = "Your order has been completed."
        }

        const newStatus = req.body.orderStatus;
        console.log(newStatus)
        const newOrderStatus = {
            status: newStatus,
            timestamp: Date.now(),
            message: message,
        };
        order.orderStatus.push(newOrderStatus);

        await order.save();

        res.status(200).json({
            success: true,
            order: {
                _id: order._id,
                orderStatus: order.orderStatus.map((status) => ({
                    status: newStatus,
                    timestamp: status.timestamp,
                    message: status.message,
                })),
                // Add other necessary order fields
            },
        });

    } catch (error) {
        return next(new ErrorHandler('Error updating order status', 500));
    }
};

exports.deleteOrder = async (req, res, next) => {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }

    await order.remove();

    res.status(200).json({
        success: true,
    });
};
