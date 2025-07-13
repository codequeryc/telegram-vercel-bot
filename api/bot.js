import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/messages.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

  const message = req.body.message;
  if (!message || !message.text) return res.status(200).send('No text');

  const chatId = message.chat.id;
  const userMessageId = message.message_id;

  // Reply to user
  const reply = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: "🤖 Bot received your message and will delete this after 24 hours.",
      reply_to_message_id: userMessageId
    })
  });

  const replyData = await reply.json();

  // Save both message IDs and time
  const entry = {
    chat_id: chatId,
    user_message_id: userMessageId,
    bot_message_id: replyData.result?.message_id,
    timestamp: Date.now()
  };

  let messages = [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    messages = JSON.parse(data);
  } catch {}

  messages.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

  res.status(200).send('Message saved');
}