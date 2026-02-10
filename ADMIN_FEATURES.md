# Admin Features Guide

## 🎯 Admin Panel Features

### 1. Create Employee Accounts

Admins can create employee accounts directly without requiring employees to register themselves.

**How to Use:**
1. Login as Admin
2. Go to "Employee Management" section
3. Click **"+ Create New Employee"** button
4. Fill in the form:
   - **Employee ID** (Optional) - e.g., EMP001, EMP002
   - **Full Name** (Required)
   - **Email** (Required)
   - **Password** (Required, min 6 characters)
   - **Role** (Employee or Admin)
5. Click **"Create Employee"**
6. Employee can now login with the provided credentials

**Benefits:**
- ✅ Centralized employee onboarding
- ✅ Admin controls all credentials
- ✅ Assign Employee ID during creation
- ✅ Create both employees and admins
- ✅ No email confirmation needed

### 2. Manage Employee IDs

Admins can assign or edit Employee IDs for existing employees.

**How to Use:**
1. In "Employee Management" section
2. Find the employee in the table
3. Click **"Assign ID"** or **"Edit ID"**
4. Enter the Employee ID
5. Click **"Save"**

**Features:**
- ✅ Unique Employee IDs (no duplicates)
- ✅ Inline editing
- ✅ Shows in attendance records
- ✅ Optional field

### 3. View All Employees

See a complete list of all registered employees and admins.

**Information Displayed:**
- Employee ID
- Full Name
- Email Address
- Role (with color-coded badges)
- Action buttons

### 4. View All Attendance Records

Monitor attendance for all employees in one place.

**Features:**
- ✅ See all check-ins and check-outs
- ✅ Filter by date
- ✅ Filter by employee email
- ✅ Shows Employee ID
- ✅ Real-time updates

**How to Filter:**
1. Select a date to see that day's attendance
2. Type employee email to find specific records
3. Click "Clear Filters" to reset

## 📋 Employee Credentials Management

### Creating Employee Credentials

When you create an employee, you provide:

1. **Employee ID** (Optional)
   - Format: Any text (e.g., EMP001, E-2024-001)
   - Must be unique if provided
   - Can be added later

2. **Full Name** (Required)
   - Employee's display name

3. **Email** (Required)
   - Must be unique
   - Used for login
   - Format: valid email address

4. **Password** (Required)
   - Minimum 6 characters
   - Employee uses this to login
   - Can be reset by admin (future feature)

5. **Role** (Required)
   - **Employee**: Can check-in/out, view own records
   - **Admin**: Full access to all features

### Employee Login Credentials

After creating an employee, they can login with:
- **Email**: The email you provided
- **Password**: The password you set

**Example:**
```
Email: john.doe@company.com
Password: welcome123
```

### Best Practices

1. **Employee ID Format**
   - Use consistent format (e.g., EMP001, EMP002)
   - Include year if needed (e.g., 2024-001)
   - Keep it short and memorable

2. **Password Security**
   - Use strong passwords
   - Share credentials securely
   - Ask employees to change password after first login (future feature)

3. **Email Addresses**
   - Use company email addresses
   - Verify email is correct before creating
   - Keep a backup list of credentials

## 🔐 Security Features

- ✅ Only admins can create employees
- ✅ Only admins can manage Employee IDs
- ✅ Row Level Security enforced by database
- ✅ Passwords are encrypted by Supabase
- ✅ Each employee can only see their own attendance

## 📊 Admin Dashboard Layout

```
┌─────────────────────────────────────────┐
│  Admin Dashboard                        │
│  Welcome, Admin Name!          [Logout] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Employee Management                    │
│                    [+ Create New Employee]│
├─────────────────────────────────────────┤
│  [Create Employee Form - when clicked]  │
├─────────────────────────────────────────┤
│  Employee List Table:                   │
│  - Employee ID                          │
│  - Name                                 │
│  - Email                                │
│  - Role                                 │
│  - Actions (Assign/Edit ID)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Filter Attendance Records              │
│  [Date Filter] [Email Filter] [Clear]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  All Employee Attendance Records        │
│  Table with all check-ins/check-outs   │
└─────────────────────────────────────────┘
```

## 🚀 Quick Actions

### Create First Employee
1. Login as admin
2. Click "+ Create New Employee"
3. Fill: Name, Email, Password
4. Click "Create Employee"
5. Share credentials with employee

### Assign Employee IDs to Existing Employees
1. Scroll to employee table
2. Click "Assign ID" for each employee
3. Enter ID (e.g., EMP001)
4. Click "Save"

### Monitor Today's Attendance
1. Go to "Filter Attendance Records"
2. Select today's date
3. View all check-ins/check-outs

## 💡 Tips

- Create employees before their first day
- Assign Employee IDs in sequential order
- Use filters to quickly find specific records
- Keep a backup of employee credentials
- Regularly review attendance records

## 🆘 Troubleshooting

**Can't create employee?**
- Check if email already exists
- Verify password is at least 6 characters
- Ensure you're logged in as admin

**Employee ID error?**
- Make sure ID is unique
- Remove any special characters if issues occur
- Leave blank if you want to assign later

**Employee can't login?**
- Verify email is correct
- Check password was shared correctly
- Ensure account was created successfully
