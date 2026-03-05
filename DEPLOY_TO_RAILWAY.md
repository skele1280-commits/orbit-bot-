# Deploy ORBIT Bot to Railway 🚀

## Step 1: Push Code to GitHub

Open Terminal on your Mac and run these commands:

```bash
cd ~/AgentWorkspace

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Orbit bot - top 50 coins pagination"

# Push to GitHub
git remote add origin https://github.com/skele1280-commits/orbit-bot
git branch -M main
git push -u origin main
```

If you get an error about "origin already exists", just run:
```bash
git push -u origin main
```

---

## Step 2: Create Railway Account

1. Go to: https://railway.app
2. Click "Sign up with GitHub"
3. Authorize Railway to access your GitHub
4. You'll see Railway dashboard

---

## Step 3: Deploy to Railway

1. On Railway dashboard, click **"New Project"**
2. Select **"GitHub Repo"**
3. Search for `orbit-bot` and select it
4. Click **"Deploy Now"**
5. Railway will auto-detect Python and build

---

## Step 4: Add Environment Variables (IMPORTANT!)

Railway will ask for environment variables. **Add these securely in Railway UI:**

1. Click "Variables" in your Railway project
2. Add each variable:

```
BOT_TOKEN = [paste your @BotFather token here]
DATABASE_URL = [paste your PostgreSQL connection string]
ADMIN_IDS = [your Telegram user ID]
ADMIN_NAME = [admin username]
ADMIN_PASS = [admin password]
```

**Railway encrypts these automatically - safe!**

---

## Step 5: Done! ✅

Railway will:
- Auto-build your Python project
- Run `pip install requirements.txt`
- Start your bot with the `Procfile`
- Keep it running 24/7
- FREE tier includes $5/month credit (plenty for a bot)

---

## How to Update Your Bot

When you want to make changes:

```bash
# Make your changes to main.py

# Push to GitHub
git add .
git commit -m "Updated bot"
git push origin main

# Railway auto-deploys (usually within 30 seconds)
```

---

## Troubleshooting

**Bot not starting?**
- Check Railway build logs (red = error)
- Most common: missing environment variables
- Solution: Add all vars in Railway UI

**Database connection error?**
- Verify DATABASE_URL is correct
- Test connection in Railway logs

**Still stuck?**
- Railway has free support
- Check their docs: https://docs.railway.app

---

## That's it! 🎉

Your bot is now:
✅ Always running (24/7)
✅ Free ($5/month auto-credit)
✅ Professional hosting
✅ Auto-deploys on code push
✅ Secure environment variables

Enjoy! 🚀
