const UserModel = require('../models/user')
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");

// Checks if user is authenticated or not
exports.isAuthenticatedUser = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler('Login first to access this resource.', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await UserModel.findById(decoded.id);
        if (!req.user) {
            return next(new ErrorHandler('User not found. Please login again.', 401));
        }
        next();
    } catch (err) {
        // Handle any errors that occur during token verification
        return next(new ErrorHandler('Invalid token. Please login again.', 401));
    }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return next(
            new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403)
        );
    }
    next();
};

