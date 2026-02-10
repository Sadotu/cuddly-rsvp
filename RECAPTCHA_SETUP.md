# Google reCAPTCHA v2 Setup Instructies

## ⚠️ Huidige Status: reCAPTCHA is UITGESCHAKELD

De reCAPTCHA functionaliteit is momenteel uitgeschakeld maar volledig geïmplementeerd en klaar voor gebruik. Volg de onderstaande stappen om het in te schakelen wanneer nodig.

---

## Stap 1: reCAPTCHA Keys Aanmaken

1. Ga naar [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)
2. Log in met je Google account
3. Vul het formulier in:
   - **Label**: `Cuddly RSVP` (of een naam naar keuze)
   - **reCAPTCHA type**: Selecteer **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Voeg je domein toe (bijv. `localhost` voor lokaal testen, of `jouwdomein.com` voor productie)
   - Accepteer de servicevoorwaarden
4. Klik op **Submit**
5. Je krijgt nu twee keys:
   - **Site Key** (publiek, wordt gebruikt in de frontend)
   - **Secret Key** (privé, wordt gebruikt voor backend verificatie)

## Stap 2: reCAPTCHA Inschakelen in index.html

### A. Uncomment het reCAPTCHA script (regel ~8)
Zoek naar:
```html
<!-- <script src="https://www.google.com/recaptcha/api.js" async defer></script> -->
```

Verwijder de comment tekens:
```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

### B. Zet de RECAPTCHA_ENABLED flag op true (regel ~635)
Zoek naar:
```javascript
const RECAPTCHA_ENABLED = false; // Change to true when you want to enable reCAPTCHA
```

Verander naar:
```javascript
const RECAPTCHA_ENABLED = true; // Change to true when you want to enable reCAPTCHA
```

### C. Verwijder display:none van de captcha containers (regel ~553 en ~594)
Zoek naar beide captcha containers en verwijder `display: none;`:

**RSVP formulier (regel ~553):**
```html
<!-- Was: -->
<div class="captcha-container" style="display: none;">

<!-- Wordt: -->
<div class="captcha-container">
```

**Cancel modal (regel ~594):**
```html
<!-- Was: -->
<div class="captcha-container" style="margin-bottom: 20px; display: none;">

<!-- Wordt: -->
<div class="captcha-container" style="margin-bottom: 20px;">
```

### D. Voeg je Site Key toe
Zoek naar `YOUR_RECAPTCHA_SITE_KEY_HERE` (komt 2x voor) en vervang beide met je **Site Key**:

```html
<!-- RSVP formulier captcha -->
<div class="g-recaptcha" data-sitekey="JE_SITE_KEY_HIER" data-callback="onRecaptchaSuccess"></div>

<!-- Cancel RSVP modal captcha -->
<div class="g-recaptcha" id="cancelRecaptcha" data-sitekey="JE_SITE_KEY_HIER" data-callback="onCancelRecaptchaSuccess"></div>
```

## Stap 3: Backend Verificatie Instellen (Belangrijk!)

**LET OP**: De huidige implementatie verifieert de reCAPTCHA alleen in de frontend. Dit is **niet veilig** omdat bots dit kunnen omzeilen. Voor echte beveiliging moet je de reCAPTCHA response ook in de backend verifiëren.

### Optie A: Supabase Edge Function (Aanbevolen)

1. Maak een Supabase Edge Function:

```bash
supabase functions new verify-recaptcha
```

2. In `supabase/functions/verify-recaptcha/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { recaptchaResponse } = await req.json()

  const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify'
  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=JE_SECRET_KEY_HIER&response=${recaptchaResponse}`
  })

  const data = await response.json()

  return new Response(
    JSON.stringify({ success: data.success }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

3. Deploy de function:

```bash
supabase functions deploy verify-recaptcha
```

4. Pas de JavaScript in `index.html` aan om de Edge Function aan te roepen voordat je de RSVP opslaat:

```javascript
// In de submit handler, na het ophalen van recaptchaResponse
const verifyResult = await fetch('https://JE_SUPABASE_URL/functions/v1/verify-recaptcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recaptchaResponse })
});

const { success } = await verifyResult.json();
if (!success) {
    showMessage('reCAPTCHA verification failed. Please try again.', 'error');
    return;
}

// Ga verder met RSVP opslaan...
```

### Optie B: Row Level Security (RLS) met Postgres Function

Als je geen Edge Functions wilt gebruiken, kun je ook een Postgres function maken die de verificatie doet via Supabase's `http` extension, maar dit is complexer.

## Stap 4: Testen

### Lokaal testen:
1. Voeg `localhost` toe aan je reCAPTCHA domains in de Google console
2. Open `index.html` in je browser
3. Test beide captcha's:
   - RSVP formulier captcha
   - Cancel RSVP modal captcha

### Test URLs:
- **Lokaal**: `http://localhost` of `http://127.0.0.1`
- **Productie**: Je eigen domein

## Stap 5: Domain Whitelist Uitbreiden

Als je app op meerdere domeinen draait:
1. Ga terug naar de [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Klik op je site
3. Voeg extra domeinen toe onder **Domains**

## Beveiligingstips

✅ **WEL doen:**
- Secret Key NOOIT in de frontend code zetten
- Altijd backend verificatie implementeren
- Secret Key in environment variables opslaan

❌ **NIET doen:**
- Secret Key committen naar GitHub
- Alleen frontend verificatie gebruiken
- Dezelfde keys gebruiken voor development en productie

## Troubleshooting

**Captcha wordt niet geladen:**
- Controleer of de reCAPTCHA script in de `<head>` staat
- Controleer je browser console voor errors
- Verifieer dat je domain in de whitelist staat

**"Invalid site key" error:**
- Controleer of je de juiste Site Key hebt ingevoerd
- Verifieer dat het domain klopt

**Captcha succesvol maar submit werkt niet:**
- Controleer je browser console voor JavaScript errors
- Verifieer dat de callback functie correct is ingesteld

## Huidige Status

✅ Frontend implementatie compleet
✅ reCAPTCHA v2 widgets toegevoegd aan beide formulieren (RSVP + Cancel modal)
✅ Feature toggle geïmplementeerd (RECAPTCHA_ENABLED flag)
⚠️ reCAPTCHA is momenteel UITGESCHAKELD - volg Stap 2 om in te schakelen
⚠️ Backend verificatie moet nog geïmplementeerd worden voor echte beveiliging (zie Stap 3)

## Snelle Samenvatting

**Om reCAPTCHA in te schakelen:**
1. Maak reCAPTCHA keys aan op https://www.google.com/recaptcha/admin/create
2. In `index.html`:
   - Uncomment de reCAPTCHA script tag (regel ~8)
   - Zet `RECAPTCHA_ENABLED = true` (regel ~635)
   - Verwijder `display: none;` van beide captcha containers (regel ~553 en ~594)
   - Vervang `YOUR_RECAPTCHA_SITE_KEY_HERE` met je Site Key (2x)
3. (Optioneel maar sterk aanbevolen) Implementeer backend verificatie via Supabase Edge Function

## Extra Resources

- [reCAPTCHA v2 Documentatie](https://developers.google.com/recaptcha/docs/display)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [reCAPTCHA FAQ](https://developers.google.com/recaptcha/docs/faq)
