# LambdaWeather

This is an AWS Lambda function that runs each night to send you the following day's weather forecast so you can plan your day accordingly.

## Prerequisites

To use this function, you'll need a Dark Sky API key. Dark Sky is the service that we'll be using to get weather data - you can create a free account that provides up to 1000 API calls per day [here](https://darksky.net/dev).

## Installation

1.  In your AWS account, open up a Cloud9 environment. Clone this repo within your `~/environment` directory and run `npm install` to install the dependencies.
2.  Go to the SNS dashboard and create a new topic - we'll call it `LambdaWeatherTopic`, for example.
3.  Click **Create subscription**, choose SMS as the protocol, and enter your phone number in E.164 format (i.e. `+11234567890`).
4.  If you'd like multiple people to subscribe to your weather alerts, repeat step 3 for each of them. *Be sure to get their permission before doing so!*
5.  Create an IAM role for your function - for simplicity, we'll call it `LambdaWeatherRole`. Add the `AWSLambdaBasicExecutionRole` policy to your role, and create another custom policy as follows:

    ```
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "VisualEditor0",
          "Effect": "Allow",
          "Action": "sns:Publish",
          "Resource": "*"
        }
      ]
    }
    ```

    Add this policy to your `LambdaWeatherRole` as well.

## Deployment

The `template.yaml` file allows us to deploy our function directly from Cloud9 into Lambda by defining its parameters and the things it needs to work. We'll need to do some configuration here before we can deploy our function.

1.  Copy your IAM role's ARN, return to Cloud9, and paste it as a string into the `Role` field within the `template.yaml` file.
2.  Paste your Dark Sky API key as a string into the `API_KEY` field.
3.  Paste your geographic coordinates into the `COORDS` field. If you're not sure what these are or how to get them, check out the next section.
4.  Paste your SNS topic's ARN as a string into the `TOPIC` field.
5.  Save the `template.yaml` file.

To deploy, expand the "Local Functions" tab within the "Lambda" menu on the right side of your Cloud9 environment (if you don't see it, click "AWS Resources" on the far right side). Find the "lambdaWeather" function in the list, right click its name, and select **Deploy**.

### Getting your Geographic Coordinates

The Dark Sky API requires geographical coordinates to function properly - so how do you determine these? The included `helper.js` script uses Google Maps to parse an arbitrarily formatted location into the latitude and longitude values you'll need. This means you can enter a city and state, a full street address, a ZIP code, or a variety of other types of address formats, and you'll get back a value that will work.

To get your coordinates, run the helper script with your location as an argument (example: `node helper.js 'Dallas, TX'`). Copy the output exactly as it appears, as a comma separated pair, and paste it into the `COORDS` environment variable.

**NOTE:** The Google API sometimes returns `TypeError: Cannot read property 'geometry' of undefined`. I've found that this can happen if you try to make too many requests in a short period of time - this can generally be resolved by waiting 30 seconds or so and trying again.

## Scheduling your Function

The LambdaWeather function will now be functional, but we've not yet set up a trigger to execute it. Since the point of this function is to automatically run each night to send us the following day's weather, we'll set it up on an automated schedule.

In the Lambda console, scroll down to the "Designer" panel and click **CloudWatch Events** under the list of triggers.

To configure your trigger, select "Create a new rule" under the *Rules* dropdown menu. Give your rule a name and a description, and select "Schedule expression".

In the *Schedule Expression* text field enter a cron expression simliar to this: `cron(15 2 * * ? *)`.

This part can be tricky - the cron expression is based on UTC time, and there's no way to change the timezone at the moment. To customize this for your own timezone, you'll need to do some basic math.

Take the above expression, for example (`cron(15 2 * * ? *)`). Since I'm located in the Central time zone and it's daylight savings time (CDT = UTC-05:00), I need to schedule my Lambda function 5 hours ahead. The cron expression I defined causes the function to run at 2:15 AM UTC, which translates to 9:15PM CDT.

This will need to be adjusted based on your location, and you can find some additional resources below:

- [Cron notation](http://www.nncron.ru/help/EN/working/cron-format.htm)
- [UTC conversion helper](http://www.timebie.com/std/utc.php)

Once you've figured out your cron expression and entered it in, make sure the *Enable trigger* box is checked and click **Add**.

Finally, click **Save** at the top of the page to save your function. If everything has been properly configured, you'll now get a text message each night to alert you of the following day's weather patterns.

## Testing

To test your function, click the **Test** button at the top of the Lambda console. You'll need to define a test event before you can run the function - since we're using scheduling to trigger our function, not an external source that provides input, you can leave the default object in the text editor.

Once you've created your test event, click **Save** to exit the modal, and click **Test** at the top of the page. Execution details will be provided, and you'll see whether the function succeeded or failed.

If there are errors, you'll see them at the top of the page in a red box. But if everything went well, you'll get a text message with tomorrow's weather!

**NOTE:** The free tier of SNS limits you to 100 free text notifications per month. Assuming you only run this function once per day, with 1 subscriber to your topic, you'll be well within the free limits. However, if you have multiple subscribers (for example, you want to send weather alerts to family members as well), be aware of the pricing model and the charges you might incur. More information can be found on the [Simple Notification Service SMS Pricing Page](https://aws.amazon.com/sns/sms-pricing/).
