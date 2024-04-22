const multer = require("multer");
const path = require("path");
const ErrorHandler = require("./errorHandler");

module.exports = multer({
    limits: { fieldSize: 10 * 1024 * 1024 },
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname).toLowerCase();

        if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
            cb(new ErrorHandler("Unsupported file type!"), false);
            return;
        }
        cb(null, true);
    },
});
