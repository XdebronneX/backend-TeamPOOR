const express = require('express')
const router = express.Router()
const upload = require("../utils/multer");

const { createService, getSingleService, getAllServices, updateService, deleteService, getAdminServices } = require('../controllers/serviceController')
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.post('/add-service', isAuthenticatedUser, authorizeRoles('admin'),upload.array('images', 10), createService);
router.get('/showSingleService/:id', getSingleService);
router.get('/showAllServices', getAllServices);

router.route('/admin/view/all/services').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminServices);
router.route('/admin/service/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateService)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteService)

module.exports = router;