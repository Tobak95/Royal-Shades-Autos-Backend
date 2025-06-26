const nodemailer = require("nodemailer");
const {
  createWelcomeTemplates,
  createResetTemplate,
} = require("./emailTemplates");

//sending mail
const sendMail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`email sent ${info.response}`);
  } catch (error) {
    console.log(error);
  }
};

const sendWelcomeEmail = ({ fullName, clientUrl, email }) => {
  const subject = "Welcome to Royal Shades Autos";
  const html = createWelcomeTemplates(fullName, clientUrl);
  sendMail({ to: email, subject, html });
};

const sendResetEmail = ({ fullName, clientUrl, email }) => {
  const subject = "Password reset request";
  const html = createResetTemplate(fullName, clientUrl);
  sendMail({ to: email, subject, html });
};

module.exports = { sendWelcomeEmail, sendResetEmail}
