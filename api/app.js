var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var i18n = require("i18n");
var cors = require('cors');
var cron = require('node-cron');

var usersRouter = require('./routes/users');
var requestsRouter = require('./routes/requests');
var contractsRouter = require('./routes/contracts');
var provincesRouter = require('./routes/provinces');
var carTypesRouter = require('./routes/carTypes');
var languageRouter = require('./routes/language');
var cashFlowRouter = require('./routes/cashFlows');

const RequestDispatcher = require('./events/RequestDispatcher');

require('dotenv').config();

var app = express();

const corsOptions = {
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
};

process.env.TZ = 'Asia/Ho_Chi_Minh';

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsOptions));

i18n.configure({
    locales:['en', 'vi'],
    directory: path.join(__dirname, 'locales'),
    defaultLocale: 'vi',
    fallbacks: 'en',
});
app.use(i18n.init);

app.use('/api/users', usersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/language', languageRouter);
app.use('/api/provinces', provincesRouter);
app.use('/api/car-types', carTypesRouter);
app.use('/api/cash-flows', cashFlowRouter);

// Schedule tasks to be run on the server.
cron.schedule('0 0 * * *', function() {
    RequestDispatcher.filterRequestEvent();
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});

module.exports = app;
