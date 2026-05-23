const fs = require('fs');
const p = 'c:\\Vaidik\\backend\\CRM\\src\\api-tests\\crm-postman-collection.json';
const pos = 57736;
const s = fs.readFileSync(p,'utf8');
console.log('file length', s.length);
const start = Math.max(0, pos-60);
const end = Math.min(s.length, pos+60);
console.log('context:');
console.log(s.slice(start,end).replace(/\n/g,'\\n'));
