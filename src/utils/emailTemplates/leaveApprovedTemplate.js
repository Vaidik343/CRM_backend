const leaveApprovedTemplate = ({
  employee,
  leave,
  approvedBy,
  leaveDays,
}) => {
  const isEmergency = leave.reason_type?.toLowerCase() === "emergency";

  // Dynamic inline text style for reason_type if emergency
  const reasonTypeStyle = isEmergency
    ? "color: #dc2626; font-weight: 600;"
    : "color: #111827;";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Top Success Accent Bar -->
      <div style="height: 4px; background-color: #16a34a; border-radius: 4px 4px 0 0; margin: -24px -24px 20px -24px;"></div>

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0; color: #16a34a; font-size: 20px; font-weight: 600;">Leave Request Approved</h2>
      </div>

      <p style="color: #374151; font-size: 14px; margin-top: 0; margin-bottom: 20px; line-height: 1.5;">
        Hello <b>${employee.name}</b>,<br>
        Your leave request has been <b style="color: #16a34a;">approved</b>.
      </p>

      <!-- Main Info Table -->
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500; width: 35%;">Employee</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 600;">${employee.name}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Employee ID</td>
            <td style="padding: 10px 0; color: #111827;">${employee.employee_id}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Leave ID</td>
            <td style="padding: 10px 0; color: #111827; font-family: monospace;">${leave.display_id}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Leave Type</td>
            <td style="padding: 10px 0; color: #111827;">${leave.leave_type}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Reason Type</td>
            <td style="padding: 10px 0; ${reasonTypeStyle}">${leave.reason_type}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Duration</td>
            <td style="padding: 10px 0; color: #111827;">${leave.duration}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Total Leave</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 600;">${leaveDays} ${leaveDays === 1 ? "Day" : "Days"}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">From</td>
            <td style="padding: 10px 0; color: #111827;">${new Date(leave.start_date).toLocaleDateString("en-IN")}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">To</td>
            <td style="padding: 10px 0; color: #111827;">${new Date(leave.end_date).toLocaleDateString("en-IN")}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500; vertical-align: top;">Reason</td>
            <td style="padding: 10px 0; color: #374151; line-height: 1.5;">${leave.reason}</td>
          </tr>

          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Approved By</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 600;">${approvedBy.name}</td>
          </tr>

          <tr>
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Approved On</td>
            <td style="padding: 10px 0; color: #111827;">${new Date(leave.approved_at).toLocaleDateString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <!-- Footer Signoff -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; line-height: 1.5;">
        <p style="margin: 0 0 12px 0;">We wish you a pleasant leave.</p>
        <p style="margin: 0;">
          Regards,<br>
          <strong style="color: #374151;">Bluebell Compuserve Pvt Ltd</strong>
        </p>
      </div>

    </div>
  `;
};

module.exports = leaveApprovedTemplate;