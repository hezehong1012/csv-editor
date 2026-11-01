// POST /api/ai-edit — natural-language editing for the CSV editor.
// The model only PARSES the instruction into a small vocabulary of operations;
// the browser executes them locally on every row (cheap, deterministic, scalable).
//
// Body: { instruction, headers: string[], sample: string[][], rowCount, lang }
// Returns: { ops: Op[], notes: string }
//
// Env: LLM_API_URL / LLM_API_KEY / LLM_MODEL.

const RATE_WINDOW_MS = 60000;
const RATE_MAX = 15;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW_MS) { hits.set(ip, { start: now, count: 1 }); return false; }
  rec.count += 1;
  return rec.count > RATE_MAX;
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

const SPEC = `You convert a user's editing instruction into a JSON list of operations for a CSV editor.
The browser executes the operations locally on every row, so you MUST only use this vocabulary:

{"op":"addColumn","name":"<new column name>","gen":"serial|uuid|phone|email|number","args":{"country":"JP|US|UK","value":"<constant text>"}}
{"op":"transform","col":"<existing column name>","fn":"upper|lower|trim|halfwidth|date"}
{"op":"filterRows","col":"<existing column name>","value":"<text that must appear in the cell>"}

Rules:
- "col" MUST exactly match one of the provided headers, or null if the user did not specify a column.
- Use "gen":"phone" for any request to add phone numbers; JP country unless the user says otherwise.
- Use "gen":"email" to create email addresses (derived from the name column when one exists).
- Use "gen":"serial" for IDs / numbering / 連番. Use "gen":"uuid" only if the user says UUID/GUID.
- "fn":"date" normalises dates to YYYY-MM-DD. "fn":"halfwidth" converts full-width characters to half-width.
- Emit at most 6 operations. If the instruction cannot be expressed with this vocabulary, return an empty ops list.
- Output STRICT JSON only: {"ops":[...],"notes":"<one short sentence in the user's language describing what will be done>"}`;

function extractJson(raw) {
  let s = String(raw || '').trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

function sanitizeOps(ops) {
  const GEN = new Set(['serial', 'uuid', 'phone', 'email', 'number']);
  const FN = new Set(['upper', 'lower', 'trim', 'halfwidth', 'date']);
  const out = [];
  for (const op of (Array.isArray(ops) ? ops : []).slice(0, 6)) {
    if (!op || typeof op !== 'object') continue;
    if (op.op === 'addColumn' && GEN.has(op.gen)) {
      out.push({ op: 'addColumn', name: String(op.name || 'col').slice(0, 60), gen: op.gen, args: op.args || {} });
    } else if (op.op === 'transform' && FN.has(op.fn)) {
      out.push({ op: 'transform', col: op.col == null ? null : String(op.col).slice(0, 120), fn: op.fn });
    } else if (op.op === 'filterRows') {
      out.push({ op: 'filterRows', col: String(op.col || '').slice(0, 120), value: String(op.value == null ? '' : op.value).slice(0, 200) });
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, configured: !!process.env.LLM_API_KEY });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.LLM_API_KEY) return res.status(501).json({ error: 'AI_UNAVAILABLE' });
  if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });

  const body = req.body || {};
  const instruction = typeof body.instruction === 'string' ? body.instruction.trim().slice(0, 500) : '';
  const headers = Array.isArray(body.headers) ? body.headers.map((h) => String(h).slice(0, 120)).slice(0, 60) : [];
  const sample = Array.isArray(body.sample) ? body.sample.slice(0, 30) : [];
  const rowCount = Number(body.rowCount) || 0;
  const lang = body.lang === 'en' ? 'en' : 'ja';

  if (!instruction) return res.status(400).json({ error: 'instruction is required' });

  const user = [
    'Headers: ' + JSON.stringify(headers),
    'Sample rows (up to 30 of ' + rowCount + '): ' + JSON.stringify(sample),
    'User instruction: ' + instruction
  ].join('\n');

  const apiUrl = process.env.LLM_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const model = process.env.LLM_MODEL || 'deepseek-chat';

  try {
    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.LLM_API_KEY },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SPEC },
          { role: 'user', content: user }
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: 'LLM_HTTP_' + r.status, detail: detail.slice(0, 200) });
    }
    const data = await r.json();
    const raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!raw) return res.status(502).json({ error: 'LLM_EMPTY' });
    const parsed = extractJson(raw);
    const ops = sanitizeOps(parsed.ops);
    return res.status(200).json({ ops, notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 300) : '' });
  } catch (e) {
    return res.status(500).json({ error: 'AI_EDIT_FAILED', detail: String(e && e.message || e).slice(0, 200) });
  }
}
