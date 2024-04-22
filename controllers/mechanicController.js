const AppointmentModel = require("../models/appointment");
const ErrorHandler = require("../utils/errorHandler");
const FeedbackModel = require("../models/feedback");

exports.myAppointments = async (req, res, next) => {
    const taskAssigned = await AppointmentModel.find({ mechanic: req.user._id });
    const totalTask = await AppointmentModel.countDocuments({ mechanic: req.user._id });
    res.status(200).json({ success: true, totalTask, taskAssigned, });
};

exports.allMechanicReviews = async (req, res, next) => {
    try {
        // Fetch all feedbacks from the database
        const feedbacks = await FeedbackModel.find()
            .populate({
                path: "customer",
            })
            .populate({
                path: "mechanic",
            })
            .populate({
                path: "appointment",
                populate: [
                    {
                        path: "appointmentServices",
                        model: "AppointmentService",
                        populate: {
                            path: "service",
                            model: "Service",
                        },
                    },
                ],
            })
            .sort({ dateOrdered: -1 });

        console.log("Fetched feedbacks:", feedbacks); 

        res.status(200).json({ success: true, feedbacks });
        // res.send(feedbacks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

exports.reviewMechanic = async (req, res, next) => {
    try {
        const { comment, rating } = req.body;
        const appointmentId = req.params.id; // Get the appointment ID from params

        const appointment = await AppointmentModel.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        // Check if the user has already reviewed the mechanic
        let existingFeedback = await FeedbackModel.findOne({
            appointment: appointmentId,
        });

        if (existingFeedback) {
            // If feedback already exists, update it
            existingFeedback.comment = comment;
            existingFeedback.rating = rating;
            await existingFeedback.save();
            return res.status(200).json({ success: true, feedback: existingFeedback }); // Return the updated feedback
        }

        // Create new feedback
        const feedback = new FeedbackModel({
            appointment: appointmentId,
            mechanic: appointment.mechanic,
            customer: appointment.user,
            name: req.user.firstname, // Assuming you have user authentication middleware
            rating,
            comment,
        });

        await feedback.save();

        res.status(201).json({ success: true, feedback });
    } catch (error) {
        console.error("Error creating or updating feedback:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
