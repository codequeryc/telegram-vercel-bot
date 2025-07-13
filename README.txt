✅ Telegram Bot Auto Delete After 24 Hours

1. Deploy this on Vercel
2. Add environment variable:
   BOT_TOKEN = <your telegram bot token>
3. Set webhook:
   https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<your-vercel-app>.vercel.app/api/bot

4. Go to https://cron-job.org and create a scheduled job:
   URL: https://<your-vercel-app>.vercel.app/api/delete
   Frequency: Every 1 hour

Now bot will auto-delete messages after 24 hours!