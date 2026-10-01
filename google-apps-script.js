/**
 * Saves Unect Talks registrations into a Google Sheet.
 *
 * Setup (5 minutes, free):
 * 1. Create a Google Sheet, then open Extensions → Apps Script FROM that sheet.
 * 2. Delete everything in Code.gs, paste this file's code, and save.
 * 3. Deploy → New deployment → type "Web app".
 *      Execute as: Me    Who has access: Anyone
 * 4. Copy the Web app URL and paste it into FORM_ENDPOINT in script.js.
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Submitted at", "Name", "WhatsApp", "Updates OK"]);
  }
  sheet.appendRow([
    new Date(),
    String(data.name || "").slice(0, 200),
    // leading apostrophe keeps "+974..." as text instead of a formula/number
    "'" + String(data.phone || "").slice(0, 20),
    data.consent || "",
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
