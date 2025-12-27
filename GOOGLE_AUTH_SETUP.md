# Google OAuth Setup Guide

*Note: This document was reviewed on 9 November 2025. The instructions appear current but have not been tested during the latest development session.*

This guide will help you set up Google OAuth authentication for your AI Bytes Learning platform.

## Prerequisites

- A Supabase account and project
- A Google Cloud Platform account

## Step 1: Set Up Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the application name: `AI Bytes Learning`
   - Add your email as support email
   - Add authorized domains (your production domain)
   - Save and continue

6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `AI Bytes Learning Web`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
     - Your production callback URL

7. Click **Create** and save your:
   - Client ID
   - Client Secret

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and enable it
5. Enter your Google OAuth credentials:
   - **Client ID**: (from Step 1)
   - **Client Secret**: (from Step 1)
6. Copy the **Callback URL** provided by Supabase
7. Go back to Google Cloud Console and add this URL to your authorized redirect URIs if not already added
8. Click **Save** in Supabase

## Step 3: Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

You can find these values in your Supabase Dashboard under **Settings** > **API**.

## Step 4: Restart Your Development Server

After setting up the environment variables, restart your development server:

```bash
npm run dev
```

## Step 5: Test Google OAuth

1. Navigate to `http://localhost:3000/auth/signin`
2. Click the **Continue with Google** button
3. You should be redirected to Google's login page
4. After successful authentication, you'll be redirected back to your dashboard

## Troubleshooting

### Error: "Authentication is not configured"
- Make sure you've added the Supabase credentials to `.env.local`
- Restart your development server after adding environment variables

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Google Cloud Console exactly matches the one provided by Supabase
- Check that you've added both development and production URLs

### Error: "Access blocked: This app's request is invalid"
- Make sure you've completed the OAuth consent screen configuration
- Verify that your email is added as a test user if the app is in testing mode

### Users can't sign in
- Check that Google is enabled in Supabase Authentication > Providers
- Verify your Client ID and Client Secret are correct
- Check browser console for any errors

## Additional Configuration

### Add Test Users (During Development)

If your Google OAuth app is in testing mode:

1. Go to Google Cloud Console > **APIs & Services** > **OAuth consent screen**
2. Scroll down to **Test users**
3. Click **Add Users** and add email addresses
4. These users will be able to sign in while the app is in testing mode

### Production Deployment

Before deploying to production:

1. Update your Google Cloud Console redirect URIs with your production URL
2. Update `NEXT_PUBLIC_SITE_URL` in your production environment variables
3. Consider verifying your OAuth consent screen for public access
4. Set up proper error logging and monitoring

## Security Best Practices

1. Never commit `.env.local` to version control (it's already in `.gitignore`)
2. Use different Google OAuth credentials for development and production
3. Regularly rotate your Client Secret
4. Enable email verification in Supabase if required
5. Set up rate limiting for authentication endpoints

## Next Steps

After setting up Google OAuth, you may want to:

- Customize the user profile data stored in Supabase
- Add user roles and permissions
- Set up email notifications for new sign-ups
- Implement user profile management
- Add additional OAuth providers (GitHub, Microsoft, etc.)

## Support

If you encounter any issues:

1. Check the Supabase Auth logs in your dashboard
2. Review browser console errors
3. Verify all URLs and credentials are correct
4. Check the Supabase documentation: https://supabase.com/docs/guides/auth
