# Employee Check-In/Check-Out Application - Setup Guide

A simple and beginner-friendly employee attendance tracking system built with React (Vite) and Supabase.

## Features

### Employee Features
- ✅ Check in once per day
- ✅ Check out once per day (only after check-in)
- ✅ View personal attendance history
- ✅ Automatic button disabling after actions

### Admin Features
- ✅ View all employee attendance records
- ✅ Filter by date
- ✅ Filter by employee email
- ✅ Real-time data updates

## Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Email & Password
- **Styling**: Basic CSS (no UI libraries)

## Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or higher)
- npm or yarn
- A Supabase account (free tier works fine)

## Setup Instructions

### Step 1: Supabase Setup

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Fill in project details and wait for setup to complete

2. **Run Database Schema**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Copy the entire contents of `supabase-schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the schema

3. **Get Your API Credentials**
   - Go to Project Settings → API
   - Copy the following:
     - `Project URL` (VITE_SUPABASE_URL)
     - `anon public` key (VITE_SUPABASE_ANON_KEY)

4. **Configure Email Authentication**
   - Go to Authentication → Providers
   - Ensure "Email" is enabled
   - (Optional) Disable email confirmation for testing:
     - Go to Authentication → Settings
     - Disable "Enable email confirmations"

### Step 2: Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Environment File**
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```

3. **Add Your Supabase Credentials**
   - Open `.env` file
   - Replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Navigate to `http://localhost:5173`
   - You should see the login page

## Usage Guide

### First Time Setup

1. **Register an Admin Account**
   - Click "Register here"
   - Fill in your details
   - Select "Admin" as role
   - Click "Register"

2. **Register Employee Accounts**
   - Create additional accounts with "Employee" role
   - Or ask employees to self-register

### Employee Workflow

1. **Login**
   - Enter email and password
   - Click "Login"

2. **Check In**
   - Click "Check In" button
   - Button will be disabled after check-in
   - Current time will be recorded

3. **Check Out**
   - Click "Check Out" button (only available after check-in)
   - Button will be disabled after check-out
   - Current time will be recorded

4. **View History**
   - Scroll down to see your attendance history
   - Table shows date, check-in time, and check-out time

### Admin Workflow

1. **Login as Admin**
   - Use admin credentials

2. **View All Records**
   - See all employee attendance records
   - Records are sorted by date (newest first)

3. **Filter Records**
   - **By Date**: Select a date to see attendance for that day
   - **By Email**: Type employee email to filter records
   - Click "Clear Filters" to reset

## Database Schema

### profiles table
| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key, references auth.users |
| name       | TEXT      | Employee name                  |
| email      | TEXT      | Employee email (unique)        |
| role       | TEXT      | 'employee' or 'admin'          |
| created_at | TIMESTAMP | Account creation time          |

### attendance table
| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key                    |
| user_id    | UUID      | Foreign key to profiles        |
| date       | DATE      | Attendance date                |
| check_in   | TIME      | Check-in time                  |
| check_out  | TIME      | Check-out time                 |
| created_at | TIMESTAMP | Record creation time           |

## Security (Row Level Security)

The application uses Supabase RLS policies to ensure:
- Employees can only read/write their own attendance records
- Admins can read all attendance records
- Users can only read/update their own profile
- All queries are automatically filtered by the database

## Project Structure

```
src/
├── components/
│   ├── Login.jsx           # Login form component
│   ├── Register.jsx        # Registration form component
│   └── CheckInOut.jsx      # Check-in/out functionality
│
├── pages/
│   ├── EmployeeDashboard.jsx  # Employee view
│   └── AdminDashboard.jsx     # Admin view
│
├── supabase/
│   └── client.js           # Supabase client configuration
│
├── App.jsx                 # Main app with routing logic
├── App.css                 # Application styles
└── main.jsx               # React entry point
```

## Important Notes

### Check-In/Out Logic
- **One check-in per day**: Users can only check in once per day
- **Check-out requires check-in**: Cannot check out without checking in first
- **Buttons auto-disable**: Prevents duplicate entries
- **Date-based**: Uses system date (YYYY-MM-DD format)
- **Time recording**: Uses system time (HH:MM:SS format)

### Data Constraints
- Unique constraint on `(user_id, date)` in attendance table
- This prevents duplicate attendance records for the same day
- Role must be either 'employee' or 'admin'

## Troubleshooting

### "Invalid API key" error
- Check that your `.env` file has the correct Supabase credentials
- Ensure environment variables start with `VITE_`
- Restart the dev server after changing `.env`

### "Row Level Security policy violation"
- Ensure you ran the complete `supabase-schema.sql` script
- Check that RLS policies are enabled in Supabase dashboard

### Can't check in/out
- Check browser console for errors
- Verify the attendance table exists in Supabase
- Ensure your user profile exists in the profiles table

### Email confirmation required
- Go to Supabase → Authentication → Settings
- Disable "Enable email confirmations" for testing

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Future Enhancements (Not Included)

This is a beginner-friendly implementation. Possible enhancements:
- GPS location tracking
- Biometric authentication
- Multiple check-ins per day
- Break time tracking
- Export to CSV/Excel
- Email notifications
- Mobile app version

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation: https://supabase.com/docs
3. Check browser console for error messages

## License

This project is open source and available for educational purposes.
