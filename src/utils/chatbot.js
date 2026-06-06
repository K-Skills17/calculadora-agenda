// DEPRECATED: Chatbot integration has been moved server-side to /api/send-whatsapp.js
// This file is no longer used. The client now calls the serverless API endpoint instead.
// Keeping this file to avoid breaking any stale imports during transition.

export async function sendResultsToChatbot() {
  console.warn('sendResultsToChatbot is deprecated. Use /api/send-whatsapp server-side endpoint instead.');
}
