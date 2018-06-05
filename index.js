const aws = require("aws-sdk");
const ses = new aws.SES({ region: "us-east-1", apiVersion: "2010-12-01" });

exports.handler = function(event, context, callback) {
  console.log(event);
  if (event.body !== null && event.body !== undefined) {
    let data = JSON.parse(event.body);
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

    ses
      .sendEmail(params)
      .promise()
      .then(
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({ message: "Done" }),
          isBase64Encoded: false
        })
      )
      .catch(err => console.error(err, err.stack));
  } else {
    console.error("No JSON body in email");
  }
};
