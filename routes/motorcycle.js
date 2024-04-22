const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {
    createNewMotorcycle,
    getMotorProfile,
    updateMotor,
    getAllMotorcycles,
    getMotorcycleDetails,
    updatedMotorcycleDetails,
    deleteMotorcycle
} = require('../controllers/motorcycleController');
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.post('/create/motorcycle/new', isAuthenticatedUser, upload.single("imageMotorcycle", "imageRegistrationProof"), createNewMotorcycle);
router.get('/list-motorcycle', isAuthenticatedUser, getMotorProfile);
router.put('/motorcycle/update/profile/:id', isAuthenticatedUser, upload.single("imageMotorcycle", "imageRegistrationProof"), updateMotor);
router.route('/admin/view/all/motorcycles').get(isAuthenticatedUser, authorizeRoles('admin'), getAllMotorcycles);
router.route('/admin/motorcycle/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getMotorcycleDetails)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updatedMotorcycleDetails)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteMotorcycle)

module.exports = router;