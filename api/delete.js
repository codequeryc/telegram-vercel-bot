import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/messages.json');

export default async function handler(req, res) {
  let messages = [];
  try {
    messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return res.status(500).send('Failed to load message data');
  }

  const now = Date.now();
  const twentyFourHr = 60 * 1000;
  const kept = [];

  for (const msg of messages) {
    if (now - msg.timestamp >= twentyFourHr) {
      // Try delete user message
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: msg.chat_id, message_id: msg.user_message_id })
      });

      // Try delete bot message
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: msg.chat_id, message_id: msg.bot_message_id })
      });
    } else {
      kept.push(msg);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(kept, null, 2));
  res.status(200).send('Old messages deleted');
}
