const express = require('express');
const bcrypt = require('bcrypt');
const nJwt = require('njwt');
const fsPromises = require('fs').promises;
const path = require('path');

const config = require('./config');
const secretKey = config.secretKey;
const status = config.status;

const router = express.Router();


function generateToken(user){
    // Generate JWT token from user data
    const claims = {sub: user};
    return nJwt.create(claims, secretKey).compact();
}

function checkBodyParameters(body, params){
    // Check if request has body and all listed params (json keys)
    let statusCode = status.ok200;
    let message = '';

    if (!body) {
        // check if body exists
        return [status.badRequest400, 'Invalid JSON. Missing request body.']
    }
    for (const param of params) {
        if(!body.hasOwnProperty(param)){
            // if some param are missing in body, than add it to error message
            message = message || 'Invalid JSON.';
            statusCode = status.badRequest400;
            message += `Missing ${param} key.`;
        }
    }

    return [statusCode, message]
}


router.post('/login', async(req, res) => {
    // check request body
    const[statusCode, message] = checkBodyParameters(req.body, ['email', 'password'])
    if(statusCode !== status.ok200){
        res.status(statusCode);
        return res.send({error: message});
    }

    let data;
    try {
        data = await fsPromises.readFile(path.join(__dirname, "db.json")); // read user data from json file
    } catch {
        res.status(status.internalServerError500);
        return res.send('Server error while processing data.');
    }
    const db_data = JSON.parse(data.toString()); // parse data into object

    // check if user exists
    let current_user = null;
    for (const user of db_data.users) {
        if (user.email === req.body.email){
            current_user = user;
            break
        }
    }

    let password_in_db;
    if (!current_user){
        // if user not in file - generate random string with length of hash, this is implemented to prevent timing attacks
        // if receiving valid username - request processed in ~115 milliseconds, but if username not found and
        // server send 400http response immediately it takes ~10 milliseconds.
        password_in_db = '$2b$10$' + [...Array(53)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
    } else {
        // if user in file - get hashed password from it
        password_in_db = current_user.hashedPassword;
    }

    if (await bcrypt.compare(req.body.password, password_in_db)){
        res.status(status.ok200);
        res.send({token: generateToken(req.body.email)});
    } else {
        res.status(status.unauthorized401);
        return res.send({error: 'Email or password incorrect.'});
    }

});


router.post('/create', async (req, res) => {
    // check request body
    const[status_code, message] = checkBodyParameters(req.body, ['email', 'password'])
    if(status_code !== status.ok200){
        res.status(status_code);
        return res.send(message);
    }

    let data;
    try {
        data = await fsPromises.readFile(path.join(__dirname, "db.json")); // read data from json file
    } catch {
        res.status(status.internalServerError500);
        return res.send('Server error while processing data.');
    }
    const db_data = JSON.parse(data.toString()); // parse data into object

    // check if email is valid
    // const email_regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    // if (!email_regex.test(req.body.email)){
    //     res.status(badRequest400);
    //     return res.send('Email is not valid.');
    // }

    // check if password is valid
    // if (req.body.password.length < 8 || req.body.password.length > 255){
    //         res.status(badRequest400);
    //         return res.send('Password is not valid. Password must contain from 8 up to 255 characters.');
    // }

    // check if user with this email already exists
    if (db_data.users.some(userInDb => req.body.email === userInDb.email)){
        res.status(status.conflict409);
        return res.send({error: 'Email is invalid or already taken'});
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10); // hash password
    const new_user = {email: req.body.email, hashedPassword: hashedPassword}; // create new user object

    db_data.users.push(new_user); // add new user to user list

    try {
        // write updated data to file
        await fsPromises.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(db_data));
    } catch {
        res.status(status.internalServerError500);
        return res.send('Server error while processing data.');
    }

    res.status(status.created201);
    return res.send( {message:  'User created'});

});


module.exports = router;
