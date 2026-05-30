/**
 * utils/remarksLog.js
 */

const createRemark = ({
  text,
  user_id,
  user_name,
  created_at = new Date(),
}) => {
  return {
    text: String(text).trim(),
    added_by: user_id,
    added_by_name: user_name,
    created_at: created_at.toISOString(),
  };
};

const appendRemark = ({
  existingRemarks = [],
  text,
  user_id,
  user_name,
}) => {
  // Parse if it came back as a string from DB
  let parsed = existingRemarks;
  if (typeof existingRemarks === "string") {
    try {
      parsed = JSON.parse(existingRemarks);
    } catch {
      parsed = [];
    }
  }

  const remarks = Array.isArray(parsed) ? [...parsed] : [];

  remarks.push(createRemark({ text, user_id, user_name }));

  return remarks;
};

const sortRemarksNewest = (remarks = []) => {
  return [...remarks].sort(
    (a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
  );
};

const sortRemarksOldest = (remarks = []) => {
  return [...remarks].sort(
    (a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
  );
};


module.exports = {
  createRemark,
  appendRemark,
  sortRemarksNewest,
  sortRemarksOldest,
};