# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase

**Create Project:**
- Go to [supabase.com](https://supabase.com)
- Create new project
- Wait for setup to complete

**Run Database Schema:**
- Open Supabase SQL Editor
- Copy & paste contents from `supabase-schema.sql`
- Click "Run"

**Get API Keys:**
- Go to Settings → API
- Copy Project URL and anon key

### 3. Configure Environment

Create `.env` file:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run Application
```bash
npm run dev
```

### 5. Test the App

**Register Admin:**
- Open http://localhost:5173
- Click "Register here"
- Create account with role "Admin"

**Register Employee:**
- Logout and register another account
- Select role "Employee"

**Test Check-In/Out:**
- Login as employee
- Click "Check In"
- Click "Check Out"
- View attendance history

**Test Admin View:**
- Login as admin
- View all employee records
- Test filters

## 📋 Key Features

### Employee
- ✅ Daily check-in/out
- ✅ View personal history
- ✅ Auto-disabled buttons

### Admin
- ✅ View all records
- ✅ Filter by date/email
- ✅ Real-time updates

## 🔧 Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚠️ Important Notes

1. **Environment Variables**: Must start with `VITE_`
2. **Restart Server**: After changing `.env` file
3. **Email Confirmation**: Disable in Supabase for testing
4. **One Check-In Per Day**: By design
5. **RLS Policies**: Automatically secure your data

## 📁 File Structure

```
src/
├── components/        # Reusable components
├── pages/            # Dashboard pages
├── supabase/         # Supabase config
├── App.jsx           # Main app logic
└── App.css           # Styles
```

## 🐛 Troubleshooting

**Can't connect to Supabase?**
- Check `.env` file exists
- Verify API keys are correct
- Restart dev server

**Can't check in/out?**
- Check browser console
- Verify SQL schema was run
- Check RLS policies are enabled

**Login not working?**
- Verify user exists in profiles table
- Check Supabase Auth settings
- Disable email confirmation for testing

## 📚 Full Documentation

See `SETUP.md` for detailed instructions and explanations.
