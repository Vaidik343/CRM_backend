const generateDisplayId = ({ prefix, employeeId }) => {
  const empPart = employeeId.slice(-3);

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const datePart = `${dd}${mm}${yy}`;

  const randomLength = 14 - prefix.length - empPart.length - datePart.length;

  if (randomLength <= 0) throw new Error(`Prefix "${prefix}" too long`);

  const randomPart = String(Math.floor(Math.random() * Math.pow(10, randomLength))).padStart(randomLength, "0");

  return `${prefix}${empPart}${datePart}${randomPart}`;
};

module.exports = generateDisplayId;