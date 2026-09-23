/**
 * Saves Unect Talks registrations into a Google Sheet.
 *
 * Setup (5 minutes, free):
 * 1. Create a Google Sheet. Add headers in row 1: Submitted at | Name | WhatsApp | Consent
 * 2. In the sheet: Extensions → Apps Script. Replace everything with this file's code. Save.
 * 3. Deploy → New deployment → type "Web app".
 *      Execute as: Me    Who has access: Anyone
 * 4. Copy the Web app URL and paste it into FORM_ENDPOINT in script.js.
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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
