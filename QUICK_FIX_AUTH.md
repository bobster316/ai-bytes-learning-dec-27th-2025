# Quick Fix for Auth Error

## Problem
Supabase requires email confirmation by default, but no email provider is configured.

## Solution: Disable Email Confirmation

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Open your project: "AI Bytes New Dev"

### Step 2: Disable Email Confirmation
1. Click **"Authentication"** in the left sidebar
2. Click **"Providers"** tab
3. Find **"Email"** provider and click it
4. **UNCHECK** the box that says:
   - ✅ "Confirm email"
   - Change it to: ☐ "Confirm email"
5. Click **"Save"**

### Step 3: Sign Up Again
Now go back to your app and try signing up again:
- Visit: http://localhost:3000/auth/signup
- Fill in the form
- Click "Create Account"
- Should work immediately!

### Step 4: Make Yourself Admin

After you successfully sign up, run this SQL in Supabase SQL Editor:

```sql
-- Add role column to users table if it doesn't exist
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB DEFAULT '{}';

-- Make your account admin (replace with your email)
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) ||
  '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

Replace `'your-email@example.com'` with the email you signed up with.

---

## Alternative: Configure Email Provider (Later)

If you want proper email confirmation in the future:
1. Use a service like Resend, SendGrid, or SMTP
2. Configure it in Supabase → Authentication → Email Templates
3. Re-enable email confirmation

For now, disabling it is the fastest way to test the AI course generator!
