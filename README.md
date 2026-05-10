# ⚡ ExpertConnect — Real-Time Expert Session Booking System

A full-stack application for booking 1-on-1 sessions with experts. Features real-time slot updates via Socket.io, race condition-safe bookings using MongoDB transactions, and a sleek dark-themed UI.

---

## 🗂 Project Structure

```
expert-booking/
├── backend/                  # Node.js + Express + MongoDB API
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── expertController.js
│   │   └── bookingController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Expert.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── expertRoutes.js
│   │   └── bookingRoutes.js
│   ├── scripts/
│   │   └── seed.js           # Seed 12 mock experts
│   ├── .env.example
│   ├── package.json
│   └── server.js             # Entry point + Socket.io
│
├── frontend/                 # React web app
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js / .css
│   │   │   └── ExpertCard.js / .css
│   │   ├── context/
│   │   │   └── SocketContext.js  # Real-time Socket.io context
│   │   ├── pages/
│   │   │   ├── ExpertsList.js / .css   # Screen 1
│   │   │   ├── ExpertDetail.js / .css  # Screen 2 (real-time slots)
│   │   │   ├── BookingForm.js / .css   # Screen 3
│   │   │   └── MyBookings.js / .css    # Screen 4
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── utils/
│   │   │   └── api.js        # Axios instance + all API calls
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── package.json              # Root: run both servers together
├── .gitignore
└── README.md
```

---

## ✅ Prerequisites

Make sure you have these installed:

| Tool | Version | Check |
|------|---------|-------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 9.x | `npm --version` |
| MongoDB | ≥ 6.x | `mongod --version` |
| Git | any | `git --version` |

### Install MongoDB (if not installed)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
Download the installer from https://www.mongodb.com/try/download/community

---

## 🚀 Setup — Step by Step

### Step 1: Clone / Download the project

```bash
# If using git
git clone <your-repo-url>
cd expert-booking

# Or if you downloaded a ZIP, extract it and cd into it
cd expert-booking
```

### Step 2: Install all dependencies

```bash
# Option A — Install everything at once from root
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Option B — Use the root script (installs root + backend + frontend)
npm run install:all
```

### Step 3: Set up Backend environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and set your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expert-booking
NODE_ENV=development
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> **Note:** If your MongoDB requires authentication, update MONGODB_URI like:
> `mongodb://username:password@localhost:27017/expert-booking`

### Step 4: Set up Frontend environment variables

```bash
cd frontend
cp .env.example .env
```

`frontend/.env` contents (defaults work for local dev):

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Step 5: Seed the database with 12 expert profiles

```bash
# From the backend folder
cd backend
npm run seed

# Or from root
npm run seed
```

You should see:
```
✅ MongoDB Connected: localhost
Cleared existing experts
✅ Seeded 12 experts successfully
```

### Step 6: Start the servers

**Option A — Run both servers together from root:**
```bash
# From the root expert-booking/ folder
npm run dev
```

**Option B — Run separately (two terminal windows):**

Terminal 1 — Backend:
```bash
cd backend
npm run dev
```

Terminal 2 — Frontend:
```bash
cd frontend
npm start
```

### Step 7: Open the app

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health check:** http://localhost:5000/api/health

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/experts` | List experts (pagination + filter + search) |
| GET | `/api/experts/categories` | Get all categories |
| GET | `/api/experts/:id` | Get expert detail with availability |
| POST | `/api/bookings` | Create a booking (race-condition safe) |
| GET | `/api/bookings?email=` | Get bookings by user email |
| PATCH | `/api/bookings/:id/status` | Update booking status |

### Example API calls (curl)

```bash
# Get all experts
curl http://localhost:5000/api/experts

# Search + filter
curl "http://localhost:5000/api/experts?search=priya&category=Technology&page=1&limit=8"

# Get expert by ID
curl http://localhost:5000/api/experts/<expert_id>

# Create a booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "expertId": "<expert_id>",
    "userName": "Rahul Kumar",
    "userEmail": "rahul@example.com",
    "userPhone": "+91 9876543210",
    "date": "2025-06-15",
    "timeSlot": "10:00",
    "notes": "Want to discuss system design"
  }'

# Get my bookings
curl "http://localhost:5000/api/bookings?email=rahul@example.com"

