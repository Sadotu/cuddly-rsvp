const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'rsvps.json');
const LOG_FILE = path.join(__dirname, 'rsvp-logs.txt');
const MAX_ATTENDEES = 12;
const EVENT_END_TIME = new Date('2026-02-13T22:00:00'); // 3 hours after event start (19:00)
const LOG_DELETE_TIME = new Date('2026-04-13T19:00:00'); // 2 months after event start

// Log function
async function logAction(action, details) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${action}: ${details}\n`;
    try {
        await fs.appendFile(LOG_FILE, logEntry);
        console.log(logEntry.trim());
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize data file if it doesn't exist
async function initDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify({ confirmed: [], waitlist: [] }, null, 2));
    }
}

// Read RSVPs from file
async function readRSVPs() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading RSVPs:', error);
        return { confirmed: [], waitlist: [] };
    }
}

// Write RSVPs to file
async function writeRSVPs(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing RSVPs:', error);
        throw error;
    }
}

// Check and delete data if event has ended
async function checkAndDeleteExpiredData() {
    const now = new Date();
    if (now >= EVENT_END_TIME) {
        try {
            await fs.writeFile(DATA_FILE, JSON.stringify({ confirmed: [], waitlist: [] }, null, 2));
            await logAction('DATA_DELETED', 'All event data deleted - 3 hours after event end');
            console.log('Event data deleted - event ended more than 3 hours ago');
        } catch (error) {
            console.error('Error deleting expired data:', error);
        }
    }
}

// Check and delete logs if 2 months have passed
async function checkAndDeleteExpiredLogs() {
    const now = new Date();
    if (now >= LOG_DELETE_TIME) {
        try {
            await fs.unlink(LOG_FILE);
            console.log('Logs deleted - 2 months after event');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error deleting log file:', error);
            }
        }
    }
}

// Schedule automatic data deletion
function scheduleDataDeletion() {
    const now = new Date();
    const timeUntilDeletion = EVENT_END_TIME - now;

    if (timeUntilDeletion > 0) {
        console.log(`Data will be automatically deleted at ${EVENT_END_TIME.toLocaleString()}`);
        setTimeout(async () => {
            await checkAndDeleteExpiredData();
        }, timeUntilDeletion);
    } else {
        console.log('Event has already ended. Data deletion check will run on next request.');
    }
}

// Schedule automatic log deletion
function scheduleLogDeletion() {
    const now = new Date();
    if (now >= LOG_DELETE_TIME) {
        console.log('Log deletion time has passed. Logs will be deleted on next check.');
    } else {
        console.log(`Logs will be automatically deleted at ${LOG_DELETE_TIME.toLocaleString()}`);
        // Note: Logs will be checked and deleted on each API request, not via setTimeout
        // This avoids Node.js setTimeout overflow issues with long durations
    }
}

// API Routes

// Get all RSVPs
app.get('/api/rsvps', async (req, res) => {
    try {
        await checkAndDeleteExpiredData();
        await checkAndDeleteExpiredLogs();
        const data = await readRSVPs();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch RSVPs' });
    }
});

// Submit new RSVP
app.post('/api/rsvp', async (req, res) => {
    try {
        await checkAndDeleteExpiredData();

        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const data = await readRSVPs();
        const trimmedName = name.trim();

        const rsvp = {
            name: trimmedName,
            timestamp: new Date().toISOString()
        };

        // Check if there's space in confirmed list
        if (data.confirmed.length < MAX_ATTENDEES) {
            data.confirmed.push(rsvp);
            await writeRSVPs(data);
            await logAction('RSVP_ADDED', `${trimmedName} added to confirmed list`);
            res.json({
                success: true,
                message: 'RSVP confirmed!',
                status: 'confirmed'
            });
        } else {
            // Add to waitlist
            data.waitlist.push(rsvp);
            await writeRSVPs(data);
            await logAction('RSVP_ADDED', `${trimmedName} added to waiting list`);
            res.json({
                success: true,
                message: 'Added to waiting list',
                status: 'waitlist'
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit RSVP' });
    }
});

// Cancel RSVP
app.post('/api/cancel', async (req, res) => {
    try {
        await checkAndDeleteExpiredData();

        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const data = await readRSVPs();
        const trimmedName = name.trim();

        // Check confirmed list
        const confirmedIndex = data.confirmed.findIndex(r =>
            r.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (confirmedIndex !== -1) {
            const cancelled = data.confirmed[confirmedIndex];
            data.confirmed.splice(confirmedIndex, 1);

            // Move first person from waitlist to confirmed if available
            if (data.waitlist.length > 0) {
                const promoted = data.waitlist.shift();
                data.confirmed.push(promoted);
                await writeRSVPs(data);
                await logAction('RSVP_CANCELLED', `${cancelled.name} removed from confirmed list`);
                await logAction('RSVP_PROMOTED', `${promoted.name} promoted from waiting list to confirmed`);
                return res.json({
                    success: true,
                    message: `${cancelled.name} has been removed. ${promoted.name} has been moved from waiting list to confirmed.`,
                    promoted: promoted.name
                });
            }

            await writeRSVPs(data);
            await logAction('RSVP_CANCELLED', `${cancelled.name} removed from confirmed list`);
            return res.json({
                success: true,
                message: `${cancelled.name} has been removed from the RSVP list.`
            });
        }

        // Check waitlist
        const waitlistIndex = data.waitlist.findIndex(r =>
            r.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (waitlistIndex !== -1) {
            const cancelled = data.waitlist[waitlistIndex];
            data.waitlist.splice(waitlistIndex, 1);
            await writeRSVPs(data);
            await logAction('RSVP_CANCELLED', `${cancelled.name} removed from waiting list`);
            return res.json({
                success: true,
                message: `${cancelled.name} has been removed from the waiting list.`
            });
        }

        return res.status(404).json({ error: 'Name not found in RSVP list' });
    } catch (error) {
        console.error('Error cancelling RSVP:', error);
        res.status(500).json({ error: 'Failed to cancel RSVP' });
    }
});

// Verify captcha (simple implementation)
app.post('/api/verify-captcha', (req, res) => {
    // In a real application, you would validate the captcha token here
    // For this demo, we'll just return success
    res.json({ success: true });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
async function startServer() {
    await initDataFile();
    await checkAndDeleteExpiredData();
    await checkAndDeleteExpiredLogs();
    scheduleDataDeletion();
    scheduleLogDeletion();

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Maximum attendees: ${MAX_ATTENDEES}`);
        console.log('Press Ctrl+C to stop the server');
    });
}

startServer();
