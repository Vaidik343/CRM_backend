const { Op } = require("sequelize");

const generateProjectCode = async (projectName, ProjectModel) => {
  const prefix = projectName
    .replace(/\s+/g, "")
    .substring(0, 3)
    .toUpperCase();

  // Get ALL codes (including inactive/deleted projects) to avoid reuse
  const allProjects = await ProjectModel.findAll({
    attributes: ["code"],
    where: {
      code: { [Op.not]: null },
    },
  });

  // Extract all numbers from all codes, find the max
  let maxNumber = 0;
  for (const project of allProjects) {
    const match = project.code?.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  }

  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
};

module.exports = generateProjectCode;