const SibApiV3Sdk = require("sib-api-v3-sdk");

let defaultClient = SibApiV3Sdk.ApiClient.instance;

let apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, html) => {
  const sendSmtpEmail = {
    sender: {
      email: "teslimagboola09@gmail.com",
      name: "ClinqHub",
    },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
  };

  return await tranEmailApi.sendTransacEmail(sendSmtpEmail);
};

module.exports = sendEmail;