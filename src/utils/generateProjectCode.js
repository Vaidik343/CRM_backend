const { Op } = require("sequelize");

const generateProjectCode = async (projectName, ProjectModel) => {
  const prefix = projectName.replace(/\s+/g, "").substring(0, 3).toUpperCase();

  const existing = await ProjectModel.findAll({
    where: { code: { [Op.like]: `${prefix}%` } },
    attributes: ["code"],
  });

  let max = 0;
  for (const p of existing) {
    const num = parseInt(p.code?.slice(3), 10);
    if (!isNaN(num) && num > max) max = num;
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
};

module.exports = generateProjectCode;