/* app.js — main application. Pure client-side. */
(function () {
  'use strict';
  var G = window.CSVGen;

  // ---------- language detection ----------
  var path = location.pathname.replace(/\\/g, '/');
  window.LANG = (/^\/en(\/|$)/.test(path)) ? 'en' : 'ja';

  // ---------- state ----------
  var S = {
    headers: [], rows: [],
    page: 1, pageSize: 100,
    sortCol: -1, sortDir: 1,
    filterCol: -1, filterVal: '',
    search: '',
    selectedRow: -1, selectedCol: -1,
    xlsxBuffer: null, xlsxNames: []
  };
  var undoStack = [], redoStack = [];

  function snapshot() { return { headers: S.headers.slice(), rows: S.rows.map(function (r) { return r.slice(); }) }; }
  function pushHistory() { undoStack.push(snapshot()); if (undoStack.length > 100) undoStack.shift(); redoStack = []; }
  function restore(snap) { S.headers = snap.headers.slice(); S.rows = snap.rows.map(function (r) { return r.slice(); }); S.page = 1; render(); }
  function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
  function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

  // ---------- helpers ----------
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- build static UI shell ----------
  function buildShell() {
    var app = el('app');
    app.innerHTML =
      '<section class="panel" id="importPanel">' +
      '<h2>' + t('importTitle') + '</h2>' +
      '<div class="dropzone" id="dropzone">' + t('dropHint') + '</div>' +
      '<div class="btnrow">' +
      '<button class="btn" id="btnChoose">' + t('btnChooseFile') + '</button>' +
      '<button class="btn" id="btnPaste">' + t('btnPaste') + '</button>' +
      '<button class="btn btn-accent" id="btnSample">' + t('btnSample') + '</button>' +
      '<input type="file" id="fileInput" accept=".csv,.tsv,.txt,.xlsx,.xls" hidden>' +
      '</div>' +
      '<div class="opts">' +
      '<label>' + t('encodingLabel') + ' <select id="optEnc">' +
      '<option value="auto">' + t('encodingAuto') + '</option>' +
      '<option value="utf-8">UTF-8</option><option value="utf-8-bom">UTF-8 BOM</option>' +
      '<option value="shift-jis">Shift-JIS</option><option value="euc-jp">EUC-JP</option>' +
      '<option value="iso-8859-1">ISO-8859-1</option><option value="windows-1252">Windows-1252</option>' +
      '</select></label>' +
      '<label>' + t('delimLabel') + ' <select id="optDelim">' +
      '<option value="auto">' + t('delimAuto') + '</option>' +
      '<option value=",">' + t('delimComma') + '</option>' +
      '<option value=";">' + t('delimSemi') + '</option>' +
      '<option value="\t">' + t('delimTab') + '</option>' +
      '<option value="|">' + t('delimPipe') + '</option>' +
      '</select></label>' +
      '<label class="chk"><input type="checkbox" id="optHeader" checked> ' + t('headerRow') + '</label>' +
      '<div id="sheetPickWrap" class="hidden"><label>' + t('xlsxSheet') + ' <select id="optSheet"></select></label> <button class="btn" id="btnLoadSheet">'+t('btnLoad')+'</button></div>' +
      '</div></section>' +

      '<section class="panel hidden" id="editPanel">' +
      '<div class="toolbar">' +
      '<button class="btn" id="btnAddRow">' + t('addRow') + '</button>' +
      '<button class="btn" id="btnAddCol">' + t('addCol') + '</button>' +
      '<button class="btn" id="btnDelRow">' + t('delRow') + '</button>' +
      '<button class="btn" id="btnDelCol">' + t('delCol') + '</button>' +
      '<button class="btn" id="btnRename">' + t('renameHeader') + '</button>' +
      '<span class="sep"></span>' +
      '<button class="btn" id="btnUndo">' + t('undo') + '</button>' +
      '<button class="btn" id="btnRedo">' + t('redo') + '</button>' +
      '<span class="sep"></span>' +
      '<input type="text" id="searchBox" placeholder="' + t('searchPlaceholder') + '">' +
      '<button class="btn" id="btnClearFilter">' + t('clearFilter') + '</button>' +
      '</div>' +
      '<div class="tablewrap"><table id="grid"></table></div>' +
      '<div class="statusbar">' +
      '<span id="statusText"></span>' +
      '<span class="spacer"></span>' +
      '<label>' + t('pageSize') + ' <select id="pageSizeSel"><option>50</option><option selected>100</option><option>200</option></select></label>' +
      '<button class="btn" id="prevPage">‹</button><span id="pageInfo"></span><button class="btn" id="nextPage">›</button>' +
      '</div></section>' +

      '<section class="panel hidden" id="processPanel">' +
      '<h2>' + t('processTitle') + '</h2>' +
      '<div class="opts">' +
      '<label>' + t('targetLabel') + ' <select id="procTarget"><option value="new">' + t('targetNewCol') + '</option><option value="selected">' + t('targetSelected') + '</option></select></label>' +
      '<label id="newColNameWrap">' + t('targetColName') + ' <input type="text" id="procNewName" value="generated"></label>' +
      '<label>' + t('funcLabel') + ' <select id="procFunc">' +
      '<option value="dateConvert">' + t('funcDateConvert') + '</option>' +
      '<option value="randomDate">' + t('funcRandomDate') + '</option>' +
      '<option value="myNumber">' + t('funcMyNumber') + '</option>' +
      '<option value="ssn">' + t('funcSSN') + '</option>' +
      '<option value="nino">' + t('funcNINO') + '</option>' +
      '<option value="phone">' + t('funcPhone') + '</option>' +
      '</select></label>' +
      '</div>' +
      '<div id="funcArgs"></div>' +
      '<button class="btn btn-accent" id="btnRun">' + t('btnRun') + '</button>' +
      '<div id="reportBox" class="report hidden"></div></section>' +

      '<section class="panel hidden" id="exportPanel">' +
      '<h2>' + t('exportTitle') + '</h2>' +
      '<div class="opts">' +
      '<label>' + t('csvEnc') + ' <select id="expEnc"><option value="utf-8">UTF-8</option><option value="utf-8-bom">UTF-8 BOM</option><option value="sjis">Shift-JIS</option><option value="euc">EUC-JP</option></select></label>' +
      '<label>' + t('csvDelim') + ' <select id="expDelim"><option value=",">,</option><option value=";">;</option><option value="\t">Tab</option></select></label>' +
      '<label>' + t('lineEnd') + ' <select id="expNL"><option value="\n">LF</option><option value="\r\n">CRLF</option></select></label>' +
      '</div>' +
      '<div class="btnrow">' +
      '<button class="btn" data-exp="xlsx">' + t('fmtXlsx') + '</button>' +
      '<button class="btn" data-exp="csv">' + t('fmtCsv') + '</button>' +
      '<button class="btn" data-exp="tsv">' + t('fmtTsv') + '</button>' +
      '<button class="btn" data-exp="json">' + t('fmtJson') + '</button>' +
      '<button class="btn" data-exp="jsonl">' + t('fmtJsonl') + '</button>' +
      '</div></section>' +

      '<div id="pasteModal" class="modal hidden"><div class="modalbox">' +
      '<h3>' + t('pasteTitle') + '</h3><p>' + t('pasteHint') + '</p>' +
      '<textarea id="pasteArea" rows="10"></textarea>' +
      '<div class="btnrow"><button class="btn" id="btnPasteCancel">' + t('btnCancel') + '</button>' +
      '<button class="btn btn-accent" id="btnPasteLoad">' + t('btnLoad') + '</button></div></div></div>';
  }

  // ---------- encoding ----------
  function decodeBuffer(buf, enc) {
    var labels = { 'utf-8': 'utf-8', 'utf-8-bom': 'utf-8', 'shift-jis': 'shift_jis', 'euc-jp': 'euc-jp', 'iso-8859-1': 'iso-8859-1', 'windows-1252': 'windows-1252' };
    if (enc === 'auto') {
      var b = new Uint8Array(buf);
      if (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) return new TextDecoder('utf-8').decode(buf);
      try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
      catch (e) { return new TextDecoder('shift_jis').decode(buf); }
    }
    return new TextDecoder(labels[enc] || 'utf-8').decode(buf);
  }

  // ---------- import ----------
  function parseText(text, delim) {
    var cfg = { header: false, skipEmptyLines: false, complete: function (res) { setData(res.data); } };
    if (delim && delim !== 'auto') cfg.delimiter = delim;
    Papa.parse(text, cfg);
  }

  function setData(matrix) {
    // trim fully-empty trailing rows
    while (matrix.length && matrix[matrix.length - 1].every(function (c) { return c === '' || c == null; })) matrix.pop();
    if (!matrix.length) return;
    pushHistory();
    var useHeader = el('optHeader').checked;
    if (useHeader) {
      S.headers = matrix[0].map(function (h, i) { return h === '' || h == null ? 'Col' + (i + 1) : String(h); });
      S.rows = matrix.slice(1);
    } else {
      S.headers = matrix[0].map(function (_, i) { return 'Col' + (i + 1); });
      S.rows = matrix;
    }
    // normalize row lengths
    var ncol = S.headers.length;
    S.rows = S.rows.map(function (r) {
      while (r.length < ncol) r.push('');
      return r.slice(0, ncol);
    });
    S.page = 1; S.sortCol = -1; S.filterCol = -1; S.search = '';
    el('editPanel').classList.remove('hidden');
    el('processPanel').classList.remove('hidden');
    el('exportPanel').classList.remove('hidden');
    buildFuncArgs();
    render();
  }

  function handleFile(file) {
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    var reader = new FileReader();
    if (ext === 'xlsx' || ext === 'xls') {
      reader.onload = function (e) {
        var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        S.xlsxNames = wb.SheetNames; S.xlsxBuffer = e.target.result;
        if (wb.SheetNames.length > 1) {
          el('sheetPickWrap').classList.remove('hidden');
          var sel = el('optSheet'); sel.innerHTML = '';
          wb.SheetNames.forEach(function (n) { var o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
        } else { loadSheet(wb.SheetNames[0]); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = function (e) {
        var text = decodeBuffer(e.target.result, el('optEnc').value);
        parseText(text, el('optDelim').value);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function loadSheet(name) {
    var wb = XLSX.read(new Uint8Array(S.xlsxBuffer), { type: 'array' });
    var ws = wb.Sheets[name];
    var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    setData(aoa);
  }

  function loadSample() {
    var ja = (window.LANG === 'ja');
    var matrix = ja ? [
      ['名前', 'メール', '登録日', '金額'],
      ['佐藤 悠太', 'sato@example.jp', '2024/01/15', '12800'],
      ['鈴木 花子', 'suzuki@example.jp', '2024-02-03', '980'],
      ['田中 次郎', 'tanaka@example.jp', '2024.03.20', '45200'],
      ['高橋 誠', 'takahashi@example.jp', '2024/04/11', '7600']
    ] : [
      ['Name', 'Email', 'Signup Date', 'Amount'],
      ['Alice Johnson', 'alice@example.com', '2024/01/15', '12800'],
      ['Bob Smith', 'bob@example.com', '2024-02-03', '980'],
      ['Carol Davis', 'carol@example.com', '2024.03.20', '45200'],
      ['Dan Brown', 'dan@example.com', '2024/04/11', '7600']
    ];
    el('optHeader').checked = true;
    setData(matrix);
  }

  // ---------- derived rows (sort/filter/search) ----------
  function viewRows() {
    var rows = S.rows.map(function (r, i) { return { r: r, i: i }; });
    if (S.search) {
      var q = S.search.toLowerCase();
      rows = rows.filter(function (o) { return o.r.some(function (c) { return String(c).toLowerCase().indexOf(q) !== -1; }); });
    }
    if (S.filterCol >= 0 && S.filterVal !== '') {
      rows = rows.filter(function (o) { return String(o.r[S.filterCol]).indexOf(S.filterVal) !== -1; });
    }
    if (S.sortCol >= 0) {
      var col = S.sortCol, dir = S.sortDir;
      rows.sort(function (a, b) {
        var x = a.r[col], y = b.r[col];
        var nx = parseFloat(x), ny = parseFloat(y);
        var cmp;
        if (!isNaN(nx) && !isNaN(y) && String(nx) === String(x).trim() && String(ny) === String(y).trim()) cmp = nx - ny;
        else cmp = String(x).localeCompare(String(y));
        return cmp * dir;
      });
    }
    return rows;
  }

  // ---------- render grid ----------
  function render() {
    if (!S.headers.length) return;
    var grid = el('grid');
    var rows = viewRows();
    var totalPages = Math.max(1, Math.ceil(rows.length / S.pageSize));
    if (S.page > totalPages) S.page = totalPages;
    var start = (S.page - 1) * S.pageSize;
    var pageRows = rows.slice(start, start + S.pageSize);

    var html = '<thead><tr><th class="rowcol"></th>';
    S.headers.forEach(function (h, c) {
      html += '<th data-col="' + c + '"><div class="hcell"><span class="htext">' + esc(h) + '</span>' +
        '<span class="hbtns"><button class="mini" data-act="sort" data-col="' + c + '" title="' + t('sortAsc') + '">↕</button>' +
        '<button class="mini" data-act="filter" data-col="' + c + '" title="' + t('filterCol') + '">⇶</button></span></div></th>';
    });
    html += '</tr></thead><tbody>';
    pageRows.forEach(function (o) {
      var gi = o.i;
      html += '<tr data-row="' + gi + '"><th class="rowcol">' + (gi + 1) + '</th>';
      o.r.forEach(function (cell, c) {
        html += '<td data-r="' + gi + '" data-c="' + c + '" class="cell">' + esc(cell) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody>';
    grid.innerHTML = html;

    el('statusText').textContent = tex('rowsCols', { rows: S.rows.length, cols: S.headers.length });
    el('pageInfo').textContent = S.page + ' / ' + totalPages;
  }

  // ---------- cell editing ----------
  function beginEdit(td) {
    var r = parseInt(td.dataset.r, 10), c = parseInt(td.dataset.c, 10);
    var old = S.rows[r][c];
    var input = document.createElement('input');
    input.value = old;
    td.innerHTML = ''; td.appendChild(input); input.focus();
    function commit() {
      if (input.value !== old) { pushHistory(); S.rows[r][c] = input.value; }
      render();
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') { td.textContent = old; } });
  }

  // ---------- toolbar actions ----------
  function addRow() { pushHistory(); S.rows.push(S.headers.map(function () { return ''; })); render(); }
  function addCol() { pushHistory(); var name = prompt(t('targetColName'), 'Col' + (S.headers.length + 1)); if (name == null) return; S.headers.push(name); S.rows.forEach(function (r) { r.push(''); }); render(); }
  function delRow() {
    if (S.selectedRow < 0) { alert(t('noData')); return; }
    if (!confirm(t('confirmDelete'))) return;
    pushHistory(); S.rows.splice(S.selectedRow, 1); S.selectedRow = -1; render();
  }
  function delCol() {
    if (S.selectedCol < 0) return;
    if (!confirm(t('confirmDelete'))) return;
    pushHistory(); S.headers.splice(S.selectedCol, 1); S.rows.forEach(function (r) { r.splice(S.selectedCol, 1); }); S.selectedCol = -1; render();
  }
  function renameHeader() {
    if (S.selectedCol < 0) return;
    var name = prompt(t('renameHeader'), S.headers[S.selectedCol]);
    if (name == null) return;
    pushHistory(); S.headers[S.selectedCol] = name; render();
  }

  // ---------- processing panel ----------
  function buildFuncArgs() {
    var f = el('procFunc').value;
    var box = el('funcArgs');
    var colOpts = '<select id="argSourceCol"><option value="-1">' + t('sourceCol') + '</option>' +
      S.headers.map(function (h, i) { return '<option value="' + i + '">' + esc(h) + '</option>'; }).join('') + '</select>';
    var h = '';
    if (f === 'dateConvert') {
      h = '<label>' + t('sourceCol') + ' ' + colOpts + '</label>' +
        '<label>' + t('inFmt') + ' <select id="argInFmt"><option value="">' + t('inFmtAuto') + '</option>' +
        '<option value="YYYY-MM-DD">YYYY-MM-DD</option><option value="YYYY/MM/DD">YYYY/MM/DD</option>' +
        '<option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option>' +
        '<option value="YYYY年M月D日">YYYY年M月D日</option></select></label>' +
        '<label>' + t('outFmt') + ' <select id="argOutFmt"><option value="YYYY-MM-DD">YYYY-MM-DD</option>' +
        '<option value="YYYY/MM/DD">YYYY/MM/DD</option><option value="DD/MM/YYYY">DD/MM/YYYY</option>' +
        '<option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY年M月D日">YYYY年M月D日</option></select></label>';
    } else if (f === 'randomDate') {
      h = '<label>' + t('dateStart') + ' <input type="date" id="argStart" value="2024-01-01"></label>' +
        '<label>' + t('dateEnd') + ' <input type="date" id="argEnd" value="2024-12-31"></label>' +
        '<label>' + t('outFmt') + ' <select id="argOutFmt"><option value="YYYY-MM-DD">YYYY-MM-DD</option>' +
        '<option value="YYYY/MM/DD">YYYY/MM/DD</option><option value="YYYY年M月D日">YYYY年M月D日</option></select></label>' +
        '<label class="chk"><input type="checkbox" id="argExclude" checked> ' + t('excludeWeekend') + '</label>';
    } else if (f === 'ssn') {
      h = '<label class="chk"><input type="checkbox" id="argHyphen" checked> ' + t('ssnHyphen') + '</label>';
    } else if (f === 'nino') {
      h = '<label class="chk"><input type="checkbox" id="argSpace" checked> ' + t('ninoSpace') + '</label>';
    } else if (f === 'phone') {
      h = '<label>' + t('phoneCountry') + ' <select id="argCountry"><option value="JP">' + t('phoneJP') + '</option><option value="US">' + t('phoneUS') + '</option><option value="UK">' + t('phoneUK') + '</option></select></label>' +
        '<label>' + t('phoneKind') + ' <select id="argKind"><option value="mobile">' + t('phoneMobile') + '</option><option value="fixed">' + t('phoneFixed') + '</option></select></label>' +
        '<label class="chk"><input type="checkbox" id="argPhoneFmt" checked> ' + t('phoneFormat') + '</label>';
    }
    box.innerHTML = '<div class="opts">' + h + '</div>';
  }

  function runProcess() {
    var f = el('procFunc').value;
    var target = el('procTarget').value;
    var colIdx;
    if (target === 'new') {
      pushHistory();
      var cname = el('procNewName').value || ('col' + (S.headers.length + 1));
      S.headers.push(cname);
      colIdx = S.headers.length - 1;
      S.rows.forEach(function (r) { r.push(''); });
    } else {
      if (S.selectedCol < 0) { alert(t('sourceCol')); return; }
      pushHistory(); colIdx = S.selectedCol;
    }

    var skipped = 0;
    S.rows.forEach(function (r, i) {
      var v = '';
      if (f === 'dateConvert') {
        var sc = parseInt((el('argSourceCol') || {}).value || '-1', 10);
        var src = sc >= 0 ? r[sc] : r[colIdx];
        var res = G.convertDateFormat(src, el('argInFmt').value, el('argOutFmt').value);
        v = res.value; if (!res.ok) skipped++;
      } else if (f === 'randomDate') {
        v = G.randomDate(el('argStart').value, el('argEnd').value, el('argOutFmt').value, el('argExclude').checked);
      } else if (f === 'myNumber') { v = G.genMyNumber(); }
      else if (f === 'ssn') { v = G.genSSN(el('argHyphen').checked); }
      else if (f === 'nino') { v = G.genNINO(el('argSpace').checked); }
      else if (f === 'phone') { v = G.genPhone(el('argCountry').value, el('argKind').value, el('argPhoneFmt').checked); }
      r[colIdx] = v;
    });

    var rb = el('reportBox');
    rb.classList.remove('hidden');
    rb.innerHTML = '<b>' + t('reportTitle') + '</b><br>' +
      tex('reportRows', { n: S.rows.length }) + '<br>' +
      (f === 'dateConvert' ? tex('reportSkipped', { n: skipped }) : '');
    render();
  }

  // ---------- export ----------
  function doExport(kind) {
    if (!S.headers.length) return;
    if (kind === 'xlsx') {
      var aoa = [S.headers].concat(S.rows);
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      Object.keys(ws).forEach(function (k) { if (k[0] !== '!') { ws[k].t = 's'; ws[k].v = String(ws[k].v == null ? '' : ws[k].v); } });
      var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'data.xlsx');
      return;
    }
    var delim = kind === 'tsv' ? '\t' : el('expDelim').value;
    var text = Papa.unparse({ fields: S.headers, data: S.rows }, { delimiter: delim, newline: el('expNL').value });
    if (kind === 'json') {
      var arr = S.rows.map(function (r) { var o = {}; S.headers.forEach(function (h, i) { o[h] = r[i]; }); return o; });
      download(new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' }), 'data.json'); return;
    }
    if (kind === 'jsonl') {
      var lines = S.rows.map(function (r) { var o = {}; S.headers.forEach(function (h, i) { o[h] = r[i]; }); return JSON.stringify(o); });
      download(new Blob([lines.join('\n')], { type: 'application/x-ndjson' }), 'data.jsonl'); return;
    }
    // csv / tsv
    var enc = el('expEnc').value;
    var blob;
    if (enc === 'utf-8') blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    else if (enc === 'utf-8-bom') blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' });
    else {
      var to = enc === 'sjis' ? 'SJIS' : 'EUCJP';
      var byteArr = Encoding.convert(text, { to: to, from: 'UNICODE', type: 'array' });
      var bytes = new Uint8Array(byteArr);
      blob = new Blob([bytes], { type: 'application/octet-stream' });
    }
    download(blob, kind === 'tsv' ? 'data.tsv' : 'data.csv');
  }

  // ---------- events ----------
  function bind() {
    var dz = el('dropzone');
    ['dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
    dz.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
    el('btnChoose').onclick = function () { el('fileInput').click(); };
    el('fileInput').onchange = function (e) { if (e.target.files.length) handleFile(e.target.files[0]); };
    el('btnSample').onclick = loadSample;
    el('btnPaste').onclick = function () { el('pasteModal').classList.remove('hidden'); el('pasteArea').value = ''; };
    el('btnPasteCancel').onclick = function () { el('pasteModal').classList.add('hidden'); };
    el('btnPasteLoad').onclick = function () { el('pasteModal').classList.add('hidden'); parseText(el('pasteArea').value, el('optDelim').value); };
    el('btnLoadSheet').onclick = function () { loadSheet(el('optSheet').value); };

    el('btnAddRow').onclick = addRow;
    el('btnAddCol').onclick = addCol;
    el('btnDelRow').onclick = delRow;
    el('btnDelCol').onclick = delCol;
    el('btnRename').onclick = renameHeader;
    el('btnUndo').onclick = undo;
    el('btnRedo').onclick = redo;
    el('searchBox').oninput = function (e) { S.search = e.target.value; S.page = 1; render(); };
    el('btnClearFilter').onclick = function () { S.filterCol = -1; S.filterVal = ''; S.search = ''; el('searchBox').value = ''; render(); };
    el('pageSizeSel').onchange = function (e) { S.pageSize = parseInt(e.target.value, 10); S.page = 1; render(); };
    el('prevPage').onclick = function () { if (S.page > 1) { S.page--; render(); } };
    el('nextPage').onclick = function () { S.page++; render(); };

    el('procFunc').onchange = buildFuncArgs;
    el('btnRun').onclick = runProcess;

    document.querySelectorAll('[data-exp]').forEach(function (b) { b.onclick = function () { doExport(b.dataset.exp); }; });

    // grid delegation
    el('grid').addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.act === 'sort') {
        var c = parseInt(t.dataset.col, 10);
        if (S.sortCol === c) S.sortDir = -S.sortDir; else { S.sortCol = c; S.sortDir = 1; }
        render(); return;
      }
      if (t.dataset && t.dataset.act === 'filter') {
        var fc = parseInt(t.dataset.col, 10);
        var v = prompt(window.t('filterCol') + ':', S.headers[fc]);
        if (v == null) return;
        S.filterCol = fc; S.filterVal = v; render(); return;
      }
      var td = t.closest('td.cell');
      if (td) { S.selectedRow = parseInt(td.dataset.r, 10); S.selectedCol = parseInt(td.dataset.c, 10); beginEdit(td); }
      var th = t.closest('th');
      if (th && th.dataset && th.dataset.col !== undefined && !t.dataset.act) { S.selectedCol = parseInt(th.dataset.col, 10); }
    });
  }

  // ---------- boot ----------
  buildShell();
  bind();
})();
