const express = require('express');
const nJwt = require('njwt');
const request = require('request');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const config = require('./config');
const secretKey = config.secretKey;
const status = config.status;

const router = express.Router();

// time intervals to renew rate values
const btcRateUSDRenewTimeout = 60 * 1000;
const usdRateUAHRenewTimeout = 60 * 1000;

// store BTC and UAH rate in server memory
let btcRateUSD;
let usdRateUAH;


// renew BTR rate (send request to bitstamp api)
function btcRateUSDRenew() {
    request({
        url: 'https://www.bitstamp.net/api/ticker/btcusd/',
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    },function(error, response, body){
        if(!error && response.statusCode === 200){
            // get current bitcoin price in USD
            btcRateUSD = +JSON.parse(response.body.toString()).last;
            console.log(`BTC rate: ${btcRateUSD} USD`);
        }else{
            const dateTime = Date().toString().replace(/T/, ':').replace(/\.\w*/, '');
            console.log(`Error parsing BTC rate, time: ${dateTime}, status code: ${response.statusCode}, error: ${error}`);
        }
    });
}
// get BTC rate on server startup
btcRateUSDRenew();
// and renew it periodically
setInterval(function(){
    btcRateUSDRenew();
}, btcRateUSDRenewTimeout);


// renew UAH rate (send request to xe.com and parse html response)
function usdRateUAHRenew() {
    request({
        url: 'https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=UAH',
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    },function(error, response, body){
        if(!error && response.statusCode === 200){
            const dom = new JSDOM(`${response.body}`);
            // get value from html
            const temp = dom.window.document.getElementsByClassName('result__BigRate-sc-1bsijpp-1 iGrAod')[0].textContent.split(' ')[0];
            // convert it to float with 2 points precision
            usdRateUAH = parseFloat(temp).toFixed(2);
            console.log(`UAH rate: ${usdRateUAH} USD`);
        }else{
            const dateTime = Date().toString().replace(/T/, ':').replace(/\.\w*/, '');
            console.log(`Error parsing BTC rate, time: ${dateTime}, status code: ${response.statusCode}, error: ${error}`);
        }
    });
}
// get UAH rate on server startup
usdRateUAHRenew();
// and renew it periodically
setInterval(function(){
    usdRateUAHRenew();
}, usdRateUAHRenewTimeout);


router.get('/btcRate', async (req, res) => {
    let token = req.header('authorization');
    // get token from header
    if (!token) {
        res.status(status.unauthorized401);
        return res.send({error: 'Missing authorization header.'});
    }

    token = token.split(' ')[1];
    // verify token
    try{
        nJwt.verify(token, secretKey);
    } catch(e){
        res.status(status.unauthorized401);
        return res.send({error: 'Invalid JWT token.'});
    }
    // calculate current bitcoin price in UAH
    const btcRateUAH = (usdRateUAH * btcRateUSD).toFixed(2);

    res.status(status.ok200);
    return res.send({btcRateUAH: btcRateUAH});
});


module.exports = router;
