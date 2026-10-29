// Verify SJIS / EUC-JP export byte construction (regression for UTF-16LE double-byte bug).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the browser vendor bundle into this node context.
const code = fs.readFileSync(path.join(__dirname, '..', 'assets', 'vendor', 'encoding.min.js'), 'utf8');
const sandbox = { window: {}, self: {}, module: { exports: {} }, exports: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const Encoding = sandbox.Encoding || (sandbox.module && sandbox.module.exports) || sandbox.window.Encoding;
if (!Encoding || typeof Encoding.convert !== 'function') {
  console.error('FAIL: Encoding.convert not found on vendor bundle');
  process.exit(1);
}

const text = '生年月日,名前\n2024年1月1日,佐藤 悠太\n電話,090-1234-5678';

function convertTo(encName) {
  const byteArr = Encoding.convert(text, { to: encName, from: 'UNICODE', type: 'array' });
  return new Uint8Array(byteArr);
}

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log('PASS: ' + msg);
  else { console.error('FAIL: ' + msg); failures++; }
}

for (const [encName, decLabel] of [['SJIS', 'shift_jis'], ['EUCJP', 'euc-jp']]) {
  const bytes = convertTo(encName);
  // No interleaved 0x00 (the UTF-16LE bug signature).
  const zeros = bytes.filter(b => b === 0x00).length;
  assert(zeros === 0, encName + ' has no 0x00 bytes (found ' + zeros + ')');
  // Length should be short: multibyte Japanese ~2 bytes/char, not 2x UTF-16.
  assert(bytes.length < text.length * 2, encName + ' length ' + bytes.length + ' < ' + (text.length * 2) + ' (not doubled)');
  // Round-trip decode back to original.
  const back = new TextDecoder(decLabel).decode(bytes);
  assert(back === text, encName + ' round-trip decodes to original text');
}

console.log(failures === 0 ? '\nALL PASS' : '\n' + failures + ' FAILURES');
process.exit(failures === 0 ? 0 : 1);
