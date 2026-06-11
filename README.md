# FinTrack - Personal Expense Management System

FinTrack is a full-stack personal expense management system built as a  web application project. It helps users manage income, savings, expenses, balances, and financial records through a responsive dashboard, expense history tools, and analytics views.

The system is designed for everyday personal finance tracking, allowing users to record expenses, monitor monthly balances, analyze spending patterns, and generate weekly, monthly, and yearly financial insights.

## Project Overview

FinTrack provides a simple and organized way to manage personal finances from one place. Users can register, log in, configure their financial profile, add expenses, review transaction history, and analyze expense categories through visual dashboards.

The application includes authentication, profile management, expense tracking, history filters, analytics, and secure password management. The backend currently uses SQLite for local development and is designed to support PostgreSQL for production deployment.

## Features

### User and Authentication

- User registration
- User login and logout
- Password reset flow
- Secure password management
- Password visibility toggle
- Protected application routes

### Profile Management

- User information management
- Annual income configuration
- Current savings tracking
- Financial summary

### Expense Management

- Add expenses
- Edit expenses
- Delete expenses
- Track weekly expense records
- Track monthly expense records
- Track yearly expense records
- View total transaction count

### Dashboard

- Annual income
- Current savings
- Automatically calculated monthly income
- Current month expenses
- Current balance
- Total transactions
- Recent transactions
- Real-time dashboard updates

### History

- Search expenses
- Filter expenses by month
- Filter expenses by year
- Filter expenses by category
- Edit expense records
- Delete expense records

### Analytics

- Expense distribution by category
- Expense category pie chart
- Monthly spending trend analysis
- Category-based analysis

### UI and Experience

- Responsive user interface
- Dashboard-focused financial overview
- Clean navigation across dashboard, analytics, history, profile, and security pages
- Modern React interface styled with Tailwind CSS

## System Workflow

1. User registers a new account.
2. User logs in securely.
3. User sets up financial profile details such as annual income and current savings.
4. User adds income-related details and expense records.
5. Dashboard displays financial summary and recent transactions.
6. User tracks weekly, monthly, and yearly expense records.
7. Analytics page shows spending distribution and trends.
8. History page allows searching, filtering, editing, and deleting expenses.
9. User updates profile and security settings when needed.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Flask, Python |
| Database | SQLite for development, PostgreSQL-ready architecture |
| Authentication | Login, Registration, Logout, Password Reset |
| Charts | Recharts / chart-based analytics UI |
| State Management | React Context API |
| Styling | Tailwind CSS |
| API Communication | REST APIs |

## Project Architecture


React Frontend
  |
  |-- Auth Context
  |-- Expense Data Context
  |-- Dashboard, Analytics, History, Profile, Security Pages
  |
REST API
  |
Flask Backend
  |
  |-- Authentication APIs
  |-- Profile APIs
  |-- Expense APIs
  |-- Analytics APIs
  |
SQLite Database


## Folder Structure


FinTrack/
├─ README.md
├─ LICENSE
├─ setup/
│  ├─ setup.bat
│  └─ start_system.bat
│
├─ backend/
│  ├─ app.py
│  ├─ models.py
│  ├─ requirements.txt
│  └─ smartspend.db
│
├─ frontend/
│  ├─ package.json
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ src/
│     ├─ App.jsx
│     ├─ main.jsx
│     ├─ index.css
│     ├─ pages/
│     │  ├─ DashboardPage.jsx
│     │  ├─ AnalyticsPage.jsx
│     │  ├─ HistoryPage.jsx
│     │  ├─ RecordPage.jsx
│     │  ├─ ProfilePage.jsx
│     │  ├─ LoginPage.jsx
│     │  ├─ RegisterPage.jsx
│     │  ├─ ForgotPasswordPage.jsx
│     │  ├─ ResetPasswordPage.jsx
│     │  └─ SecurityPage.jsx
│     ├─ components/
│     │  ├─ Navbar.jsx
│     │  ├─ Sidebar.jsx
│     │  ├─ ProtectedLayout.jsx
│     │  ├─ PieChartCard.jsx
│     │  ├─ LineChartCard.jsx
│     │  ├─ TrendLineChart.jsx
│     │  ├─ ExpenseTable.jsx
│     │  └─ UploadCard.jsx
│     ├─ context/
│     │  ├─ AuthContext.jsx
│     │  └─ ExpenseDataContext.jsx
│     └─ utils/
│        ├─ api.js
│        ├─ dateUtils.js
│        ├─ expenseAnalytics.js
│        └─ expenseEvents.js
│
└─ Expense_model/
   ├─ data/
   ├─ models/
   ├─ notebooks/
   └─ scripts/


## Installation Guide

### Prerequisites

Make sure the following tools are installed:

- Node.js
- npm
- Python 3.x
- pip
- Git

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:


http://localhost:5173


## Backend Setup


cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py


The backend will run at:


http://localhost:5000


For macOS or Linux, activate the virtual environment with:


source venv/bin/activate


## Running the Project Locally

1. Start the backend server from the `backend` folder.
2. Start the frontend development server from the `frontend` folder.
3. Open the frontend URL in your browser.
4. Register a new account or log in with existing credentials.
5. Configure profile details and begin adding expenses.

## Environment Variables

Create environment files as needed for local or production configuration.

### Frontend

Create a `.env` file inside the `frontend` folder:

VITE_API_BASE_URL=http://localhost:5000


### Backend

Create a `.env` file inside the `backend` folder if your deployment requires custom configuration:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///smartspend.db
```

For production, `DATABASE_URL` can be updated to use PostgreSQL.

## API Modules

The Flask backend provides APIs for:

- Authentication
- User profile management
- Expense records
- Expense history
- Financial analytics
- Security settings

## Database Design

FinTrack currently uses SQLite for local development. The database layer is structured so the application can be migrated to PostgreSQL in production with appropriate configuration changes.

Main data areas include:

- Users
- Profiles
- Income and savings details
- Expense records
- Financial summaries

## Future Enhancements

- PostgreSQL production deployment
- Export reports as PDF or CSV
- Advanced budget planning
- Email-based password recovery
- Cloud deployment
- Role-based access control
- Improved charting and forecasting

## License

This project is licensed under the MIT License.

## Project Status

FinTrack is a  full-stack web application project focused on personal finance tracking, expense analysis, and responsive dashboard-based financial management.
