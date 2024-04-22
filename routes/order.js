const express = require("express");
const router = express.Router();

const {
    newOrder,
    getSingleOrder,
    myOrders,
    allOrders,
    updateOrder,
    deleteOrder,
    gcashPayment,
    PaymentOrder,
} = require("../controllers/orderController");
const { totalOrders, totalSales, salesPerMonth  } = require("../controllers/reportsController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/order/new").post(isAuthenticatedUser, newOrder);
router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder);
router.route('/paymongo-gcash/:token/:id').get(gcashPayment);
router.route('/payment/:id').get(isAuthenticatedUser, PaymentOrder);
router.route('/orders/me').get(isAuthenticatedUser, myOrders);

router.route('/admin/orders/').get(isAuthenticatedUser, authorizeRoles('admin'), allOrders);
router.route('/admin/order/:id')
.put(isAuthenticatedUser, updateOrder)
.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);

router.route('/secretary/orders/').get(isAuthenticatedUser, authorizeRoles('secretary'), allOrders);
router.route('/secretary/order/:id').put(isAuthenticatedUser, authorizeRoles('secretary'), updateOrder)


module.exports = router;