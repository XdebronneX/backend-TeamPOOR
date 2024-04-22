const express = require('express');
const router = express.Router();
const {
    createNewAddresses,
    getMyAddress,
    updateAddresses,
    getAddressesDetails,
    updateDefaultAddress,
    deleteAddresses,
} = require('../controllers/addressController');
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.post('/create/my-address', isAuthenticatedUser, createNewAddresses);
router.get('/my-addresses', isAuthenticatedUser, getMyAddress);
router.put('/default/:id', isAuthenticatedUser, updateDefaultAddress);
router.route('/my-address/:id')
    .get(isAuthenticatedUser, getAddressesDetails)
    .put(isAuthenticatedUser, updateAddresses)
    .delete(isAuthenticatedUser, deleteAddresses);

module.exports = router;