const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const { createBrand, getAllBrands, getBrandDetails, updateBrandDetails, deleteBrand } = require("../controllers/brandController")
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.post('/add/brand/new', isAuthenticatedUser, authorizeRoles('admin'), upload.single('images'), createBrand);

router.route('/admin/view/all/brands').get(isAuthenticatedUser, authorizeRoles('admin'), getAllBrands);
router.route('/admin/brands/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getBrandDetails)
    .put(isAuthenticatedUser, authorizeRoles('admin'), upload.single('images'), updateBrandDetails)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteBrand)

module.exports = router;