/* i18n.js — UI string dictionary (ja / en). All visible UI text lives here; no hardcoded UI copy in app.js. */
window.I18N = {
  ja: {
    dir: "ja",
    appName: "CSVエディタ",
    tagline: "ブラウザだけで動作・データはサーバーに送信されません",
    langSwitch: "English",
    navTool: "ツール", navFeatures: "機能", navHowto: "使い方", navFaq: "FAQ",
    heroH1: "オンラインCSVエディタ ― ブラウザ完結・完全無料",
    heroSub: "CSV / TSV / Excel をドラッグ＆ドロップで開いて、その場で編集。日付変換・ランダムデータ生成（マイナンバー・SSN・電話番号）にも対応。データは一切サーバーにアップロードされません。",
    privacyBadge: "100% クライアント処理", noSignup: "登録不要", freeBadge: "無料",
    importTitle: "1. データを読み込む",
    dropHint: "ここに CSV / TSV / XLSX をドラッグ＆ドロップ",
    or: "または", btnChooseFile: "ファイルを選択", btnPaste: "テキストを貼り付け", btnSample: "サンプルデータを読み込む",
    encodingLabel: "文字コード", encodingAuto: "自動判別",
    delimLabel: "区切り文字", delimAuto: "自動判別", delimComma: "カンマ (,)", delimSemi: "セミコロン (;)", delimTab: "タブ", delimPipe: "縦棒 (|)", delimCustom: "カスタム",
    headerRow: "1行目をヘッダーとして使用",
    applyImport: "読み込む", pasteTitle: "テキストを貼り付け", pasteHint: "Excelや他のツールからコピーした表を貼り付けてください。",
    btnCancel: "キャンセル", btnLoad: "読み込む", xlsxSheet: "シートを選択",
    addRow: "行を追加", addCol: "列を追加", delRow: "選択行を削除", delCol: "選択列を削除", renameHeader: "ヘッダー名を変更",
    undo: "元に戻す", redo: "やり直し", searchPlaceholder: "検索…",
    sortAsc: "昇順", sortDesc: "降順", filterCol: "この列でフィルタ", clearFilter: "フィルタ解除",
    pageSize: "表示件数", rowsCols: "行数 {rows} / 列数 {cols}",
    processTitle: "2. データを生成・処理する",
    targetLabel: "出力先", targetNewCol: "新しい列", targetColName: "列名", targetSelected: "選択中の列に上書き",
    funcLabel: "機能", funcDateConvert: "日付フォーマット変換", funcRandomDate: "ランダム日付生成",
    funcMyNumber: "マイナンバー（12桁）", funcSSN: "米国 SSN", funcNINO: "英国 NINo", funcPhone: "電話番号（ランダム）",
    sourceCol: "元の列", inFmt: "入力形式", inFmtAuto: "自動判別", outFmt: "出力形式", outJp: "YYYY年M月D日",
    dateStart: "開始日", dateEnd: "終了日", excludeWeekend: "週末を除外",
    phoneCountry: "国・地域", phoneJP: "日本", phoneUS: "アメリカ", phoneUK: "イギリス",
    phoneKind: "種別", phoneMobile: "携帯", phoneFixed: "固定電話", phoneFormat: "ハイフンあり",
    ssnHyphen: "ハイフンあり (AAA-GG-SSSS)", ninoSpace: "区切りあり (AA 12 34 56 A)",
    btnRun: "実行", reportTitle: "実行レポート", reportRows: "処理行数: {n}", reportSkipped: "変換できず元の値を維持: {n}",
    exportTitle: "3. 書き出す",
    fmtXlsx: "Excel (.xlsx)", fmtCsv: "CSV", fmtTsv: "TSV", fmtJson: "JSON", fmtJsonl: "JSON Lines",
    csvEnc: "CSV文字コード", encUtf8: "UTF-8", encUtf8Bom: "UTF-8 BOM付き", encSjis: "Shift-JIS", encEuc: "EUC-JP",
    csvDelim: "CSV区切り", lineEnd: "改行コード", lf: "LF", crlf: "CRLF", btnDownload: "ダウンロード",
    noData: "データがありません。ファイルを読み込むかサンプルをお試しください。",
    confirmDelete: "選択中の行/列を削除しますか？", copied: "コピーしました",
    footerPrivacy: "プライバシー", footerTerms: "利用規約",
    footerText: "当ツールはすべてブラウザ内で処理され、ファイルはサーバーに送信されません。"
  },
  en: {
    dir: "en",
    appName: "CSV Editor",
    tagline: "Runs entirely in your browser — your data never touches a server",
    langSwitch: "日本語",
    navTool: "Tool", navFeatures: "Features", navHowto: "How to", navFaq: "FAQ",
    heroH1: "Online CSV Editor — Free, Browser-Based, No Upload",
    heroSub: "Drag & drop to open CSV / TSV / Excel and edit on the spot. Convert date formats and generate realistic random data (My Number / SSN / phone numbers). Nothing is ever uploaded.",
    privacyBadge: "100% Client-Side", noSignup: "No Signup", freeBadge: "Free",
    importTitle: "1. Import your data",
    dropHint: "Drop CSV / TSV / XLSX here",
    or: "or", btnChooseFile: "Choose File", btnPaste: "Paste Text", btnSample: "Load Sample Data",
    encodingLabel: "Encoding", encodingAuto: "Auto-detect",
    delimLabel: "Delimiter", delimAuto: "Auto-detect", delimComma: "Comma (,)", delimSemi: "Semicolon (;)", delimTab: "Tab", delimPipe: "Pipe (|)", delimCustom: "Custom",
    headerRow: "First row as header",
    applyImport: "Import", pasteTitle: "Paste text", pasteHint: "Paste a table copied from Excel or another tool.",
    btnCancel: "Cancel", btnLoad: "Load", xlsxSheet: "Select sheet",
    addRow: "Add Row", addCol: "Add Column", delRow: "Delete Selected Row", delCol: "Delete Selected Column", renameHeader: "Rename Header",
    undo: "Undo", redo: "Redo", searchPlaceholder: "Search…",
    sortAsc: "Sort A→Z", sortDesc: "Sort Z→A", filterCol: "Filter this column", clearFilter: "Clear filters",
    pageSize: "Page size", rowsCols: "Rows {rows} / Cols {cols}",
    processTitle: "2. Generate / Transform",
    targetLabel: "Target", targetNewCol: "New column", targetColName: "Column name", targetSelected: "Overwrite selected column",
    funcLabel: "Function", funcDateConvert: "Date format convert", funcRandomDate: "Random date",
    funcMyNumber: "My Number (12-digit)", funcSSN: "US SSN", funcNINO: "UK NINo", funcPhone: "Random phone number",
    sourceCol: "Source column", inFmt: "Input format", inFmtAuto: "Auto-detect", outFmt: "Output format", outJp: "YYYY年M月D日",
    dateStart: "Start date", dateEnd: "End date", excludeWeekend: "Exclude weekends",
    phoneCountry: "Country", phoneJP: "Japan", phoneUS: "United States", phoneUK: "United Kingdom",
    phoneKind: "Type", phoneMobile: "Mobile", phoneFixed: "Landline", phoneFormat: "With separators",
    ssnHyphen: "Hyphenated (AAA-GG-SSSS)", ninoSpace: "Spaced (AA 12 34 56 A)",
    btnRun: "Run", reportTitle: "Report", reportRows: "Rows processed: {n}", reportSkipped: "Unparseable, kept original: {n}",
    exportTitle: "3. Export",
    fmtXlsx: "Excel (.xlsx)", fmtCsv: "CSV", fmtTsv: "TSV", fmtJson: "JSON", fmtJsonl: "JSON Lines",
    csvEnc: "CSV encoding", encUtf8: "UTF-8", encUtf8Bom: "UTF-8 with BOM", encSjis: "Shift-JIS", encEuc: "EUC-JP",
    csvDelim: "CSV delimiter", lineEnd: "Line ending", lf: "LF", crlf: "CRLF", btnDownload: "Download",
    noData: "No data. Import a file or load the sample.",
    confirmDelete: "Delete the selected row(s)/column(s)?", copied: "Copied",
    footerPrivacy: "Privacy", footerTerms: "Terms",
    footerText: "Everything runs in your browser. Files are never uploaded to a server."
  }
};

window.t = function (key) {
  var dict = window.LANG === "en" ? window.I18N.en : window.I18N.ja;
  var v = dict[key];
  if (v === undefined) v = window.I18N.en[key];
  return v === undefined ? key : v;
};
window.tex = function (key, vars) {
  var s = window.t(key);
  if (vars) for (var k in vars) s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
  return s;
};