# Update booking status
curl -X PATCH http://localhost:5000/api/bookings/<booking_id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Confirmed"}'
```

---

## ⚡ Real-Time Features (Socket.io)

The app uses **Socket.io** for live slot updates:

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-expert-room` | Client → Server | Subscribe to an expert's slot updates |
| `leave-expert-room` | Client → Server | Unsubscribe from updates |
| `slot-booked` | Server → Client | Emitted when a slot gets booked |
| `slot-freed` | Server → Client | Emitted when a booking is cancelled |

When you're on an Expert Detail page or Booking Form, the app automatically joins that expert's room and updates slot availability in real-time without any page refresh.

---

## 🔒 Race Condition Prevention

Double-booking is prevented at **three levels**:

1. **MongoDB Compound Unique Index** — `{ expert, date, timeSlot }` with unique constraint (partial: excludes Cancelled bookings)

2. **Atomic findOneAndUpdate** — The slot is marked as booked atomically using array filters with `isBooked: false` as a condition. If another request already booked it, this returns `null` and the transaction aborts.

3. **MongoDB Session Transaction** — The slot marking + booking creation happen inside a single ACID transaction. If any step fails, everything rolls back.

---

## 🖥 Application Screens

### 1. Expert Listing (`/`)
- Grid of expert cards with photo, name, category, rating, experience, skills
- Search by name/skill (debounced 400ms)
- Filter by category (Technology, Business, Design, etc.)
- Sort by rating / experience / price / name
- Pagination (8 per page)
- Loading skeletons + error/empty states

### 2. Expert Detail (`/experts/:id`)
- Full expert profile with bio, skills, languages, stats
- Available dates shown as scrollable tabs
- Time slots shown as a grid — green = available, grey = booked
- 🔴 LIVE badge — slots update in real-time via Socket.io
- "Book a Session" button

### 3. Booking Form (`/book/:expertId`)
- Fields: Name, Email, Phone, Date (dropdown), Time Slot (visual picker), Notes
- Time slots update live while you're filling the form
- If someone books your selected slot, it deselects and shows a warning toast
- Full client-side + server-side validation
- Success screen with booking summary after confirmation

### 4. My Bookings (`/my-bookings`)
- Enter email to fetch all bookings
- Filter by status: Pending / Confirmed / Completed / Cancelled
- Cancel pending bookings (frees the slot in real-time)
- Pre-fills email from URL query param

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, react-hot-toast |
| Real-time | Socket.io (client + server) |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Dev Tools | nodemon, concurrently |

---

## ❓ Troubleshooting

**MongoDB connection fails:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod        # Linux
brew services list | grep mongodb  # macOS

# Start it
sudo systemctl start mongod        # Linux
brew services start mongodb-community  # macOS
```

**Port 5000 already in use:**
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows (then taskkill /PID <pid> /F)

# Or just change PORT in backend/.env
PORT=5001
```

**Port 3000 already in use:**
```bash
# React will ask if you want to use another port — press Y
# Or set it manually in frontend/.env:
PORT=3001
```

**Frontend can't connect to backend:**
- Make sure backend is running on port 5000
- Check `frontend/.env` has the correct `REACT_APP_API_URL`
- Check browser console for CORS errors

**`npm run seed` fails:**
- Make sure MongoDB is running first
- Make sure `backend/.env` has the correct `MONGODB_URI`

---

## 📦 Deployment (Optional)

### Backend — Railway / Render / Heroku
1. Push code to GitHub
2. Connect repo to Railway/Render
3. Set environment variables (same as `.env`)
4. Set start command: `node server.js`

### Frontend — Vercel / Netlify
1. Push frontend folder to GitHub
2. Connect to Vercel/Netlify
3. Set build command: `npm run build`
4. Set `REACT_APP_API_URL` to your deployed backend URL
5. Set `REACT_APP_SOCKET_URL` to your deployed backend URL

### MongoDB — MongoDB Atlas (Free Tier)
1. Create account at https://www.mongodb.com/atlas
2. Create a free M0 cluster
3. Get the connection string
4. Replace `MONGODB_URI` in backend env with Atlas connection string

---

## 👨‍💻 Author

Built for the Real-Time Expert Session Booking System internship assignment.

**Key features implemented:**
- ✅ Expert listing with search, filter, pagination
- ✅ Expert detail with real-time slot availability
- ✅ Booking form with validation
- ✅ My bookings with status tracking
- ✅ Socket.io real-time updates
- ✅ Race condition prevention (MongoDB transactions + atomic updates)
- ✅ Proper error handling & validation
- ✅ Environment variable configuration
- ✅ Rate limiting & security headers
