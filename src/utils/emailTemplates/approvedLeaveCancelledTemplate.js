const { formatDate } = require("../date");

module.exports = function approvedLeaveCancelledEmailTemplate ({
    employee,
  leave,
  leaveDays,
}) {



return `
   <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background:#132ea7;padding:32px 40px;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">
                    Leave Cancelled
                  </h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">
                    Your approved leave has been cancelled and balance restored
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px 40px;">
                  <p style="margin:0 0 24px;color:#334155;font-size:15px;">
                    Hi <strong>${employee.name}</strong>,
                  </p>
                  <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
                    Your approved leave request <strong>${leave.display_id}</strong> has been cancelled. 
                    Your leave balance has been restored accordingly.
                  </p>

                  <!-- Leave Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                    <tr style="background:#e2e8f0;">
                      <td style="padding:12px 20px;font-size:11px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px;">
                        Leave Details
                      </td>
                    </tr>
                    ${[
                      ['Display ID',  leave.display_id],
                      ['Leave Type',  leave.leave_type === 'exchange' ? 'Exchange' : 'Casual'],
                      ['Duration',    leave.duration === 'full_day' ? 'Full Day' : leave.duration === 'first_half' ? 'First Half' : 'Second Half'],
                      ['From',        new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                      ['To',          new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                      ['Days',        `${leaveDays} day(s)`],
                    ].map(([label, value]) => `
                      <tr style="border-top:1px solid #e2e8f0;">
                        <td style="padding:12px 20px;font-size:13px;font-weight:700;color:#64748b;width:40%;">${label}</td>
                        <td style="padding:12px 20px;font-size:13px;font-weight:800;color:#1e293b;">${value}</td>
                      </tr>
                    `).join('')}
                  </table>

                  <!-- Balance Restored Banner -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#dcfce7;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:13px;font-weight:900;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">
                          ✓ Balance Restored
                        </p>
                        <p style="margin:4px 0 0;font-size:13px;color:#166534;">
                          ${leaveDays} day(s) have been credited back to your leave balance.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                    If you have any questions, please contact HR.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                    This is an automated email from EWM — Employee Work Management
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  }