const express = require('express')
const router = express.Router()
const { createFuel, getFuelDetails,  getFuelProfile, updateFuelDetails, deleteFuel } = require('../controllers/fuelController')
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth")

router.post('/add-fuel', isAuthenticatedUser, createFuel);
router.get('/list-fuel', isAuthenticatedUser, getFuelProfile);
router.route('/user/fuel/:id')
    .get(isAuthenticatedUser, getFuelProfile)
    .put(isAuthenticatedUser, updateFuelDetails)
    .delete(isAuthenticatedUser, deleteFuel)

module.exports = router;