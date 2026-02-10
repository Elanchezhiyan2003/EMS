# How to Run the Application

## Step-by-Step Instructions

### 1️⃣ Install Dependencies

Open terminal in the project directory and run:

```bash
npm install
```

This will install:
- React 19.2.0
- Supabase JS Client 2.39.0
- Vite and other dev dependencies

**Expected output**: Installation should complete without errors.

---

### 2️⃣ Setup Supabase Backend

#### A. Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (or create account)
4. Click "New Project"
5. Fill in:
   - **Name**: employee-checkin (or any name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for setup

#### B. Run Database Schema

1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Open `supabase-schema.sql` from this project
4. Copy ALL the contents
5. Paste into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

#### C. Get API Credentials

1. Click "Settings" (gear icon, bottom left)
2. Click "API" in the settings menu
3. Copy these two values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (long string under "Project API keys")

#### D. Disable Email Confirmation (for testing)

1. Go to "Authentication" → "Providers"
2. Click "Email" provider
3. Scroll down to "Confirm email"
4. Toggle OFF "Enable email confirmations"
5. Click "Save"

---

### 3️⃣ Configure Environment Variables

1. In the project root, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` file in your editor

3. Replace with your actual values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

4. Save the file

**Important**: 
- Make sure there are NO spaces around the `=` sign
- Make sure the variables start with `VITE_`
- Don't use quotes around the values

---

### 4️⃣ Start the Application

```bash
npm run dev
```

**Expected output**:
```
  VITE v7.2.5  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

### 5️⃣ Open in Browser

1. Open your browser
2. Go to: `http://localhost:5173`
3. You should see the Login page

---

## 🧪 Test the Application

### Create Admin Account

1. Click "Register here"
2. Fill in the form:
   - **Name**: Admin User
   - **Email**: admin@test.com
   - **Password**: password123
   - **Role**: Admin
3. Click "Register"
4. You'll be redirected to login after 2 seconds

### Login as Admin

1. Enter:
   - **Email**: admin@test.com
   - **Password**: password123
2. Click "Login"
3. You should see the Admin Dashboard

### Create Employee Account

1. Click "Logout"
2. Click "Register here"
3. Fill in the form:
   - **Name**: John Doe
   - **Email**: john@test.com
   - **Password**: password123
   - **Role**: Employee
4. Click "Register"

### Test Check-In/Out

1. Login as employee (john@test.com)
2. You should see Employee Dashboard
3. Click "Check In" button
   - Button should disable
   - Check-in time should appear
4. Click "Check Out" button
   - Button should disable
   - Check-out time should appear
5. Scroll down to see attendance history

### Test Admin Features

1. Logout
2. Login as admin (admin@test.com)
3. You should see all employee records
4. Test filters:
   - Select today's date
   - Type employee email
   - Click "Clear Filters"

---

## 🎯 Verification Checklist

- [ ] Dependencies installed successfully
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] `.env` file created with correct values
- [ ] Dev server starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can register admin account
- [ ] Can register employee account
- [ ] Employee can check in
- [ ] Employee can check out
- [ ] Employee sees their history
- [ ] Admin sees all records
- [ ] Filters work correctly

---

## ❌ Common Issues

### Issue: "Invalid API key"

**Solution**:
1. Check `.env` file exists
2. Verify API key is correct (no extra spaces)
3. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: "Failed to fetch"

**Solution**:
1. Check Supabase project is running (green status in dashboard)
2. Verify Project URL is correct
3. Check internet connection

### Issue: "Row Level Security policy violation"

**Solution**:
1. Go to Supabase SQL Editor
2. Re-run the entire `supabase-schema.sql` file
3. Make sure all policies were created

### Issue: Can't register/login

**Solution**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Verify email confirmation is disabled in Supabase
4. Check if user exists in Authentication → Users

### Issue: Check-in button doesn't work

**Solution**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify `attendance` table exists in Supabase
4. Check if you already checked in today

---

## 🔄 Restart from Scratch

If something goes wrong:

1. **Delete Supabase tables**:
   ```sql
   DROP TABLE IF EXISTS attendance CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   ```

2. **Re-run schema**:
   - Copy and run `supabase-schema.sql` again

3. **Clear browser data**:
   - Open DevTools (F12)
   - Go to Application → Storage
   - Click "Clear site data"

4. **Restart dev server**:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

---

## 📱 Access from Other Devices

To access from phone/tablet on same network:

```bash
npm run dev -- --host
```

Then use the Network URL shown in terminal.

---

## 🏗️ Build for Production

```bash
npm run build
```

Output will be in `dist/` folder. Deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

---

## 🆘 Need Help?

1. Check [SETUP.md](SETUP.md) for detailed guide
2. Check [QUICK_START.md](QUICK_START.md) for quick reference
3. Check browser console for errors
4. Check Supabase logs in dashboard

---

**Happy coding! 🚀**
