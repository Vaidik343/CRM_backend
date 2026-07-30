const leaveRequestTemplate = ({ employee, leave }) => {
  return `
    <h2>Leave Request</h2>

    <table border="1" cellpadding="8">
      <tr>
        <td><b>Employee</b></td>
        <td>${employee.name}</td>
      </tr>

      <tr>
        <td><b>Employee ID</b></td>
        <td>${employee.employee_id}</td>
      </tr>

      <tr>
        <td><b>Leave Type</b></td>
        <td>${leave.leave_type}</td>
      </tr>

      <tr>
        <td><b>Reason Type</b></td>
        <td>${leave.reason_type}</td>
      </tr>

      <tr>
        <td><b>Duration</b></td>
        <td>${leave.duration}</td>
      </tr>

      <tr>
        <td><b>From</b></td>
        <td>${new Date(leave.start_date).toLocaleDateString("en-IN")}</td>
      </tr>

      <tr>
        <td><b>To</b></td>
        <td>${new Date(leave.end_date).toLocaleDateString("en-IN")}</td>
      </tr>

      <tr>
        <td><b>Reason</b></td>
        <td>${leave.reason}</td>
      </tr>
    </table>

    <br>

    <p>Please login to CRM and review this request.</p>
  `;
};
module.exports = leaveRequestTemplate;