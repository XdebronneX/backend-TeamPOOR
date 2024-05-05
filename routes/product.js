const express = require("express");
const router = express.Router();
const upload = require("../utils/multer")
const { createProduct, getAdminProducts,
    priceChangeHistory,
    getProductDetails, getAllProducts,
    getSingleProduct, deleteProduct,
    updateProduct, updateStock, stockHistoryLogs ,createProductReview,
    getProductReviews, deleteReview } = require("../controllers/productController");
const { productSales, mostPurchasedProduct, mostLoyalUser, mostPurchasedBrand } = require("../controllers/reportsController");
const { supplierHistoryLogs, suppliedProductHistory, getSingleSupplied } = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.post('/add/product/new', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), createProduct);
router.get('/showAllProducts', getAllProducts);
router.get('/showSingleProduct/:id', getSingleProduct);

router.put('/review', isAuthenticatedUser, createProductReview);
router.get('/reviews', isAuthenticatedUser, getProductReviews)

router.route('/reviews').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteReview)
router.route('/admin/view/all/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);

router.route('/admin/stock/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateStock)
router.get('/admin/stock/history/logs', isAuthenticatedUser, authorizeRoles('admin'), stockHistoryLogs);
router.get('/admin/price/history/logs', isAuthenticatedUser, authorizeRoles('admin'), priceChangeHistory);
router.get('/admin/supplied/product/history', isAuthenticatedUser, authorizeRoles('admin'), suppliedProductHistory);
router.post('/admin/supplier/history/logs', isAuthenticatedUser, supplierHistoryLogs);
router.route('/admin/single/supplied/:id').get(isAuthenticatedUser, getSingleSupplied);

router.route('/admin/product/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateProduct)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateStock)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct)

router.get('/products/sales', productSales);
router.get('/most/purchased-product', mostPurchasedProduct);
router.get('/most/purchased-brand', mostPurchasedBrand);
router.get('/most/loyal-user', mostLoyalUser);


module.exports = router;