const {Op, where} = require("sequelize");

const generateProjectCode = async (projectName, ProjectModel) => {
  const prefix = projectName
    .replace(/\s+/g, "")
    .substring(0, 3)
    .toUpperCase();

  const latestProject = await ProjectModel.findOne({
    order: [["code", "DESC"]],  // order by code not createdAt
    attributes: ["code"],
    where: {
      code: { [Op.not]: null }  // skip old projects with null code
    }
  });

  let nextNumber = 1;
  if (latestProject?.code) {
    const match = latestProject.code.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
};
module.exports = generateProjectCode;