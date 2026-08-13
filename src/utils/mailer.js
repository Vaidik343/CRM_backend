const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async ({ to, cc = [], subject, html, text = "", attachments = [] }) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    cc,
    subject,
    text,
    html,
    attachments,  
  });
};
console.log("🚀 ~ sendMail ~ sendMail:", sendMail)

module.exports = {
  transporter,
  sendMail,
};

