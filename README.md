# Job & Internship Tracker

A modern application tracker with MongoDB Atlas and Excel export.

## Features

- 📋 Track job and internship applications
- 🔄 7 status stages: Saved → Applied → Phone Screen → Interview → Offer/Rejected/Withdrawn
- 📊 Dashboard with stats (Total, Active, Interviews, Offers)
- 🍃 MongoDB Atlas with Mongoose
- 📥 Export to Excel (.xlsx)
- 🎨 Dark theme UI

## Quick Start

```bash
cd C:\projects\job-tracker
npm install
npm run dev
```

This will start both:
- **Backend server** on http://localhost:3001
- **Frontend app** on http://localhost:5173

## Your MongoDB Setup

- **Cluster**: Cluster0
- **Database**: job_tracker
- **Collection**: applications
- **Connection**: Already configured in `.env`

## Project Structure

```
job-tracker/
├── server.js          # Express + Mongoose backend
├── JobTracker.jsx     # React frontend component
├── .env               # MongoDB connection string
├── package.json
├── vite.config.js
└── src/
    └── main.jsx
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/applications | Get all applications |
| POST | /api/applications | Create new application |
| PUT | /api/applications/:id | Update application |
| DELETE | /api/applications/:id | Delete application |

## Tech Stack

- React 18 + Vite
- Express.js
- Mongoose (MongoDB)
- SheetJS (xlsx) for Excel export
