const crypto = require("crypto");

const parseRemarks = (existingRemarks) => {
  if (typeof existingRemarks === "string") {
    try { return JSON.parse(existingRemarks); }
    catch { return []; }
  }
  return Array.isArray(existingRemarks) ? existingRemarks : [];
};

const createRemark = ({ text, user_id, user_name, created_at = new Date() }) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(`Invalid remark text: ${JSON.stringify(text)}`);
  }
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    added_by: user_id,
    added_by_name: user_name,
    created_at: new Date(created_at).toISOString(),
    updated_at: null,
  };
};

const appendRemark = ({ existingRemarks, text, user_id, user_name }) => {
  const remarks = [...parseRemarks(existingRemarks)];

  const extractText = (item) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object" && typeof item.text === "string")
      return item.text.trim();
    return null;
  };

  if (Array.isArray(text)) {
    text.forEach((item) => {
      const str = extractText(item);
      if (str) remarks.push(createRemark({ text: str, user_id, user_name }));
      else if (item !== "" && item !== null && item !== undefined) {
        throw new Error(`Invalid remark item: ${JSON.stringify(item)}`);
      }
    });
  } else {
    const str = extractText(text);
    if (str) remarks.push(createRemark({ text: str, user_id, user_name }));
  }

  return remarks;
};

const updateRemark = ({ existingRemarks = [], remarkId, newText, user_id }) => {
  if (typeof newText !== "string" || !newText.trim()) {
    throw new Error(`Invalid remark text: ${JSON.stringify(newText)}`);
  }

  const remarks = parseRemarks(existingRemarks);

  return remarks.map((item) => {
    if (item.id === remarkId) {
      if (user_id && item.added_by !== user_id) {
        throw new Error("Unauthorized to edit this remark");
      }
      return {
        ...item,
        text: newText.trim(),
        updated_at: new Date().toISOString(),
      };
    }
    return item;
  });
};

const sortRemarksNewest = (remarks = []) =>
  [...parseRemarks(remarks)].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

const sortRemarksOldest = (remarks = []) =>
  [...parseRemarks(remarks)].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

module.exports = {
  createRemark,
  appendRemark,
  updateRemark,
  sortRemarksNewest,
  sortRemarksOldest,
};