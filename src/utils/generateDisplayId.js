const generateDisplayId = async ({
    prefix,
    employeeId,
}) => {
    // last 3 digits 

    const empPart = employeeId.slice(-3);

    // dddmmyy

    const now = new Date();

    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const yy = String(now.getFullYear()).slice(-2);

    const datePart = `${dd}${mm}${yy}`;

    // calculate remaining length

    const randomLength = 14 - prefix.length - empPart.length - datePart;

    const min = Math.pow(10, randomLength - 1);
  const max = Math.pow(10, randomLength) - 1;

  const randomPart =
    Math.floor(Math.random() * (max - min + 1) + min);

  return `${prefix}${empPart}${datePart}${randomPart}`;
};

module.exports = generateDisplayId;