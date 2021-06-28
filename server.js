const express = require('express');
const status = require('./config').status;

const userRoute = require('./user');
const btcRoute = require('./btc');

const app = express();

app.use(express.json());

app.use('/api', btcRoute);
app.use('/api/user', userRoute);

// catch SyntaxError in JSON parse
app.use(function (error, req, res, next) {
    if (error instanceof SyntaxError) {
        res.status(status.badRequest400);
        res.send('Invalid JSON syntax');
    } else {
        next();
    }
});


app.listen(8000, () => {console.log('Server started: 8000')});
