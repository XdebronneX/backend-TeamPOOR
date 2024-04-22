const app = require('./app')
const teamPoor = require('./config/database')
const path = require('path')
require('dotenv').config({ path: './config/.env' });
const cloudinary = require("cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//connect to database
teamPoor();

//start the express server
app.listen(process.env.PORT, () => {
    console.log(`server started on port:' ${process.env.PORT} in ${process.env.NODE_ENV} mode `);
});