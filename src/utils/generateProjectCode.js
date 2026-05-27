const generateProjectCode = async (projectName, ProjectModel) => {

    const prefix = projectName.replace(/\s+/g, "").substring(0,3).toUpperCase();

    const count = await Projects.count();

    const number = String(count + 1).padStart(3, "0");

    return `${prefix}${number}`;

}

module.exports = generateProjectCode;