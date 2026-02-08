# Cuddly RSVP - Event RSVP Application

A modern event RSVP web application with a cozy green and gray color scheme, featuring a "I'm not a robot" checkbox captcha and persistent backend storage.

## Features

- Clean, responsive design with green/gray gradient theme
- Checkbox-style captcha verification
- Backend API for persistent RSVP storage
- Real-time RSVP list updates
- Mobile-friendly interface

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

### 3. Open in Browser

Navigate to `http://localhost:3000` in your web browser.

## How It Works

- **Frontend**: Single-page application built with vanilla HTML, CSS, and JavaScript
- **Backend**: Express.js server with REST API
- **Storage**: RSVPs are saved to `rsvps.json` file (persists between server restarts)
- **Captcha**: Simple checkbox verification system

## API Endpoints

- `GET /api/rsvps` - Fetch all RSVPs
- `POST /api/rsvp` - Submit a new RSVP (requires `name` in request body)
- `POST /api/verify-captcha` - Verify captcha challenge

## File Structure

```
cuddly rsvp/
├── index.html          # Frontend application
├── server.js           # Backend Express server
├── package.json        # Node.js dependencies
├── rsvps.json          # RSVP data storage (auto-generated)
└── README.md          # This file
```

## Color Scheme

The application uses a cozy color palette inspired by the cuddly couch theme:
- Primary: Darker olive green (#3d5a26 to #4a6b2e)
- Secondary: Soft gray (#6b7280)
- Accent: Forest green (#5a7c3e)

## Notes

- RSVPs are stored locally in `rsvps.json`
- The captcha is a simple verification system (in production, consider using Google reCAPTCHA or similar)
- CORS is enabled for local development
