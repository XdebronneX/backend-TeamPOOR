const express = require('express');
const cookieParser = require('cookie-parser') // to get the user profile
const cors = require('cors')
const app = express();

const errorMiddleware = require('./middlewares/errors');
const users = require('./routes/user');
const motorcycles = require('./routes/motorcycle');
const brands = require('./routes/brand');
const categories = require('./routes/category');
const products = require('./routes/product');
const orders = require('./routes/order');
const fuels = require('./routes/fuel');
const addresses = require('./routes/addresses');
const services = require('./routes/service');
const appointments = require('./routes/appointment');

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: ["https://teampoor-motorcycles-parts-and-services.onrender.com"],
    credentials: true,
    exposedHeaders: ['Access-Control-Allow-Origin']
}));

app.use('/api/v1',users);
app.use('/api/v1', motorcycles);
app.use('/api/v1', brands);
app.use('/api/v1', categories);
app.use('/api/v1', products);
app.use('/api/v1', orders);
app.use('/api/v1', fuels);
app.use('/api/v1', addresses);
app.use('/api/v1', services);
app.use('/api/v1', appointments);
app.use(errorMiddleware);

module.exports = app