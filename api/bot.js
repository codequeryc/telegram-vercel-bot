import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const messageFile = path.join(dataDir, 'messages.json');
const updatesFile = path.join(dataDir, 'updates.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const body = req.body;

  // ✅ Check for update_id to avoid duplicates
  const updateId = body.update_id;
  if (!updateId) return res.status(200).send('No update_id');

  let updates = [];
  try {
    updates = JSON.parse(fs.readFileSync(updatesFile, 'utf8'));
  } catch (e) {}

  if (updates.includes(updateId)) {
    return res.status(200).send('Duplicate update ignored');
  }

  // ✅ Process only user messages
  const message = body.message;
  if (!message || !message.text || message.from?.is_bot) {
    return res.status(200).send('Invalid or bot message ignored');
  }

  const chatId = message.chat.id;
  const userMessageId = message.message_id;

  // ✅ Reply to user
  let replyData;
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🤖 Bot received your message and will delete this after 24 hours.",
        reply_to_message_id: userMessageId
      })
    });

    replyData = await response.json();
  } catch (err) {
    return res.status(200).send('Telegram reply failed');
  }

  if (!replyData.ok || !replyData.result?.message_id) {
    return res.status(200).send('Reply missing message_id');
  }

  const entry = {
    chat_id: chatId,
    user_message_id: userMessageId,
    bot_message_id: replyData.result.message_id,
    timestamp: Date.now()
  };

  // ✅ Save message to messages.json
  let messages = [];
  try {
    messages = JSON.parse(fs.readFileSync(messageFile, 'utf8'));
  } catch {}

  messages.push(entry);
  fs.writeFileSync(messageFile, JSON.stringify(messages, null, 2));

  // ✅ Save update_id to updates.json
  updates.push(updateId);
  fs.writeFileSync(updatesFile, JSON.stringify(updates.slice(-1000), null, 2)); // keep last 1000 only

  res.status(200).send('Message handled');
}
