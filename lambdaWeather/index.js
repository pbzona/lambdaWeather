'use strict';
const AWS = require('aws-sdk');
const SNS = new AWS.SNS();

// In addition to the AWS SDK, we'll use axios to help make our requests
const axios = require('axios');

// Make sure to define these environment variables in the Lambda dashboard
const API_KEY = process.env.API_KEY;
const COORDS = process.env.COORDS;
const TOPIC = process.env.TOPIC;

exports.handler = (event, context, callback) => {
  // Construct the URL to make weather forecast requests
  const weatherURL = `https://api.darksky.net/forecast/${API_KEY}/${COORDS}?exclude=currently,minutely,hourly,flags`;

  // Make the request using axios, a promise-based HTTP library
  axios.get(weatherURL).then((response) => {
    // Once the response is received, pull the different parameters we'll need and save them as variables
    const tomorrow = response.data.daily.data[1];
    const high = Math.round(tomorrow.temperatureHigh);
    const low = Math.round(tomorrow.temperatureLow);
    const precip = Math.round(tomorrow.precipProbability * 100);
    const summary = tomorrow.summary;

    // Construct a format for the message - since we're using SNS, the maximum length will be 140 chars
    const message = `Tomorrow's weather: \nHi: ${high}\xB0\nLo: ${low}\xB0\nRain: ${precip}%\n\n${summary}`;

    // Create an object to define how we'll invoke our call to SNS
    const params = {
      Message: message,
      TopicArn: TOPIC
    }

    // Call the `publish` method to push the message to our SNS topic
    SNS.publish(params, (err, data) => {
      if (err) {
        console.log(err.stack);
        callback(err);
      }
      callback(null, data);
    })
  }).catch((e) => {
    // Some basic error handling
    if (e.code === 'ENOTFOUND') {
      callback('Unable to connect to API servers');
    }
    else {
      callback(e.message);
    }
  });
};
