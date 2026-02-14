// CONFIGURATION - Replace with your Supabase credentials
const SUPABASE_URL = 'https://dlgryeefywbqojjhutde.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZ3J5ZWVmeXdicW9qamh1dGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzEwOTUsImV4cCI6MjA4NjE0NzA5NX0.AuFvSxBDWRN72FKtxr4kdnRylpfdlxMgvw-G7yHeEKo';
const MAX_ATTENDEES = 12;

// Initialize Supabase client
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const rsvpButton = document.getElementById('rsvpButton');
const rsvpForm = document.getElementById('rsvpForm');
const rsvpFormElement = document.getElementById('rsvpFormElement');
const cancelButton = document.getElementById('cancelButton');
const nameInput = document.getElementById('nameInput');
const submitButton = document.getElementById('submitButton');
const message = document.getElementById('message');
const rsvpItems = document.getElementById('rsvpItems');
const rsvpCount = document.getElementById('rsvpCount');
const waitlistSection = document.getElementById('waitlistSection');
const waitlistItems = document.getElementById('waitlistItems');
const waitlistCount = document.getElementById('waitlistCount');
const confirmModal = document.getElementById('confirmModal');
const confirmName = document.getElementById('confirmName');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

// reCAPTCHA flags - Set to true to disable captcha verification
const RECAPTCHA_ENABLED = false; // Change to true when you want to enable reCAPTCHA

let rsvpCaptchaVerified = false;
let cancelCaptchaVerified = false;
let nameToCancel = null;

// reCAPTCHA callback for RSVP form
window.onRecaptchaSuccess = function() {
    rsvpCaptchaVerified = true;
    submitButton.disabled = false;
};

// reCAPTCHA callback for Cancel modal
window.onCancelRecaptchaSuccess = function() {
    cancelCaptchaVerified = true;
    confirmYes.disabled = false;
};

// Show message
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type} active`;
    setTimeout(() => {
        message.classList.remove('active');
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fetch RSVPs from Supabase
async function fetchRSVPs() {
    try {
        const { data, error } = await client
            .from('rsvps')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const confirmed = data.filter(r => r.status === 'confirmed');
        const waitlist = data.filter(r => r.status === 'waitlist');

        updateRSVPList(confirmed, waitlist);
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        showMessage('Failed to load RSVPs. Please refresh the page.', 'error');
    }
}

// Update RSVP list
function updateRSVPList(confirmed, waitlist) {
    // Update confirmed list
    if (confirmed.length === 0) {
        rsvpItems.innerHTML = '<li class="empty-state">No RSVPs yet. Be the first to respond!</li>';
        rsvpCount.textContent = '0 guests attending';
    } else {
        const plural = confirmed.length === 1 ? 'guest' : 'guests';
        const remaining = MAX_ATTENDEES - confirmed.length;
        const spotsText = remaining > 0 ? ` (${remaining} spots remaining)` : ' (FULL)';
        rsvpCount.textContent = `${confirmed.length} ${plural} attending${spotsText}`;

        rsvpItems.innerHTML = confirmed.map(rsvp => `
            <li class="rsvp-item">
                <span class="rsvp-item-icon">✓</span>
                <span class="rsvp-item-name">${escapeHtml(rsvp.name)}</span>
                <button class="cancel-rsvp-btn" onclick="showCancelConfirm('${escapeHtml(rsvp.name).replace(/'/g, "\\'")}', ${rsvp.id})">Cancel RSVP</button>
            </li>
        `).join('');
    }

    // Update waiting list
    if (waitlist && waitlist.length > 0) {
        waitlistSection.style.display = 'block';
        const plural = waitlist.length === 1 ? 'person' : 'people';
        waitlistCount.textContent = `${waitlist.length} ${plural} on waiting list`;

        waitlistItems.innerHTML = waitlist.map(rsvp => `
            <li class="rsvp-item">
                <span class="rsvp-item-icon">⏳</span>
                <span class="rsvp-item-name">${escapeHtml(rsvp.name)}</span>
                <button class="cancel-rsvp-btn" onclick="showCancelConfirm('${escapeHtml(rsvp.name).replace(/'/g, "\\'")}', ${rsvp.id})">Cancel RSVP</button>
            </li>
        `).join('');
    } else {
        waitlistSection.style.display = 'none';
    }
}

// Show RSVP form
rsvpButton.addEventListener('click', () => {
    rsvpForm.classList.add('active');
    nameInput.focus();
    rsvpButton.style.display = 'none';
    // If captcha is disabled, enable submit button immediately
    if (!RECAPTCHA_ENABLED) {
        submitButton.disabled = false;
    }
});

// Hide RSVP form
cancelButton.addEventListener('click', () => {
    rsvpForm.classList.remove('active');
    rsvpFormElement.reset();
    message.classList.remove('active');
    rsvpButton.style.display = 'block';
    rsvpCaptchaVerified = false;
    submitButton.disabled = RECAPTCHA_ENABLED; // Only disable if captcha is enabled
    if (RECAPTCHA_ENABLED && typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
    }
});

// Handle form submission
rsvpFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();

    if (!name) {
        showMessage('Please enter your name.', 'error');
        return;
    }

    // Only check reCAPTCHA if it's enabled
    if (RECAPTCHA_ENABLED) {
        if (!rsvpCaptchaVerified) {
            showMessage('Please complete the reCAPTCHA verification.', 'error');
            return;
        }

        // Get reCAPTCHA response token
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            showMessage('Please complete the reCAPTCHA verification.', 'error');
            return;
        }
    }

    try {
        // Get current count
        const { data: existingRSVPs, error: countError } = await client
            .from('rsvps')
            .select('status');

        if (countError) throw countError;

        const confirmedCount = existingRSVPs.filter(r => r.status === 'confirmed').length;
        const status = confirmedCount < MAX_ATTENDEES ? 'confirmed' : 'waitlist';

        // Insert RSVP
        const { error: insertError } = await client
            .from('rsvps')
            .insert([{ name, status }]);

        if (insertError) throw insertError;

        // Show success message
        if (status === 'confirmed') {
            showMessage(`Thank you, ${name}! Your RSVP has been confirmed.`, 'success');
        } else {
            showMessage(`Thank you, ${name}! You've been added to the waiting list.`, 'success');
        }

        // Refresh RSVP list
        await fetchRSVPs();

        // Reset form and hide after delay
        setTimeout(() => {
            rsvpForm.classList.remove('active');
            rsvpFormElement.reset();
            message.classList.remove('active');
            rsvpButton.style.display = 'block';
            rsvpCaptchaVerified = false;
            submitButton.disabled = RECAPTCHA_ENABLED; // Only disable if captcha is enabled
            if (RECAPTCHA_ENABLED && typeof grecaptcha !== 'undefined') {
                grecaptcha.reset();
            }
        }, 2000);
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        showMessage('Failed to submit RSVP. Please try again.', 'error');
    }
});

