# Genesis  Software Engineering School Test Task

## Problem
Create web api with such features: create and authenticate users, return current Bitcoin rate in UAH for authenticated users.\
API cannot use any database system, all user information must be stored in file system.

## Solution
API contain 3 routes (api/user/create, api/user/login, api/btcRate).
User information is stored in separate json file `db.json`. Users are authenticated with jwt tokens.
To get BTC rate in UAH I multiply BTC rate in USD (btc_in_usd) to USD rate in UAH (usd_in_uah).
btc_in_usd and usd_in_uah rates are stored in server ram and renewing every 60 seconds from external sources (bitstamp and xe).

## Install
```bash
git clone https://github.com/zagorboda/nodejs-btcRate
cd nodejs-btcRate
npm install
```

## Run
```bash
npm run app
```

## Project structure
`server.js`

Main file, connect all routes and store middlewares.

`user.js`

Contains user related logic.

`btc.js`

Contains logic to get btc_in_usd and usd_in_uah rates from external sources, calculate and return btc_in_uah value.

`config.js`

Contains secret key (used to decode jwt tokens) and list of status codes.

`db.json`

This file stores user information.
Users are stored in 'users' list .
User object has 2 attributes: email and hashed_password.
Passwords are hashed and verified using `bcrypt` library.


## Used packages
`nodemon`

Used to monitor code changes and restart server.

`express`

Used to simplify json parsing, request processing, routes and so on.

`bcrypt`

Used to hash and check passwords.

`njwt`

Used to create and verify jwt tokens.

`request`

Used to send requests to external sources.

`jsdom`

Used to parse html.

## Routes

`api/user/create`

Create new user.


* **Method:**

  `POST`


* **Data Params:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

* **Success Response:**

    * **Code:** 201 Created \
      **Content:** `{"message": "User created"}`


* **Error Response:**
    * **Code:** 400 Bad Request \
      **Content:** `{ error : "Invalid JSON. Missing request body." }`

  OR

    * **Code:** 400 Bad Request \
      **Content:** `{ error : "Invalid JSON. Missing {missed_keys} key."}`

  OR

    * **Code:** 409 Conflict \
      **Content:** `{error: 'Email is invalid or already taken'}`


* **Sample Call:**

    ```bash
    curl --request POST 'http://127.0.0.1:8000/api/user/create' --header 'Content-Type: application/json' --data-raw '{ "email": "user@example.com", "password": "password"}'
    ```


`api/user/login`

Authenticate user.


* **Method:**

  `POST`


* **Data Params:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

* **Success Response:**

    * **Code:** 201 Created \
      **Content:** `{"token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzNCIsImp0aSI6IjRkYjgwNjg5LTY3ZWYtNDk3YS1hYzRiLWZkYzU0YWNhZjJmOCIsImlhdCI6MTYyNDkwMjI1NSwiZXhwIjoxNjI0OTA1ODU1fQ.cafcPSCPBP5zREZNWbCwVPcOoOxa-HM3XoKlyT5RylA""}`


* **Error Response:**
    * **Code:** 400 Bad Request \
      **Content:** `{ error : "Invalid JSON. Missing request body." }`

  OR

    * **Code:** 400 Bad Request \
      **Content:** `{ error : "Invalid JSON. Missing {missed_keys} key."}`

  OR

    * **Code:** 409 Conflict \
      **Content:** `{error: 'Email or password incorrect.'}`

* **Sample Call:**

    ```bash
    curl --request POST 'http://127.0.0.1:8000/api/user/login' --header 'Content-Type: application/json' --data-raw '{ "email": "user@example.com", "password": "password"}'
    ```


`api/btcRate`

Return BTC to UAH rate.


* **Method:**

  `GET`


* **Data Params:**

  None


* **Headers:**

  Authentication: Bearer <jwt_token>


* **Success Response:**

    * **Code:** 201 Created \
      **Content:** `{"btcRateUAH": "935813.09"}`


* **Error Response:**
    * **Code:** 401 Unauthorized \
      **Content:** `{error: 'Missing authorization header.'}`

  OR

    * **Code:** 401 Unauthorized \
      **Content:** `{error: 'Invalid JWT token.'}`


* **Sample Call:**

    ```bash
    curl http://127.0.0.1:8000/api/btcRate -H 'Authorization: Bearer <jwt_token>'
    ```

## Currency rates
BTC and USD rates should be stored somewhere where we can get them quickly.
File system is not a solution because file reading is blocking and really slow, so
I decided to store values directly on ram (using 2 variables).
On server startup 2 functions, that set rates values, are executed, then functions are
executed periodically (in my code time intervals are 60 seconds, this value could be changed due to our requirements).
Another possible solution is to store such values is cache systems.

To get Bitcoin rate in USD I use [Bitstamp](https://www.bitstamp.net/), [api](https://www.bitstamp.net/api/ticker/btcusd/), [api docs](https://www.bitstamp.net/api/). \
To get USD to UAH rate I use [xe.com](xe.com) (this website displayed in [DuckDuckGo widget](https://duckduckgo.com/?q=usd+to+eur&t=ffab&ia=currency) when you search info about currency rates).
xe.com doesn't have free open api, so I send GET request to UAH to UAD [page](https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=UAH),
then parse html response and search value in it.

To get currency rates we can also use some banks api. For example, Ukrainian Government Bank [API](https://bank.gov.ua/ua/open-data/api-dev)
or Privat Bank [API](https://api.privatbank.ua/#p24/exchange). Lot of banks validate currency rates one time per 24 hours.

If we need to monitor every change in currency rates we can find and open web socket connection with some trusted source and get
new values on every change.