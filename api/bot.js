import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/messages.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const update = req.body;
  const message = update.message;

  // ✅ Ignore all except user text messages
  if (!message || !message.text || message.from?.is_bot) {
    return res.status(200).send('Ignore non-user message');
  }

  const chatId = message.chat.id;
  const userMessageId = message.message_id;

  // ✅ Send reply once
  const sendUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
  const sendBody = {
    chat_id: chatId,
    text: "🤖 Bot received your message and will delete this after 1 minute.",
    reply_to_message_id: userMessageId
  };

  const response = await fetch(sendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sendBody)
  });

  const reply = await response.json();

  // ✅ Save both message IDs
  if (!reply.ok || !reply.result?.message_id) {
    return res.status(200).send('Reply failed');
  }

  const entry = {
    chat_id: chatId,
    user_message_id: userMessageId,
    bot_message_id: reply.result.message_id,
    timestamp: Date.now()
  };

  let messages = [];
  try {
    messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {}

  messages.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

  return res.status(200).send('Done');
}
