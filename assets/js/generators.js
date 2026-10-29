/*
 * generators.js — region-aware data generators & date utilities.
 * UMD: works in browser (window.CSVGen) and Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CSVGen = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function digit() { return randInt(0, 9); }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }

  function formatDate(date, pattern) {
    if (!(date instanceof Date) || isNaN(date)) return '';
    var y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    return pattern.replace(/YYYY|YY|MM|DD|M|D/g, function (tok) {
      switch (tok) {
        case 'YYYY': return String(y);
        case 'YY': return pad(y % 100, 2);
        case 'MM': return pad(m, 2);
        case 'DD': return pad(d, 2);
        case 'M': return String(m);
        case 'D': return String(d);
      }
      return tok;
    });
  }
  function parseDateWithFormat(str, pattern) {
    if (!str) return null;
    var s = String(str).trim();
    var reSrc = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var order = [];
    reSrc = reSrc.replace(/YYYY|YY|MM|DD|M|D/g, function (tok) { order.push(tok); return '(\\d+)'; });
    var m = new RegExp('^' + reSrc + '$').exec(s);
    if (!m) return null;
    var vals = {};
    for (var i = 0; i < order.length; i++) {
      var num = parseInt(m[i + 1], 10);
      if (isNaN(num)) return null;
      var tok = order[i];
      if (tok === 'YYYY') vals.y = num;
      else if (tok === 'YY') vals.y = (num < 70 ? 2000 : 1900) + num;
      else if (tok === 'MM' || tok === 'M') vals.m = num;
      else if (tok === 'DD' || tok === 'D') vals.d = num;
    }
    if (!vals.y || !vals.m || !vals.d) return null;
    if (vals.m < 1 || vals.m > 12 || vals.d < 1 || vals.d > 31) return null;
    var date = new Date(vals.y, vals.m - 1, vals.d);
    if (date.getMonth() !== vals.m - 1 || date.getDate() !== vals.d) return null;
    return date;
  }
  function parseDateFlex(str) {
    if (!str) return null;
    var s = String(str).trim();
    var patterns = ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY.MM.DD', 'YYYY年M月D日',
      'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY', 'DD.MM.YYYY', 'MM.DD.YYYY'];
    for (var i = 0; i < patterns.length; i++) { var d = parseDateWithFormat(s, patterns[i]); if (d) return d; }
    return null;
  }
  function convertDateFormat(value, inFmt, outFmt) {
    if (value === null || value === undefined || String(value).trim() === '') return { value: value, ok: true, skipped: true };
    var d = inFmt ? parseDateWithFormat(String(value), inFmt) : parseDateFlex(String(value));
    if (!d) return { value: value, ok: false, skipped: true };
    return { value: formatDate(d, outFmt), ok: true, skipped: false };
  }
  function randomDate(startStr, endStr, outFmt, excludeWeekend) {
    var start = parseDateFlex(startStr), end = parseDateFlex(endStr);
    if (!start || !end) return '';
    if (start.getTime() > end.getTime()) { var t = start; start = end; end = t; }
    var span = end.getTime() - start.getTime();
    var d;
    for (var a = 0; a < 50; a++) {
      d = new Date(start.getTime() + Math.random() * span);
      if (!excludeWeekend) break;
      var dow = d.getDay();
      if (dow !== 0 && dow !== 6) break;
    }
    return formatDate(d, outFmt);
  }

  function myNumberCheck(base11) {
    var n = String(base11).padStart(11, '0').split('').map(Number);
    var w = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    var S = 0;
    for (var i = 0; i < 11; i++) S += n[i] * w[i];
    var check = 11 - (S % 11);
    if (check === 10 || check === 11) check = 0;
    return check;
  }
  function genMyNumber() { var base = ''; for (var i = 0; i < 11; i++) base += digit(); return base + myNumberCheck(base); }
  function verifyMyNumber(num) { if (!/^\d{12}$/.test(num)) return false; return myNumberCheck(num.slice(0, 11)) === Number(num[11]); }

  function genSSN(hyphenated) {
    var area; do { area = randInt(1, 899); } while (area === 666);
    var group = randInt(1, 99), serial = randInt(1, 9999);
    var s = pad(area, 3) + pad(group, 2) + pad(serial, 4);
    return hyphenated ? s.slice(0, 3) + '-' + s.slice(3, 5) + '-' + s.slice(5) : s;
  }
  function verifySSN(s) {
    s = s.replace(/-/g, '');
    if (!/^\d{9}$/.test(s)) return false;
    var area = parseInt(s.slice(0, 3), 10), group = parseInt(s.slice(3, 5), 10), serial = parseInt(s.slice(5, 9), 10);
    if (area === 0 || area === 666 || area >= 900) return false;
    if (group < 1 || group > 99) return false;
    if (serial < 1 || serial > 9999) return false;
    return true;
  }

  var NINO_L1 = ['A','B','C','E','G','H','J','K','L','M','N','P','R','S','T','W','X','Y','Z'];
  var NINO_L2 = ['A','B','C','E','F','G','H','J','K','L','M','N','P','R','S','T','W','X','Y','Z'];
  var NINO_BAD = ['BG','GB','NK','KN','TN','ZZ'];
  function genNINO(spaced) {
    var pre; do { pre = pick(NINO_L1) + pick(NINO_L2); } while (NINO_BAD.indexOf(pre) !== -1);
    var num = ''; for (var i = 0; i < 6; i++) num += digit();
    var suf = pick(['A', 'B', 'C', 'D']);
    return spaced ? pre + ' ' + num.slice(0, 2) + ' ' + num.slice(2, 4) + ' ' + num.slice(4) + ' ' + suf : pre + num + suf;
  }
  function verifyNINO(s) {
    s = s.replace(/\s+/g, '');
    if (!/^[A-Z]{2}\d{6}[A-D]$/.test(s)) return false;
    var pre = s.slice(0, 2);
    if (NINO_BAD.indexOf(pre) !== -1) return false;
    if (NINO_L1.indexOf(pre[0]) === -1) return false;
    if (NINO_L2.indexOf(pre[1]) === -1) return false;
    return true;
  }

  function genPhone(country, kind, formatted) {
    if (country === 'JP') return genJPPhone(kind, formatted);
    if (country === 'US') return genUSPhone(formatted);
    if (country === 'UK') return genUKPhone(kind, formatted);
    return '';
  }
  function genJPPhone(kind, formatted) {
    if (kind === 'fixed') {
      var area = pick(['03', '044', '045', '052', '06', '075', '092']);
      var a = pad(randInt(1, 9999), 4), b = pad(randInt(1, 9999), 4);
      return formatted ? area + '-' + a + '-' + b : area + a + b;
    }
    var prefix = pick(['070', '080', '090']);
    var a2 = pad(randInt(0, 9999), 4), b2 = pad(randInt(0, 9999), 4);
    return formatted ? prefix + '-' + a2 + '-' + b2 : prefix + a2 + b2;
  }
  function verifyJPPhone(s, kind) {
    var compact = s.replace(/-/g, '');
    if (kind === 'fixed') return /^0(3|44|45|52|6|75|92)\d{8}$/.test(compact);
    return /^0(70|80|90)\d{8}$/.test(compact);
  }
  function genUSPhone(formatted) {
    var npa, nxx;
    do { npa = randInt(200, 999); } while (npa === 555);
    do { nxx = randInt(200, 999); } while (nxx === 555);
    var line = pad(randInt(0, 9999), 4);
    return formatted ? '(' + npa + ') ' + nxx + '-' + line : npa + '-' + nxx + '-' + line;
  }
  function verifyUSPhone(s) {
    var c = s.replace(/[()\-\s]/g, '');
    if (!/^\d{10}$/.test(c)) return false;
    var npa = parseInt(c.slice(0, 3), 10), nxx = parseInt(c.slice(3, 6), 10);
    if (String(npa)[0] < 2 || npa === 555) return false;
    if (String(nxx)[0] < 2) return false;
    return true;
  }
  function genUKPhone(kind, formatted) {
    var third = pick([4, 5, 7, 8, 9]);
    var rest = ''; for (var i = 0; i < 8; i++) rest += digit();
    var national = '07' + third + rest;
    if (!formatted) return national;
    return national.slice(0, 5) + ' ' + national.slice(5);
  }
  function verifyUKPhone(s) {
    var national = s.replace(/\+44/, '0').replace(/\s/g, '');
    if (!/^07[45789]\d{8}$/.test(national)) return false;
    return true;
  }

  return {
    randInt: randInt, pick: pick, pad: pad,
    formatDate: formatDate, parseDateWithFormat: parseDateWithFormat,
    parseDateFlex: parseDateFlex, convertDateFormat: convertDateFormat,
    randomDate: randomDate,
    myNumberCheck: myNumberCheck, genMyNumber: genMyNumber, verifyMyNumber: verifyMyNumber,
    genSSN: genSSN, verifySSN: verifySSN,
    genNINO: genNINO, verifyNINO: verifyNINO,
    genPhone: genPhone,
    verifyJPPhone: verifyJPPhone, verifyUSPhone: verifyUSPhone, verifyUKPhone: verifyUKPhone
  };
});
