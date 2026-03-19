# Google Cloud Console Setup Guide

Follow these steps to configure Google OAuth for CaseDiary.

## 1. Open Google Cloud Console

Go to [console.cloud.google.com](https://console.cloud.google.com) and select your project (e.g., "Law Firm OCR") or create a new one.

## 2. Enable Google Calendar API

1. Go to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Click on it → click **Enable**

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type → click **Create**
3. Fill in:
   - **App name**: `CaseDiary`
   - **User support email**: your email address
   - **Developer contact email**: your email address
4. Click **Save and Continue**
5. On the **Scopes** step, click **Add or Remove Scopes** and add:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
6. Click **Save and Continue**
7. On the **Test users** step, click **Add Users** and add the Google accounts that will use the app
8. Click **Save and Continue** → **Back to Dashboard**
9. Leave publishing status as **"Testing"**

## 4. Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `CaseDiary Local`
5. **Authorized JavaScript origins**: add `http://localhost:3000`
6. **Authorized redirect URIs**: add `http://localhost:3000/api/auth/callback/google`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## 5. Configure Environment Variables

Edit `.env.local` in the project root:

```bash
# Google OAuth (from step 4)
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000

# Gemini API Key (from https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-api-key-here
```

## 6. Verify

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Click "Sign in with Google"
4. You should see the Google consent screen requesting Calendar permissions
5. After sign-in, you should be redirected to the dashboard

## Troubleshooting

### "This app isn't verified" warning
This is expected while the app is in "Testing" mode. Click **Advanced** → **Go to CaseDiary (unsafe)** to proceed. This warning goes away after Google app verification (needed for public launch).

### "redirect_uri_mismatch" error
The redirect URI in Google Cloud Console must match exactly: `http://localhost:3000/api/auth/callback/google`. Check for trailing slashes or `https` vs `http`.

### "MissingSecret" error in server logs
`NEXTAUTH_SECRET` is not set in `.env.local`. Generate one with:
```bash
openssl rand -base64 32
```

### API routes hang / no response
Restart the dev server after changing `.env.local`. Next.js caches environment variables.
