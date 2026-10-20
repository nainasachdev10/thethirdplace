/**
 * The Third Place: website enquiries -> Google Sheet
 *
 * Paste this into the sheet's Apps Script editor (Extensions -> Apps Script),
 * then Deploy -> New deployment -> Web app (Execute as: Me, Who has access: Anyone).
 * Copy the Web app URL into SHEET_ENDPOINT in js/main.js.
 */

const SHEET_NAME = 'Sheet1';
// Optional: put your email here to get an email for every new enquiry. Leave '' to turn off.
const NOTIFY_EMAIL = '';

const HEADERS = ['Submitted at', 'Name', 'Phone', 'Email', 'Interested in', 'When suits them', 'Message', 'Status'];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Spam trap: real visitors never fill the hidden "website" field.
  if (p.website) return json_({ ok: true });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const row = [
      new Date(),
      clean_(p.name),
      clean_(p.phone),
      clean_(p.email),
      clean_(p.interest),
      clean_(p.when),
      clean_(p.message),
      'New'
    ];
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'New enquiry: ' + row[1] + ' (' + row[4] + ')',
        HEADERS.slice(1, 7).map(function (h, i) { return h + ': ' + row[i + 1]; }).join('\n')
      );
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the Web app URL in a browser shows this, so you can check it's live.
function doGet() {
  return ContentService.createTextOutput('The Third Place enquiry endpoint is running.');
}

// Trim, cap length, and stop values like "=..." or "+91..." being read as formulas.
function clean_(v) {
  const s = String(v || '').trim().slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
