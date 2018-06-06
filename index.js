const aws = require("aws-sdk");
const axios = require("axios");
const qs = require("qs");
const ses = new aws.SES({ region: "us-east-1", apiVersion: "2010-12-01" });

const isCaptchaValidated = async captchaString => {
  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      qs.stringify({
        secret: process.env.CAPTCHA_SECRET,
        response: captchaString
      })
    );
    console.log("response from google", response);
    return response.data.success;
  } catch (e) {
    console.log("captcha function error", e);
    return false;
  }
};

exports.handler = async function(event, context, callback) {
  console.log("event", event);
  if (event.body !== null && event.body !== undefined) {
    let data = JSON.parse(event.body);
    if (
      data.from_name === "" ||
      data.from_email === "" ||
      data.message === "" ||
      data.recaptcha === ""
    ) {
      callback(null, {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          en: "Please make sure you have filled out all of the form fields.",
          fr: "Veuillez vérifier que vous avez bien rempli tous les champs."
        }),
        isBase64Encoded: false
      });
    }
    const params = {
      Destination: {
        ToAddresses: [process.env.TO_EMAIL]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<h1>New Message</h1><h3>From ${
              data.from_name
            } on ${new Date().toString()}</h3><p><strong>From ${
              data.from_email
            }</strong></p><p>${data.message}</p>`
          },
          Text: {
            Charset: "UTF-8",
            Data: `Message from ${data.from_name}\n\nFrom: ${
              data.from_email
            }\nMessage: ${data.message}`
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Message from website contact form"
        }
      },
      Source: process.env.TO_EMAIL,
      ReplyToAddresses: [data.from_email]
    };

    const isValid = await isCaptchaValidated(data.recaptcha);

    if (isValid) {
      ses
        .sendEmail(params)
        .promise()
        .then(
          callback(null, {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              en: "Thank you! I'll get in touch with you as soon as possible.",
              fr: "Merci ! Je vous répondrai au plus tôt."
            }),
            isBase64Encoded: false
          })
        )
        .catch(
          callback(null, {
            statusCode: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              en: "There was an error sending the email. Please try again.",
              fr:
                "Il y a une erreur pendant l'envoi du message. Veuillez réessayer ultérieurement."
            }),
            isBase64Encoded: false
          })
        );
    } else {
      callback(null, {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          en: "There was an issue with the reCaptcha. Please try again.",
          fr: "Il y a une erreur avec le reCaptcha. Veuillez réessayer."
        }),
        isBase64Encoded: false
      });
    }
  } else {
    callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        en: "Please make sure you have filled out all of the form fields.",
        fr: "Veuillez vérifier que vous avez bien rempli tous les champs."
      }),
      isBase64Encoded: false
    });
  }
};
