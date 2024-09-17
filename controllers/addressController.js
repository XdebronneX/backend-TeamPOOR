const AddressesModel = require("../models/address");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

const createNewAddresses = async (req, res, next) => {
    try {
        const { address, region, province, city, barangay, postalcode } = req.body;

        const user = req.user.id;

        const newAddresses = await AddressesModel.create({
            address,
            region,
            province,
            city,
            barangay,
            postalcode,
            user, 
        });

        res.status(201).json({
            success: true,
            newAddresses,
        });
    } catch (error) {
        return next(new ErrorHandler("Failed to create a new address", 500));
    }
};

const getMyAddress = async (req, res, next) => {
    try {
        const userAddresses = await AddressesModel.find({ user: req.user._id });
        if (!userAddresses) {
            return next(new ErrorHandler("User address not found", 404));
        }
        res.status(200).json({
            success: true,
            userAddresses,
        });
    } catch (error) {
        next(new ErrorHandler("Internal Server Error", 500));
    }
};

const getAddressesDetails = async (req, res, next) => {
    try {
        const addresses = await AddressesModel.findById(req.params.id);
        if (!addresses) {
            return next(
                new ErrorHandler(`Addresses not found with id: ${req.params.id}`)
            );
        }
        res.status(200).json({
            success: true,
            addresses,
        });
    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Error while fetching user addresses'));
    }
};

const updateAddresses = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return next(new ErrorHandler("Invalid ID", 404));

    try {
        const loggedInUserId = req.user.id;

        const addresses = await AddressesModel.findOne({ _id: id });

        if (!addresses)
            return next(new ErrorHandler("Motorcycle not found", 404));

        if (addresses.user.toString() !== loggedInUserId) {
            return next(new ErrorHandler("Unauthorized Access", 403));
        }

        const updateAddresses = await AddressesModel.findByIdAndUpdate(id, req.body, { new: true });

        return res.json({ success: true, addresses: updateAddresses });
    } catch (err) {
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};

const updateDefaultAddress = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return next(new ErrorHandler("Invalid ID", 404));

    try {

        const userId = req.user.id;

        await AddressesModel.updateMany({ user: userId }, { isDefault: false });

        const updatedDefaultAddress = await AddressesModel.findByIdAndUpdate(
            id,
            { ...req.body, isDefault: true },
            { new: true }
        );

        return res.json({ success: true, updatedDefaultAddress });
    } catch (err) {
        return next(new ErrorHandler("Internal Server Error", 500));
    }
}

const deleteAddresses = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        return next(new ErrorHandler("Invalid ID", 404));

    try {

        const loggedInUserId = req.user.id;

        const addresses = await AddressesModel.findById(id);

        if (!addresses)
            return next(new ErrorHandler("Addresses not found", 404));

        if (addresses.user.toString() !== loggedInUserId) {
            return next(new ErrorHandler("Unauthorized Access", 403));
        }

        await addresses.deleteOne();

        return res.json({ success: true });
    } catch (err) {
        return next(new ErrorHandler("Internal Server Error", 500));
    }
};


module.exports = {
    createNewAddresses,
    getMyAddress,
    getAddressesDetails,
    updateAddresses,
    updateDefaultAddress,
    deleteAddresses,
}