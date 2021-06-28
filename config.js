// openssl rand -hex 64
// secret key used to decode jwt tokens
const secretKey = '596a842854194d1a045dfb94c4c61bb3ea756718d71a11b3f740e68d87b76114c31c1a1abb44363f32671643c7f4acb615848f6d1b324792101a540ae29518b2';

// list of status codes
// instead of using `200` i am using `status.ok200`, so i can see not only code value but also name
const statusCodes = {
    ok200: 200,
    created201: 201,
    badRequest400: 400,
    unauthorized401: 401,
    conflict409: 409,
    internalServerError500: 500,
}


module.exports = {
    secretKey: secretKey,
    status: statusCodes
};
