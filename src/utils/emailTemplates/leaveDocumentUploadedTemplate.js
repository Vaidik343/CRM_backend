const leaveDocumentUploadedTemplate = ({ employee, leave, leaveDays }) => {
  const daysSinceSubmission = Math.floor(
    (new Date() - new Date(leave.created_at || leave.createdAt)) /
      (1000 * 60 * 60 * 24)
  );

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const durationLabel = {
    full_day:     "Full Day",
    first_half:   "First Half",
    second_half:  "Second Half",
  }[leave.duration] || leave.duration;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #132ea7; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase; }
    .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
    .badge { display: inline-block; background: #e98937; color: #fff; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-top: 10px; }
    .body { padding: 28px 32px; }
    .alert-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .alert-box p { margin: 0; color: #c2410c; font-size: 13px; font-weight: 700; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
    .info-item { background: #f8fafc; border-radius: 8px; padding: 12px 14px; }
    .info-item .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
    .info-item .value { font-size: 14px; font-weight: 700; color: #1e293b; }
    .attachment-note { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-top: 16px; }
    .attachment-note p { margin: 0; color: #15803d; font-size: 13px; font-weight: 600; }
    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; }
    .footer p { margin: 0; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Emergency Document Uploaded</h1>
      <p>An employee has uploaded their supporting document</p>
      <span class="badge">${leave.display_id}</span>
    </div>

    <div class="body">
      <div class="alert-box">
        <p>⚠️ This document was uploaded ${daysSinceSubmission} day(s) after the leave was submitted. Please review and attach it to the original leave record.</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Employee</div>
          <div class="value">${employee.name}</div>
        </div>
        <div class="info-item">
          <div class="label">Employee ID</div>
          <div class="value">${employee.employee_id}</div>
        </div>
        <div class="info-item">
          <div class="label">Leave ID</div>
          <div class="value">${leave.display_id}</div>
        </div>
        <div class="info-item">
          <div class="label">Leave Status</div>
          <div class="value" style="text-transform: capitalize;">${leave.status}</div>
        </div>
        <div class="info-item">
          <div class="label">From</div>
          <div class="value">${formatDate(leave.start_date)}</div>
        </div>
        <div class="info-item">
          <div class="label">To</div>
          <div class="value">${formatDate(leave.end_date)}</div>
        </div>
        <div class="info-item">
          <div class="label">Duration</div>
          <div class="value">${durationLabel} — ${leaveDays} day(s)</div>
        </div>
        <div class="info-item">
          <div class="label">Leave Submitted</div>
          <div class="value">${formatDate(leave.created_at || leave.createdAt)}</div>
        </div>
      </div>

      <div class="attachment-note">
        <p>📎 The medical document is attached to this email. Please file it against leave <strong>${leave.display_id}</strong>.</p>
      </div>
    </div>

    <div class="footer">
      <p>EWM — Employee Work Management &nbsp;|&nbsp; This is an automated email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

module.exports = leaveDocumentUploadedTemplate;