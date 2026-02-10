# Cuddly RSVP - Event RSVP Application

A modern event RSVP web application with a cozy green and gray color scheme, featuring a "I'm not a robot" checkbox captcha and Supabase backend for real-time updates.

## Features

- Clean, responsive design with green/gray gradient theme
- Checkbox-style captcha verification
- Maximum 12 confirmed attendees with automatic waiting list
- Real-time RSVP list updates across all devices
- Easy cancellation with confirmation modal
- Mobile-friendly interface
- Supabase backend for persistent storage

## Setup Instructions

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete setup instructions.

## Quick Start

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase project
3. Configure your Supabase credentials in `index.html` (lines 606-607)
4. Deploy to GitHub Pages or open `index.html` locally

## How It Works

- **Frontend**: Single-page application built with vanilla HTML, CSS, and JavaScript
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Storage**: RSVPs are saved to Supabase database with automatic sync
- **Captcha**: Simple checkbox verification system

## Features

- Maximum capacity of 12 confirmed attendees
- Automatic waiting list when event is full
- Real-time updates using Supabase subscriptions
- Cancel RSVP with confirmation dialog
- Automatic promotion from waiting list when spots open

## File Structure

```
cuddly rsvp/
├── index.html              # Frontend application with Supabase integration
├── supabase-schema.sql     # Database schema for Supabase
├── server.js               # Legacy Express server (not used)
├── package.json            # Node.js dependencies (not needed for deployment)
├── SUPABASE_SETUP.md       # Detailed setup instructions
├── README-GITHUB.md        # GitHub-specific documentation
└── README.md               # This file
```

## Color Scheme

The application uses a cozy color palette inspired by the cuddly couch theme:
- Primary: Darker olive green (#3d5a26 to #4a6b2e)
- Secondary: Soft gray (#6b7280)
- Accent: Forest green (#5a7c3e)

## Notes

- RSVPs are stored in Supabase PostgreSQL database
- The captcha is a simple verification system (for production, consider using Google reCAPTCHA or similar)
- Real-time updates use Supabase's WebSocket subscriptions
- No backend server needed - static hosting on GitHub Pages works perfectly
