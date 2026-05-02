# 🤝 Solidarity — Community Campaigns & Volunteering Platform

A modern full-stack web application for managing solidarity campaigns and volunteering activities.

---

## 🧱 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite                   |
| Styling    | Tailwind CSS                      |
| Backend    | Node.js + Express.js              |
| Database   | MySQL                             |
| Auth       | JWT + bcrypt                      |
| HTTP       | Axios (with interceptors)         |
| Toasts     | react-hot-toast                   |

---

## 📁 Project Structure

```
solidarity/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx          # Page wrapper with Navbar + Footer
│   │   │   │   ├── Navbar.jsx          # Sticky responsive navbar
│   │   │   │   └── ProtectedRoute.jsx  # Auth guard HOC
│   │   │   └── ui/
│   │   │       ├── Badge.jsx           # Status badge
│   │   │       ├── Button.jsx          # Reusable button (variants + sizes)
│   │   │       ├── CampaignCard.jsx    # Campaign grid card
│   │   │       ├── Card.jsx            # Generic card container
│   │   │       ├── Input.jsx           # Input with label, error, show/hide
│   │   │       └── Skeleton.jsx        # Loading skeletons
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # Global auth state (React Context)
│   │   ├── hooks/
│   │   │   └── index.js                # useCampaigns, useCampaign, useForm
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx       # Sign in with remember me
│   │   │   │   └── RegisterPage.jsx    # Registration + password strength
│   │   │   └── public/
│   │   │       ├── HomePage.jsx        # Campaign list + search + filter
│   │   │       ├── CampaignDetailPage.jsx  # Campaign + missions detail
│   │   │       └── NotFoundPage.jsx    # 404
│   │   ├── services/
│   │   │   └── api.js                  # Axios instance + API functions
│   │   ├── utils/
│   │   │   └── helpers.js              # Date formatting, status config
│   │   ├── App.jsx                     # Route definitions
│   │   ├── main.jsx                    # Entry point
│   │   └── index.css                   # Tailwind + global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                     # Node.js + Express backend
    ├── config/
    │   └── database.js             # MySQL connection pool
    ├── controllers/
    │   ├── authController.js       # register, login, getMe
    │   └── campaignController.js   # getAllCampaigns, getById, create
    ├── middleware/
    │   ├── auth.js                 # JWT authenticate + authorize
    │   └── errorHandler.js        # Global error + 404 handler
    ├── models/
    │   ├── User.js                 # User queries + bcrypt
    │   └── Campaign.js             # Campaign + Mission queries
    ├── routes/
    │   ├── auth.js                 # /api/auth/*
    │   └── campaigns.js            # /api/campaigns/*
    ├── index.js                    # Express app entry point
    ├── .env                        # Environment variables
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MySQL ≥ 8

### 1. Set up the database

Run the SQL schema (provided separately) in your MySQL client:

```bash
mysql -u root -p < schema.sql
```

### 2. Configure environment

Edit `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=solidarity_app
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Install & run the backend

```bash
cd server
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### 4. Install & run the frontend

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔌 API Reference

### Auth

| Method | Endpoint              | Body                                      | Auth |
|--------|-----------------------|-------------------------------------------|------|
| POST   | `/api/auth/register`  | name, email, password, confirmPassword, phone? | ❌ |
| POST   | `/api/auth/login`     | email, password                           | ❌   |
| GET    | `/api/auth/me`        | —                                         | ✅   |

### Campaigns

| Method | Endpoint               | Query Params                  | Auth              |
|--------|------------------------|-------------------------------|-------------------|
| GET    | `/api/campaigns`       | status, search, page, limit   | ❌                |
| GET    | `/api/campaigns/:id`   | —                             | ❌                |
| POST   | `/api/campaigns`       | (body: campaign fields)       | ✅ organizer/admin|

---

## 🔐 Authentication Flow

1. User registers → server hashes password with bcrypt → returns JWT
2. User logs in → JWT stored in `localStorage`
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request
4. Server middleware verifies JWT on protected routes
5. On 401 → token cleared → redirect to `/login`

---

## 🎨 Design System

- **Font**: Syne (display) + Plus Jakarta Sans (body)
- **Primary color**: Emerald green (`#059669`)
- **Border radius**: `xl` (12px) / `2xl` (16px)
- **Shadows**: Soft multi-layer card shadows
- **Motion**: Fade-in + slide-up animations on page load

---

## 📦 Available Scripts

### Client
```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Server
```bash
npm run dev      # Start with nodemon (hot reload)
npm start        # Start without hot reload
```

---

## 🧩 Extending the Project

The architecture is designed to scale easily:

- **New routes**: Add controller → model → route → register in `index.js`
- **New pages**: Add page component → register route in `App.jsx`
- **New API calls**: Add function in `src/services/api.js`
- **New hooks**: Add to `src/hooks/index.js`

Suggested next features:
- Volunteer application management dashboard
- Donation tracking UI
- Admin panel for campaign management
- Email verification flow
- Real-time notifications with WebSockets
