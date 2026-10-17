const YDC_MCP_URL = 'https://api.you.com/mcp?profile=free';
const categories = {
  'Conferences': [
    'upcoming Pakistan Conferences September 2026',
    'Pakistan Conferences September 2026 Lahore Karachi Islamabad',
    'Pakistan conference events September 2026'
  ],
  'Sports Events': [
    'upcoming Pakistan Sports Events September 2026',
    'Pakistan cricket football tournament events September 2026 Lahore Karachi Islamabad',
    'Pakistan sports event calendar September 2026'
  ],
  'Tourism & Travel': [
    'Pakistan Tourism Event September 2026',
    'Pakistan tourism events September 2026 Lahore Karachi Islamabad',
    'Pakistan travel festival September 2026'
  ]
};

async function youSearch(query) {
  const requestBody = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'audit', version: '1.0.0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'you-search', arguments: { query, count: 10, freshness: 'month', extraction: 'highlights' } } }
  ];

  const res1 = await fetch(YDC_MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(requestBody[0])
  });
  if (!res1.ok) throw new Error('initialize failed: ' + res1.status + ' ' + res1.statusText);

  const res2 = await fetch(YDC_MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(requestBody[1])
  });
  if (!res2.ok) throw new Error('notification failed: ' + res2.status + ' ' + res2.statusText);

  const res3 = await fetch(YDC_MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(requestBody[2])
  });
  if (!res3.ok) throw new Error('search failed: ' + res3.status + ' ' + res3.statusText);

  const text = await res3.text();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    try {
      const payload = JSON.parse(trimmed.slice(5).trim());
      const content = Array.isArray(payload?.result?.content) ? payload.result.content : [];
      const item = content.find((entry) => entry?.type === 'text' && typeof entry.text === 'string');
      if (!item) continue;
      const parsed = JSON.parse(item.text);
      if (parsed?.results?.web) return parsed.results.web;
    } catch {
      // ignore malformed frames
    }
  }
  return [];
}

const report = {};
for (const [category, queries] of Object.entries(categories)) {
  const rows = [];
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const results = await youSearch(q);
    rows.push({ queryLabel: String.fromCharCode(65 + i), query: q, resultCount: results.length, sample: results.slice(0, 3).map((r) => ({ title: r.title || '', url: r.url || '' })) });
  }
  report[category] = rows;
}
console.log(JSON.stringify(report, null, 2));