// Show cancel confirmation (global function for onclick)
window.showCancelConfirm = function(name, id) {
    nameToCancel = { name, id };
    confirmName.textContent = name;
    confirmModal.classList.add('active');
    cancelCaptchaVerified = false;
    confirmYes.disabled = RECAPTCHA_ENABLED; // Only disable if captcha is enabled
    // Reset the cancel reCAPTCHA if enabled
    if (RECAPTCHA_ENABLED && typeof grecaptcha !== 'undefined') {
        setTimeout(() => {
            grecaptcha.reset(1); // Widget ID 1 for the cancel modal
        }, 100);
    }
};

// Handle confirmation Yes
confirmYes.addEventListener('click', async () => {
    if (!nameToCancel) return;

    // Only check reCAPTCHA if it's enabled
    if (RECAPTCHA_ENABLED && !cancelCaptchaVerified) {
        showMessage('Please complete the reCAPTCHA verification.', 'error');
        return;
    }

    try {
        // Delete the RSVP
        const { error: deleteError } = await client
            .from('rsvps')
            .delete()
            .eq('id', nameToCancel.id);

        if (deleteError) throw deleteError;

        // Check if we need to promote someone from waitlist
        const { data: waitlistData, error: waitlistError } = await client
            .from('rsvps')
            .select('*')
            .eq('status', 'waitlist')
            .order('created_at', { ascending: true })
            .limit(1);

        if (waitlistError) throw waitlistError;

        const { data: confirmedData, error: confirmedError } = await client
            .from('rsvps')
            .select('*')
            .eq('status', 'confirmed');

        if (confirmedError) throw confirmedError;

        // If there's someone on waitlist and space in confirmed, promote them
        if (waitlistData.length > 0 && confirmedData.length < MAX_ATTENDEES) {
            const { error: updateError } = await client
                .from('rsvps')
                .update({ status: 'confirmed' })
                .eq('id', waitlistData[0].id);

            if (updateError) throw updateError;

            showMessage(`${nameToCancel.name} has been removed. ${waitlistData[0].name} has been moved from waiting list to confirmed.`, 'success');
        } else {
            showMessage(`${nameToCancel.name} has been removed from the RSVP list.`, 'success');
        }

        // Refresh RSVP list
        await fetchRSVPs();

        // Close modal
        confirmModal.classList.remove('active');
        nameToCancel = null;
    } catch (error) {
        console.error('Error cancelling RSVP:', error);
        showMessage('Failed to cancel RSVP. Please try again.', 'error');
        confirmModal.classList.remove('active');
    }
});

// Handle confirmation No
confirmNo.addEventListener('click', () => {
    confirmModal.classList.remove('active');
    nameToCancel = null;
    cancelCaptchaVerified = false;
    confirmYes.disabled = RECAPTCHA_ENABLED; // Only disable if captcha is enabled
});

// Close modal on background click
confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        confirmModal.classList.remove('active');
        nameToCancel = null;
        cancelCaptchaVerified = false;
        confirmYes.disabled = RECAPTCHA_ENABLED; // Only disable if captcha is enabled
    }
});

// Subscribe to real-time changes
client
    .channel('rsvps-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, () => {
        fetchRSVPs();
    })
    .subscribe();

// Initialize
fetchRSVPs();