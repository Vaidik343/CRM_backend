const nodemailer = require("nodemailer");
const leaveRequestTemplate = require("./emailTemplates/leaveRequestTemplate");
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
const sendLeaveRequestEmail = async ({   employeeName,
  employeeId,
  leaveType,
  reasonType,
  duration,
  startDate,
  endDate,
  reason,}) => {
 const html = leaveRequestTemplate({
  employeeName: employee.name,
  employeeId: employee.employee_id,
  leaveType: leave.leave_type,
  reasonType: leave.reason_type,
  duration: leave.duration,
  startDate: leave.start_date,
  endDate: leave.end_date,
  reason: leave.reason,
});
//   console.log("🚀 ~ sendLeaveRequestEmail ~ html:", html)
//   console.log("Employee:", employee.toJSON ? employee.toJSON() : employee);
// console.log("Leave:", leave.toJSON ? leave.toJSON() : leave);


  const admins = await User.findAll({
  where: {
    is_admin: true,
    is_active: true,
  },
  attributes: ["email"],
});

const adminEmails = admins
  .map(a => a.email)
  .filter(Boolean);

  const totalDays = calculateLeaveDays(
  leave.start_date,
  leave.end_date,
  leave.duration
);

const subject = `Leave Request from ${employee.name} for ${totalDays} ${
  totalDays === 1 ? "Day" : "Days"
}`;

await sendMail({
  to: adminEmails,
  cc: process.env.OWNER_EMAIL,
  subject,
  html,
});


};


module.exports = {
  
  sendLeaveRequestEmail,
};