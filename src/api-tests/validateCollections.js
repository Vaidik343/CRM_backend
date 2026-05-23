const fs = require('fs');
const paths = [
  'c:\\Vaidik\\backend\\CRM\\src\\api-tests\\crm-postman-collection.json',
  'c:\\Vaidik\\backend\\CRM\\src\\api-tests\\crm-postman-collection-fixed.json'
];
paths.forEach(p => {
  try {
    const s = fs.readFileSync(p, 'utf8');
    JSON.parse(s);
    console.log(p + ': OK');
  } catch (e) {
    console.error(p + ': ERR ->', e.message);
  }
});
