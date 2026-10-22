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

  // errors are not swallowed here, so the calling controller can catch them
  const info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: to,
    subject: subject,
    html: html,
  });
  console.log(`email sent ${info.response}`);
  return info;
};

const sendWelcomeEmail = async ({ fullName, clientUrl, email }) => {
  const subject = "Welcome to Royal Shades Autos";
  const html = createWelcomeTemplates(fullName, clientUrl);
  return await sendMail({ to: email, subject, html });
};

const sendResetEmail = async ({ fullName, clientUrl, email }) => {
  const subject = "Password reset request";
  const html = createResetTemplate(fullName, clientUrl);
  return await sendMail({ to: email, subject, html });
};

module.exports = { sendWelcomeEmail, sendResetEmail}
