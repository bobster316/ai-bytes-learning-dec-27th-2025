# 🚀 Setup Supabase (2 Minutes)

The AI Course Generator needs a database to store courses. Supabase is **FREE** and easy!

---

## Step 1: Create Supabase Account

1. Visit: **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub (easiest) or email
4. ✅ You now have a Supabase account!

---

## Step 2: Create a New Project

1. Click **"New Project"**
2. Fill in:
   - **Name**: `ai-bytes-learning` (or any name)
   - **Database Password**: Create a strong password (save it somewhere!)
   - **Region**: Choose closest to you
3. Click **"Create new project"**
4. ⏳ Wait 1-2 minutes for setup to complete

---

## Step 3: Get Your API Keys

Once your project is ready:

1. On the left sidebar, click **"Project Settings"** (gear icon at bottom)
2. Click **"API"** in the settings menu
3. You'll see:

   **Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (long string)
   ```

4. Copy both values!

---

## Step 4: Add Keys to Your Project

1. Open your `.env.local` file in this project
2. Replace the placeholder values:

   **Before:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **After:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

3. Save the file

---

## Step 5: Apply Database Migration

Run this command in your terminal:

```bash
npm run migrate
```

You should see:
```
✅ Migration applied successfully!
📦 Created tables:
   • ai_generated_courses
   • course_topics
   • course_lessons
   ...
```

---

## Step 6: Test the Course Generator!

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Visit: **http://localhost:3000/admin/courses/generate**

3. Enter a course name like:
   - "Introduction to Machine Learning"
   - "Web Development Basics"
   - "Python for Beginners"

4. Click **"Generate Course"**

5. Watch the magic happen! ✨

---

## 🎉 You're Done!

If you see any errors, check that:
- ✅ You copied the full URL (starts with `https://`)
- ✅ You copied the full anon key (starts with `eyJ`)
- ✅ No extra spaces in `.env.local`
- ✅ You restarted the dev server after updating `.env.local`

---

## 💡 Already Have Supabase Set Up?

If your credentials are already in `.env.local`, just run:

```bash
npm run migrate
```

Then start the server and test the generator!
