const UserModel = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const sendtoEmail = require("../utils/sendtoEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const bcrypt = require("bcryptjs");
const TokenModel = require("../models/token");
const SupplierModel = require("../models/supplierLogs");
const ProductModel = require("../models/product");
const NotificationModel = require("../models/notification");

const registerUser = async (req, res, next) => {
  try {
    const existingEmailUser = await UserModel.findOne({
      email: req.body.email,
    });
    const existingPhoneUser = await UserModel.findOne({
      phone: req.body.phone,
    });

    if (existingEmailUser && existingPhoneUser) {
      return next(
        new ErrorHandler("Email and phone number already exist!", 400)
      );
    }

    if (existingEmailUser) {
      return next(new ErrorHandler("Email address already exist!", 400));
    }

    if (existingPhoneUser) {
      return next(new ErrorHandler("Phone number already taken!", 400));
    }

    const { firstname, lastname, phone, email, password } = req.body;

    const user = await UserModel.create({
      firstname,
      lastname,
      phone,
      email,
      password,
    });

    const token = await new TokenModel({
      verifyUser: user._id,
      token: crypto.randomBytes(32).toString("hex"),
      verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
    }).save();
    const emailVerification = `${process.env.FRONTEND_URL}/verify/email/${token.token}/${user._id}`;

    const emailContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
        <h1 style="font-size: 24px; color: #333;">Email Verification Request</h1>
        <p style="font-size: 16px; color: #555;">Hello ${user.firstname},</p>
        <p style="font-size: 16px; color: #555;">Thank you for signing up with teamPOOR - Motorcycle Parts & Services. To complete your registration, please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
            <a href="${emailVerification}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-size: 16px;" target="_blank">Verify Email</a>
        </p>
        <p style="font-size: 16px; color: #555;">If you did not request this, you can safely ignore this email.</p>
        <p style="font-size: 16px; color: #555;">Please note: Your security is important to us. We will never ask you to share your password or other sensitive information via email.</p>
        <p style="font-size: 16px; color: #555;">Best regards,<br>teamPOOR - Motorcycle Parts & Services</p>
        </div>
        </div>
    `;
    await sendtoEmail(
      user.email,
      "teamPOOR - Verify Email",
      emailContent,
      true
    );

    res
      .status(200)
      .json({ success: true, message: `Email sent to: ${user.email}. wait at least 3-5 minutes` });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "User registration failed",
      error: error.message,
    });
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return next(new ErrorHandler("Please enter email & password", 400));
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid Email or Password", 400));
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    if (!user.verified) {
      let token = await TokenModel.findOne({ verifyUser: user._id });
      if (!token || token.verificationTokenExpire < Date.now()) {
        token = await TokenModel.findOneAndUpdate(
          {
            verifyUser: user._id,
          },
          {
            token: crypto.randomBytes(32).toString("hex"),
            verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
          },
          { new: true, upsert: true }
        );
        const emailVerification = `${process.env.FRONTEND_URL}/verify/email/${token.token}/${user._id}`;

        const emailContent = `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
                <h1 style="font-size: 24px; color: #333;">Email Verification Request</h1>
                <p style="font-size: 16px; color: #555;">Hello ${user.firstname},</p>
                <p style="font-size: 16px; color: #555;">Thank you for signing up with teamPOOR - Motorcycle Parts & Services. To complete your registration, please verify your email address by clicking the button below:</p>
                <p style="text-align: center;">
                    <a href="${emailVerification}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-size: 16px;" target="_blank">Verify Email</a>
                </p>
                <p style="font-size: 16px; color: #555;">If you did not request this, you can safely ignore this email.</p>
                <p style="font-size: 16px; color: #555;">Please note: Your security is important to us. We will never ask you to share your password or other sensitive information via email.</p>
                <p style="font-size: 16px; color: #555;">Best regards,<br>teamPOOR - Motorcycle Parts & Services</p>
                </div>
                </div>
            `;
        await sendtoEmail(
          user.email,
          "teamPOOR - Verify Email",
          emailContent,
          true
        );
        res.status(403).json({
          success: false,
          message: "Token expired! new  one has been sent to your email.",
        });
      } else {
        return next(
          new ErrorHandler(
            "Please check your email for verification link.",
            403
          )
        );
      }
    } else {
      sendToken(user, 200, res);
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Internal server error!", 500));
  }
};

const logoutUser = async (req, res, next) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Internal server error!", 500));
    
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const existingUserWithPhoneNumber = await UserModel.findOne({
      phone: req.body.phone,
      _id: { $ne: req.user.id },
    });

    if (existingUserWithPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use by another user.",
      });
    }

    const newUserData = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      gender: req.body.gender,
      phone: req.body.phone,
      region: req.body.region,
      province: req.body.province,
      city: req.body.city,
      barangay: req.body.barangay,
      postalcode: req.body.postalcode,
      address: req.body.address,
    };

    /** Update Avatar */
    if (req.body.avatar !== "") {
      const user = await UserModel.findById(req.user.id);

      // Check if the user has an existing avatar
      if (user.avatar && user.avatar.public_id) {
        const image_id = user.avatar.public_id;

        // Destroy the previous avatar
        await cloudinary.v2.uploader.destroy(image_id);
      }

      // Upload the new avatar
      const uploadResult = await cloudinary.v2.uploader.upload(
        req.body.avatar,
        {
          folder: "avatars",
          width: 150,
          crop: "scale",
        }
      );

      newUserData.avatar = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      };
    }

    // Update the user profile
    const user = await UserModel.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile",
      error: error.message,
    });
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).select("password");
    const isMatched = await user.comparePassword(req.body.oldPassword);
    if (!isMatched) {
      return next(new ErrorHandler("Old password is incorrect!", 400));
    }
    user.password = req.body.password;
    await user.save();
    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the password",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorHandler("User not found with this email", 400));
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const emailContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
                <h1 style="font-size: 24px; color: #333;">Password Reset Request</h1>
                <p style="font-size: 16px; color: #555;">Hello ${user.firstname},</p>
                <p style="font-size: 16px; color: #555;">You have requested to reset your password. To proceed, please click the button below:</p>
                <p style="text-align: center;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-size: 16px;" target="_blank">Reset Password</a>
                </p>
                <p style="font-size: 16px; color: #555;">If you didn't request this, you can safely ignore this email.</p>
                <p style="font-size: 16px; color: #555;">Best regards,<br>teamPOOR - Motorcycle Parts & Services</p>
            </div>
        </div>
    `;

    try {
      await sendtoEmail(
        user.email,
        "teamPOOR - Password Recovery",
        emailContent,
        true
      );

      res
        .status(200)
        .json({ success: true, message: `Email sent to: ${user.email}` });
    } catch (emailError) {

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });
      return next(
        new ErrorHandler("There was an error sending the email", 500)
      );
    }
  } catch (error) {
    return next(
      new ErrorHandler("An error occurred while processing your request", 500)
    );
  }
};

const resetPassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  try {
    const user = await UserModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorHandler(
          "Password reset token is invalid or has been expired",
          400
        )
      );
    }

    const newPassword = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (newPassword !== confirmPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || "Internal server error", 500));
  }
};

const verifyUserEmail = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ _id: req.params.id });

    if (!user) return res.status(400).send({ message: "Invalid Link" });

    let token = await TokenModel.findOne({ verifyUser: user._id });

    if (token) {
      token.token = req.params.token;
      await token.save();
    } else {
      token = new TokenModel({
        verifyUser: user._id,
        token: req.params.token,
      });
      await token.save();
    }

    await UserModel.updateOne(
      { _id: req.params.id },
      { $set: { verified: true } }
    );

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    return next(new ErrorHandler("Internal server error", 500));
  }
};

const updateNotification = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const notification = await NotificationModel.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const userId = notification.user;

    await NotificationModel.updateMany({ user: userId }, { isRead: true });

    const notifications = await NotificationModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user")
      .lean();

    res.json(notifications);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const notificationAll = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const unreadNotifications = await NotificationModel.find({
      user,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.json({ unreadNotifications });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find();
    const totalUsers = await UserModel.countDocuments();
    return res.status(200).json({
      success: true,
      totalUsers,
      users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user data",
    });
  }
};

const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await UserModel.find({ role: "supplier" });
    const totalSuppliers = suppliers.length;
    return res.status(200).json({
      success: true,
      totalSuppliers,
      suppliers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user data",
    });
  }
};

const supplierHistoryLogs = async (req, res, next) => {
  try {
    const { supplier, products, invoiceId, dateDelivered, totalPrice, notes } =
      req.body;

    const parsedProducts = Array.isArray(products)
      ? products
      : JSON.parse(products || "[]");

    for (const productData of parsedProducts) {
      let product = await ProductModel.findById(productData.productId).populate(
        "brand"
      );

      if (!product) {
        console.log(`Product with ID ${productData.productId} not found`);
        continue;
      }

      product.stock += parseInt(productData.quantity);

      if (!product.stockLogs) {
        product.stockLogs = [];
      }

      const stockHistory = {
        name: product.name,
        brand: product.brand.name,
        quantity: parseInt(productData.quantity),
        status: "Restocked",
        by: "secretary",
      };
      product.stockLogs.push(stockHistory);

      await product.save();
    }

    const newSupplierLog = new SupplierModel({
      supplier,
      products: parsedProducts.map((productData) => ({
        productName: productData.productName,
        brandName: productData.brandName,
        quantity: productData.quantity,
        price: productData.price,
      })),
      invoiceId,
      dateDelivered,
      totalPrice,
      notes,
    });

    await newSupplierLog.save();

    return res.status(201).json({
      message: "Supplier log created successfully",
      success: true,
      newSupplierLog,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "An error occurred while submitting the supplier log" });
  }
};

const suppliedProductHistory = async (req, res) => {
  try {
    const suppliedHistoryLog = await SupplierModel.find()
      .populate("supplier")
      .sort({ dateDelivered: -1 });

    res.json({ success: true, suppliedHistoryLog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSingleSupplied = async (req, res, next) => {
  try {
    const supplied = await SupplierModel.findById(req.params.id)
      .sort({ dateDelivered: -1 })
      .lean();

    if (!supplied) {
      return next(new ErrorHandler("No supplied found with this ID", 404));
    }

    res.status(200).json({
      success: true,
      supplied,
    });
  } catch (err) {
    console.log(err);
    return next(new ErrorHandler(err.message || "Internal server error", 500));
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return next(new ErrorHandler(`User not found with id: ${req.params.id}`));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Error while fetching user details"));
  }
};

const updateUser = async (req, res, next) => {
  try {
    const newUserData = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      role: req.body.role,
    };

    const user = await UserModel.findByIdAndUpdate(req.params.id, newUserData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the user",
    });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return next(
        new ErrorHandler(`User does not exist with id: ${req.params.id}`)
      );
    }
    await user.deleteOne();
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    return next(new ErrorHandler("Error deleting the user", 500));
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,

  getAllUsers,
  getAllSuppliers,
  supplierHistoryLogs,
  suppliedProductHistory,
  getSingleSupplied,
  getUserDetails,
  updateUser,
  deleteUser,
  verifyUserEmail,
  updateNotification,
  notificationAll,
};
