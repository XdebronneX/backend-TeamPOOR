const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const { registerUser, loginUser, logoutUser, 
    getUserProfile, updateProfile, updatePassword,
    forgotPassword, resetPassword, getAllUsers, getAllSuppliers, getUserDetails, updateUser, deleteUser, verifyUserEmail, updateNotification, notificationAll } = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);

router.get('/me', isAuthenticatedUser, getUserProfile);
router.put('/me/update', isAuthenticatedUser, upload.single("avatar"), updateProfile);
router.put('/password/update', isAuthenticatedUser, updatePassword);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);
router.route('/verify/email/:token/:id').get(verifyUserEmail);
router.get('/user-notification/unread', isAuthenticatedUser, notificationAll);
router.put('/user-notification/:id', isAuthenticatedUser, updateNotification);

router.route('/admin/view/all/users').get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.route('/admin/view/all/suppliers').get(isAuthenticatedUser, authorizeRoles('admin'), getAllSuppliers);

router.route('/admin/users/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getUserDetails)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateUser)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser)


module.exports = router;