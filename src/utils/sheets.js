import { GOOGLE_SHEET_URL } from '../config';

export async function sendToSheet(data) {
  if (!GOOGLE_SHEET_URL) {
    console.warn('Google Sheet URL not configured. Lead data:', data);
    return;
  }

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      mode: 'no-cors',
    });
  } catch (err) {
    console.error('Failed to send to Google Sheet:', err);
  }
}
