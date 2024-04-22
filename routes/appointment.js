const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const { newBooking, myBookings, allBookings, getSingleBooking, getAllMechanics, assignTask, updateBooking, cancelledBooking, reschedBooking ,additional ,sendMechanicProof ,deleteBooking } = require("../controllers/serviceBookingController");
const { myAppointments, allMechanicReviews, reviewMechanic } = require("../controllers/mechanicController")
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/appointment/new").post(isAuthenticatedUser, newBooking);
router.route('/appointment/list').get(isAuthenticatedUser, myBookings);
router.route('/all-mechanics').get(isAuthenticatedUser, getAllMechanics);
router.route('/mechanics/task').get(isAuthenticatedUser, authorizeRoles('mechanic'), myAppointments);
router.route('/mechanic/appointment/:id').put(isAuthenticatedUser, upload.single("mechanicProof"), sendMechanicProof);
router.route('/appointment/:id').get(isAuthenticatedUser, getSingleBooking);

router.route('/admin/mechanic/list-reviews').get(isAuthenticatedUser, authorizeRoles('admin'), allMechanicReviews);
router.route('/review/mechanic/:id').put(isAuthenticatedUser, reviewMechanic);

router.route('/secretary/appointment/list').get(isAuthenticatedUser, authorizeRoles('secretary'), allBookings);
router.route('/secretary/appointment/:id').put(isAuthenticatedUser, authorizeRoles('secretary'), updateBooking);
router.route('/backjob/appointment/:id').put(isAuthenticatedUser, cancelledBooking);
router.route('/backjob/reschedule/appointment/:id').put(isAuthenticatedUser, reschedBooking);
router.route('/secretary/assign/mechanic/:id').put(isAuthenticatedUser, assignTask);
router.route('/secretary/additional/:id').put(isAuthenticatedUser, additional);

router.route('/admin/appointment/list').get(isAuthenticatedUser, authorizeRoles('admin'), allBookings);
router.route('/admin/appointment/:id')
    .put(isAuthenticatedUser, updateBooking)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteBooking);
router.route('/admin/assign/mechanic/:id').put(isAuthenticatedUser, assignTask);

module.exports = router;