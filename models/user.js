const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, 'Please enter your firstname'],
        minlength: [4, 'firstname must be at least 4 characters long.'],
        maxLength: [30, 'Your name cannot exceed 30 characters']
    },
    lastname: {
        type: String,
        required: [true, 'Please enter your lastname'],
        minlength: [4, 'lastname must be at least 4 characters long.'],
        maxLength: [30, 'Your name cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'Please eneter valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Your password must be at least 6 characters long'],
        maxlength: [10, 'Your password must not exceed 10 characters.'],
        select: false
    },
    gender: {
        type: String,
    },
    birthday: {
        type: Date,
    },
    phone: {
        type: String,
        required: [true, 'Please enter your phone number'],
        unique: true,
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    role: {
        type: String,
        default: "user"
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
})

/** This schema for create token when user is register and also login import jwttoken package*/
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

/** This schema is for hashing password import the bcrypt package*/
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

/** This schema for login import the bcrypt package */
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Set token expire time
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return resetToken
}


module.exports = mongoose.model('User', userSchema);