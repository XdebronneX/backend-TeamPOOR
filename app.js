const express = require('express');
const cookieParser = require('cookie-parser') // to get the user profile
var cors = require('cors')
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
const allowedOrigins = ['https://www.teampoor-motorcycle-parts-and-services.online'];
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
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