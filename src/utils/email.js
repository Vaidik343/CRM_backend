const nodemailer = require("nodemailer");
const leaveRequestTemplate = require("./emailTemplates/leaveRequestTemplate");
const leaveApprovedTemplate = require("./emailTemplates/leaveApprovedTemplate");
const leaveRejectedTemplate = require("./emailTemplates/leaveRejectedTemplate");
const  leaveCancelledTemplate  = require("./emailTemplates/leaveCancelledTemplate");
const { User } = require("../models");

const { sendMail } = require("./mailer");


console.log(leaveRequestTemplate);
console.log(typeof leaveRequestTemplate);
console.log(require.resolve("./emailTemplates/leaveRequestTemplate"));

const calculateLeaveDays = (startDate, endDate, duration) => {
  if (duration === "first_half" || duration === "second_half") {
    return 0.5;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Difference in days (inclusive)
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Send leave request notification email
 */
const sendLeaveRequestEmail = async ({ employee, leave }) => {
  const html = leaveRequestTemplate({
    employee,
    leave,
  });
  // console.log("🚀 ~ sendLeaveRequestEmail ~ html:", html)

  const admins = await User.findAll({
    where: {
      is_admin: true,
      is_active: true,
    },
    attributes: ["email"],
  });
  // console.log("🚀 ~ sendLeaveRequestEmail ~ admins:", admins)

  const adminEmails = admins
    .map((a) => a.email)
    .filter(Boolean);

  const totalDays = calculateLeaveDays(
    leave.start_date,
    leave.end_date,
    leave.duration
  );

  const subject = `Leave Request from ${employee.name} for ${totalDays} Days - ${leave.reason_type}`;

 const slr = await sendMail({
    to: adminEmails,
    cc: process.env.OWNER_EMAIL,
    subject,
    html,
  });
//  console.log("🚀 ~ sendLeaveRequestEmail ~ slr:", slr)
};


// approve leave

const sendLeaveApprovedEmail = async ({
  employee,
  leave,
  approvedBy,
  leaveDays,
}) => {
  const html = leaveApprovedTemplate({
    employee,
    leave,
    approvedBy,
    leaveDays,
  });
  console.log("🚀 ~ sendLeaveApprovedEmail ~ html:", html)

  const subject = `Leave Approved for ${employee.name} - ${leaveDays} ${
    leaveDays === 1 ? "Day" : "Days"
  }`;

const info = await sendMail({
  to: employee.email,
    cc: process.env.OWNER_EMAIL,
  subject,
  html,
});

console.log("SMTP Response:", info);

return info;
};


const sendLeaveRejectedEmail = async ({
  employee,
  leave,
  rejectedBy,
  rejectionReason,
  leaveDays,
}) => {

  const html = leaveRejectedTemplate({
    employee,
    leave,
    rejectedBy,
    rejectionReason,
    leaveDays,
  });
  console.log("🚀 ~ sendLeaveRejectedEmail ~ html:", html)

  const subject = `Leave Rejected - ${leave.reason_type} Leave (${leaveDays} ${
    leaveDays === 1 ? "Day" : "Days"
  })`;
  console.log("🚀 ~ sendLeaveRejectedEmail ~ subject:", subject)

  return await sendMail({
    to: employee.email,
    cc: process.env.OWNER_EMAIL,
    subject,
    html,
  });
};


const sendLeaveCancelledEmail = async ({
    employee,
    leave,
    leaveDays,
}) => {

    const html = leaveCancelledTemplate({
        employee,
        leave,
        leaveDays,
    });
    // console.log("🚀 ~ sendLeaveCancelledEmail ~ html:", html)

    const admins = await User.findAll({
        where: {
            is_admin: true,
            is_active: true,
        },
        attributes: ["email"],
    });
    // console.log("🚀 ~ sendLeaveCancelledEmail ~ admins:", admins)

    const adminEmails = admins
        .map(a => a.email)
        .filter(Boolean);

    const subject =
        `Leave Cancelled by ${employee.name} - ${leave.reason_type} Leave (${leaveDays} ${leaveDays === 1 ? "Day" : "Days"})`;

    return await sendMail({
        to: adminEmails,
        cc: process.env.OWNER_EMAIL,
        subject,
        html,
    });
};
module.exports = {
  
  sendLeaveRequestEmail,
  sendLeaveApprovedEmail,
  sendLeaveRejectedEmail,
  sendLeaveCancelledEmail
};