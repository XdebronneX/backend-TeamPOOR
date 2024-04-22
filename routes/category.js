const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const { createCategory, getAllCategory, getCategoryDetails, updateCategoryDetails, deleteCategory } = require("../controllers/categoryController")
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.post('/add/category/new', isAuthenticatedUser, authorizeRoles('admin'), upload.single('images'), createCategory);

router.route('/admin/view/all/category').get(getAllCategory);
router.route('/admin/category/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getCategoryDetails)
    .put(isAuthenticatedUser, authorizeRoles('admin'), upload.single('images'), updateCategoryDetails)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory)

module.exports = router;
