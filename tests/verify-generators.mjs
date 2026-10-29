// tests/verify-generators.mjs — assertion suite for data generators.
// Run: node tests/verify-generators.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const G = require('../assets/js/generators.js');

let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; } else { fail++; console.log('  FAIL', name); } }

console.log('== My Number ==');
check('vector base 00000000001 -> 000000000019', G.myNumberCheck('00000000001') === 9);
check('vector base 12345678901 -> 123456789016', G.myNumberCheck('12345678901') === 6);
let badMN = 0;
for (let i = 0; i < 1000; i++) { const n = G.genMyNumber(); if (!/^\d{12}$/.test(n) || !G.verifyMyNumber(n)) badMN++; }
check('1000 generated My Numbers all valid', badMN === 0);

console.log('== US SSN ==');
let badSSN = 0;
for (let i = 0; i < 1000; i++) { if (!G.verifySSN(G.genSSN(true))) badSSN++; }
check('1000 SSN all valid', badSSN === 0);
check('SSN hyphenated format', /^\d{3}-\d{2}-\d{4}$/.test(G.genSSN(true)));

console.log('== UK NINo ==');
let badNINO = 0;
for (let i = 0; i < 1000; i++) { if (!G.verifyNINO(G.genNINO(false))) badNINO++; }
check('1000 NINO all valid', badNINO === 0);
check('NINO spaced format', /^[A-Z]{2} \d{2} \d{2} \d{2} [A-D]$/.test(G.genNINO(true)));

console.log('== Phones ==');
let badJPm = 0, badJPf = 0, badUS = 0, badUK = 0;
for (let i = 0; i < 1000; i++) {
  if (!G.verifyJPPhone(G.genPhone('JP','mobile',true),'mobile')) badJPm++;
  if (!G.verifyJPPhone(G.genPhone('JP','fixed',true),'fixed')) badJPf++;
  if (!G.verifyUSPhone(G.genPhone('US','mobile',true))) badUS++;
  if (!G.verifyUKPhone(G.genPhone('UK','mobile',true))) badUK++;
}
check('1000 JP mobile valid', badJPm === 0);
check('1000 JP landline valid', badJPf === 0);
check('1000 US phones valid', badUS === 0);
check('1000 UK mobile valid', badUK === 0);
check('JP mobile prefix in 070/080/090', /^0(70|80|90)-\d{4}-\d{4}$/.test(G.genPhone('JP','mobile',true)));
check('US formatted (NPA) NXX-LINE', /^\(\d{3}\) \d{3}-\d{4}$/.test(G.genPhone('US','mobile',true)));

console.log('== Random date ==');
let badRD = 0, weekend = 0;
const s = new Date(2024,0,1).getTime(), e = new Date(2024,11,31).getTime();
for (let i = 0; i < 1000; i++) {
  const v = G.randomDate('2024-01-01','2024-12-31','YYYY-MM-DD',true);
  const d = new Date(v);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { badRD++; continue; }
  if (d.getTime() < s-86400000 || d.getTime() > e+86400000) badRD++;
  const dow = d.getDay(); if (dow === 0 || dow === 6) weekend++;
}
check('1000 random dates well-formed & in range', badRD === 0);
check('excludeWeekend produced zero Sat/Sun', weekend === 0);

console.log('== Date convert ==');
check('convert 2024/01/15 -> 2024年1月15日', G.convertDateFormat('2024/01/15','YYYY/MM/DD','YYYY年M月D日').value === '2024年1月15日');
check('unparseable kept original', G.convertDateFormat('not-a-date','','YYYY-MM-DD').ok === false);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
