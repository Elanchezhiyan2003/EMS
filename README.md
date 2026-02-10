# Employee Check-In/Check-Out Application

A simple, beginner-friendly employee attendance tracking system built with React (Vite) and Supabase.

![Tech Stack](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.5-purple)
![Supabase](https://img.shields.io/badge/Supabase-2.39.0-green)

## ✨ Features

### 👤 Employee Features
- ✅ Daily check-in and check-out
- ✅ View personal attendance history
- ✅ Auto-disabled buttons after actions
- ✅ Real-time status updates

### 👨‍💼 Admin Features
- ✅ View all employee attendance records
- ✅ Filter by date
- ✅ Filter by employee email
- ✅ Real-time data synchronization

### 🔒 Security
- ✅ Email & password authentication
- ✅ Row Level Security (RLS)
- ✅ Role-based access control
- ✅ Secure environment variables

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in SQL Editor
   - Get your API credentials from Settings → API

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:5173`

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[SETUP.md](SETUP.md)** - Detailed setup guide with troubleshooting
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Login.jsx           # Login form
│   ├── Register.jsx        # Registration form
│   └── CheckInOut.jsx      # Check-in/out component
│
├── pages/
│   ├── EmployeeDashboard.jsx  # Employee view
│   └── AdminDashboard.jsx     # Admin view
│
├── supabase/
│   └── client.js           # Supabase configuration
│
├── App.jsx                 # Main app logic
└── App.css                 # Application styles
```

## 🛠️ Tech Stack

- **Frontend**: React 19.2 with Vite
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Basic CSS (no frameworks)

## 📊 Database Schema

### profiles
- `id` - UUID (references auth.users)
- `name` - User's full name
- `email` - User's email
- `role` - 'employee' or 'admin'

### attendance
- `id` - UUID
- `user_id` - References profiles
- `date` - Attendance date
- `check_in` - Check-in time
- `check_out` - Check-out time

## 🔐 Security Features

- Row Level Security (RLS) policies
- Employees can only access their own records
- Admins can view all records
- Secure API key management
- Protected routes

## 🎯 Usage

### Employee Workflow
1. Login with credentials
2. Click "Check In" to start the day
3. Click "Check Out" when leaving
4. View attendance history

### Admin Workflow
1. Login with admin credentials
2. View all employee records
3. Use filters to find specific records
4. Monitor attendance in real-time

## 🧪 Testing

### Demo Credentials

You can register your own accounts or use these test credentials:

**Admin Account:**
- Email: `admin@test.com`
- Password: `admin123`
- Role: Admin

**Employee Account:**
- Email: `employee@test.com`
- Password: `employee123`
- Role: Employee

> **Note**: You need to register these accounts first through the registration page, or create your own test accounts.

### Testing Steps

1. **Register test accounts:**
   - Click "Register here" on login page
   - Create an admin account with role "Admin"
   - Create an employee account with role "Employee"

2. **Test the check-in/out flow:**
   - Login as employee
   - Click "Check In" button (should disable after click)
   - Click "Check Out" button (should disable after click)
   - View attendance history below

3. **Test admin features:**
   - Logout and login as admin
   - View all employee records
   - Filter by date
   - Filter by employee email
   - Verify record count updates

4. **Verify functionality:**
   - Buttons disable after use
   - History updates correctly
   - Admin can see all records
   - Filters work properly
   - Can't check in twice on same day

## 📦 Build for Production

```bash
npm run build
```

Deploy the `dist` folder to any static hosting service (Vercel, Netlify, etc.)

## 🐛 Troubleshooting

**Can't connect to Supabase?**
- Verify `.env` file exists and has correct values
- Restart dev server after changing `.env`

**Can't check in/out?**
- Check browser console for errors
- Verify SQL schema was executed
- Ensure RLS policies are enabled

See [SETUP.md](SETUP.md) for more troubleshooting tips.

## 📝 Code Quality

- ✅ Functional components with hooks
- ✅ Clean, readable code
- ✅ Comprehensive error handling
- ✅ Loading states
- ✅ User feedback messages
- ✅ Commented important logic

## 🎓 Learning Resources

This project demonstrates:
- React fundamentals
- Authentication flow
- Database design
- API integration
- Security best practices
- Responsive design

## 🤝 Contributing

This is a beginner-friendly educational project. Feel free to:
- Report issues
- Suggest improvements
- Fork and customize

## 📄 License

Open source - free for educational and commercial use.

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)

---

**Need help?** Check the documentation files or open an issue.
