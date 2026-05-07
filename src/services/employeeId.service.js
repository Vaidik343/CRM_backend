const { User } = require("../models");

function formatEmployeeId(n) {
  const padded = String(n).padStart(3, "0");
  return `EMP${padded}`;
}

async function generateNextEmployeeId() {
  // MVP approach: read max employee_id and increment.
  // For high concurrency, switch to a DB sequence/table.
  const last = await User.findOne({
    attributes: ["employee_id"],
    order: [["createdAt", "DESC"]],
  });

  if (!last?.employee_id) return formatEmployeeId(1);

  const match = String(last.employee_id).match(/^EMP(\d+)$/i);

const nextNum = match ? Number(match[1]) + 1 : 1;
  return formatEmployeeId(nextNum);
}

module.exports = { generateNextEmployeeId };

