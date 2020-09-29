//set up dependencies
require('dotenv').config()
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const queue = require('./queue')

//setup port constants
// const port_redis = process.env.PORT || 6379;
const port = process.env.PORT || 5000;

function main() {
  //configure express server
  const app = express();

  //Body Parser middleware
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());


  return {app}
}

module.exports = main()