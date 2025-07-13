import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/messages.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const message = req.body.message;

  // ✅ Ignore non-text or bot messages
  if (!message || !message.text || message.from?.is_bot) {
    return res.status(200).send('Ignored non-user message');
  }

  const chatId = message.chat.id;
  const userMessageId = message.message_id;

  // ✅ Load message history (try/catch for safety)
  let messages = [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    messages = JSON.parse(data);
  } catch {}

  // ✅ Prevent duplicate response to same message_id
  if (messages.some(msg => msg.user_message_id === userMessageId)) {
    return res.status(200).send('Already responded to this message');
  }

  // ✅ Send reply
  let botReply;
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
    botReply = await response.json();
  } catch (err) {
    return res.status(200).send('Telegram API failed');
  }

  // ✅ Double-check botReply success
  if (!botReply.ok || !botReply.result?.message_id) {
    return res.status(200).send('Bot reply failed or incomplete');
  }

  // ✅ Save message entry
  const entry = {
    chat_id: chatId,
    user_message_id: userMessageId,
    bot_message_id: botReply.result.message_id,
    timestamp: Date.now()
  };

  messages.push(entry);
  try {
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
  } catch (err) {
    return res.status(500).send('Failed to save message log');
  }

  res.status(200).send('Message processed');
}
