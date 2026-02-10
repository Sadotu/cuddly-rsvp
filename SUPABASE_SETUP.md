# Supabase Setup Instructions for Cuddly Couch RSVP

This guide will walk you through setting up Supabase as the backend for your RSVP application and deploying it to GitHub Pages.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

## Step 2: Create a New Project

1. Once logged in, click "New Project"
2. Fill in the project details:
   - **Name**: `cuddly-couch-rsvp` (or any name you prefer)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select "Free" (sufficient for this project)
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be set up

## Step 3: Create the Database Table

1. In your Supabase project dashboard, click on **"SQL Editor"** in the left sidebar
2. Click "New Query"
3. Copy and paste this SQL code:

```sql
-- Create the RSVPs table
CREATE TABLE rsvps (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlist')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Anyone can view RSVPs"
  ON rsvps
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow public insert
CREATE POLICY "Anyone can insert RSVPs"
  ON rsvps
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow public delete
CREATE POLICY "Anyone can delete RSVPs"
  ON rsvps
  FOR DELETE
  TO anon
  USING (true);

-- Create policy to allow public update
CREATE POLICY "Anyone can update RSVPs"
  ON rsvps
  FOR UPDATE
  TO anon
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_rsvps_status ON rsvps(status);
CREATE INDEX idx_rsvps_created_at ON rsvps(created_at);
```

4. Click "Run" or press Ctrl+Enter
5. You should see "Success. No rows returned" message

## Step 4: Set Up Automatic Data Deletion (Optional but Recommended)

To automatically delete data 3 hours after the event and logs 2 months after:

1. Still in the SQL Editor, create a new query
2. Copy and paste this code:

```sql
-- Create a function to delete old RSVPs
CREATE OR REPLACE FUNCTION delete_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete RSVPs 3 hours after event (2026-02-13 22:00:00)
  IF NOW() >= '2026-02-13 22:00:00'::timestamp THEN
    DELETE FROM rsvps;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job using pg_cron extension
-- Note: pg_cron is only available on paid plans
-- For free tier, you can call this function manually or use a serverless function
```

**Note**: Automatic scheduled tasks require a paid plan. For the free tier, you have two options:
- Set up a GitHub Action to call the deletion function periodically
- Manually delete the data after the event

## Step 5: Get Your API Credentials

1. Click on **"Settings"** (gear icon) in the left sidebar
2. Click on **"API"** under Project Settings
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`
4. **Copy both values** - you'll need them in the next step

## Step 6: Configure Your Application

1. Open the file `index-supabase.html`
2. Find these lines near the top of the `<script>` section (around line 618):

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...your-actual-key...';
```

4. Save the file

## Step 7: Test Locally

1. Open `index-supabase.html` in your web browser
2. Try adding an RSVP
3. Check if it appears in the list
4. Try cancelling an RSVP
5. Verify in Supabase dashboard:
   - Go to **Table Editor** → **rsvps**
   - You should see your test entries

## Step 8: Deploy to GitHub Pages

### Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon → "New repository"
3. Name it: `cuddly-couch-rsvp`
4. Make it **Public** (required for free GitHub Pages)
5. Don't initialize with README
6. Click "Create repository"

### Push Your Files

1. Open terminal/command prompt
2. Navigate to your project folder:
```bash
cd "/mnt/c/Users/nickd/DevProjects/cuddly rsvp"
```

3. Rename the Supabase file to index.html:
```bash
mv index-supabase.html index.html
```

4. Initialize git and push:
```bash
git init
git add index.html
git commit -m "Initial commit: Cuddly Couch RSVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/cuddly-couch-rsvp.git
git push -u origin main
```

(Replace `YOUR-USERNAME` with your actual GitHub username)

### Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes
6. Your site will be live at: `https://YOUR-USERNAME.github.io/cuddly-couch-rsvp/`

## Step 9: Share Your RSVP Link

Your RSVP page is now live! Share this link with your guests:
```
https://YOUR-USERNAME.github.io/cuddly-couch-rsvp/
```

## Features Included

✅ Maximum 12 attendees with automatic waiting list
✅ Real-time updates (all users see changes instantly)
✅ Cancel RSVP with confirmation
✅ Automatic promotion from waiting list
✅ Mobile-friendly design
✅ Captcha verification
✅ Beautiful green/gray theme
✅ Sapling emoji favicon

## Troubleshooting

### RSVPs not appearing
- Check browser console for errors (F12)
- Verify your Supabase URL and API key are correct
- Check Row Level Security policies are enabled

### "Failed to fetch RSVPs" error
- Make sure your Supabase project is running
- Verify the table name is exactly `rsvps`
- Check your internet connection

### Real-time updates not working
- Real-time is enabled by default in Supabase
- Check if you have any browser extensions blocking WebSockets
- Try refreshing the page

## Cost and Limits

Supabase Free Tier includes:
- 500MB database space
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth per month
- 500MB data transfer

This is more than enough for an RSVP application!

## Security Notes

- The current setup allows anyone to add/remove RSVPs (intentional for your use case)
- All data is stored securely in Supabase's PostgreSQL database
- API keys are safe to expose in frontend code (they're called "anon" keys for this reason)
- For production apps with sensitive data, you'd want to add authentication

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Pages Docs: https://docs.github.com/en/pages

---

Enjoy your Cuddly Couch event! 🌱
