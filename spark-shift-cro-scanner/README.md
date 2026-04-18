# Spark & Shift CRO Scanner

Een webapp die digitale uitingen (website, e-mail, WhatsApp, SMS, advertenties) analyseert op 35 gedragstactieken uit het Spark & Shift CRO-framework. Bezoekers krijgen 2 gratis scans met lead capture, daarna een upsell naar een eigen API-sleutel of een gesprek met Patricia.

## Wat kan de app

- **4 input-modi**: URL, screenshot, e-mail, WhatsApp/SMS, vrije tekst
- **Output**: score 0-100, alle 35 tactieken gescoord, top quick wins, 3+ A/B-testvoorstellen, ethische check
- **Actie-knoppen**: `✍ Schrijf voor me uit`, `🚀 Herschrijf hele uiting`, 3 alternatieve varianten per A/B-test
- **Lead capture**: elke gratis scan vraagt naam + e-mail, gegevens gaan naar jouw webhook
- **Rate limiting**: 2 gratis scans per IP per 24 uur, dan upsell-modal
- **Hybride**: bezoekers met eigen Anthropic-sleutel scannen onbeperkt zonder lead capture

## Bestandsstructuur

```
spark-shift-cro-scanner/
├── api/
│   ├── scan.js           # Analyse-endpoint (proxy naar Anthropic, met rate limit)
│   └── optimize.js       # Follow-up calls voor schrijfacties
├── public/
│   └── index.html        # De app zelf, één bestand
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

## Eerste keer deployen: stap voor stap

### 1. GitHub-account (eenmalig)
Heb je nog geen GitHub-account? Maak er een aan op [github.com](https://github.com). Duurt 2 minuten.

### 2. Upload de code naar GitHub
Makkelijkste manier via de website:
1. Log in op [github.com](https://github.com)
2. Klik rechtsbovenin op **+** → **New repository**
3. Naam: `spark-shift-cro-scanner`, laat privé of maak hem publiek, klik **Create repository**
4. Klik op **uploading an existing file**
5. Sleep alle bestanden uit `/Users/patriciaheemskerk/Claude/spark-shift-cro-scanner/` naar het uploadvak (inclusief submappen `api/` en `public/`)
6. Klik **Commit changes**

### 3. Vercel-account + deploy
1. Ga naar [vercel.com](https://vercel.com)
2. Klik **Sign Up** en kies **Continue with GitHub**. Vercel koppelt meteen met je GitHub.
3. Klik **Add New → Project**
4. Kies je `spark-shift-cro-scanner` repo en klik **Import**
5. Laat alle defaults staan, maar scroll naar **Environment Variables** en voeg toe:
   - `ANTHROPIC_API_KEY` = jouw eigen Anthropic API-sleutel (uit [console.anthropic.com](https://console.anthropic.com/settings/keys))
   - `LEAD_WEBHOOK_URL` (optioneel) = je webhook URL voor leads (zie hieronder)
6. Klik **Deploy**

Na 30 seconden is hij live op een URL zoals `spark-shift-cro-scanner.vercel.app`.

### 4. Koppel je eigen domein (scanner.kusvaninvloed.nl)
1. Ga in Vercel naar je project → **Settings → Domains**
2. Typ `scanner.kusvaninvloed.nl` en klik **Add**
3. Vercel toont een CNAME-record dat je moet toevoegen aan je DNS
4. Log in bij je domeinbeheer (waar kusvaninvloed.nl is geregistreerd, bijv. TransIP, Versio, Mijndomein)
5. Voeg een CNAME-record toe:
   - **Host**: `scanner`
   - **Type**: CNAME
   - **Value**: `cname.vercel-dns.com`
6. Wacht 5-60 minuten. Vercel detecteert het automatisch en stelt SSL in.
7. Klaar: je scanner staat op [https://scanner.kusvaninvloed.nl](https://scanner.kusvaninvloed.nl)

## Lead capture instellen

Leads worden standaard gelogd in Vercel console (Dashboard → Functions → Logs). Om ze automatisch ergens binnen te krijgen, stel een webhook in:

**Optie 1: Zapier / Make.com**
1. Maak een Zap/Scenario met trigger "Webhooks → Catch Hook"
2. Kopieer de webhook URL
3. Zet hem in Vercel bij **Settings → Environment Variables** als `LEAD_WEBHOOK_URL`
4. Verbind met je e-mailmarketingtool (ActiveCampaign, Mailchimp, Brevo)

**Optie 2: Google Sheets**
1. Gebruik [Zapier](https://zapier.com) of [Make](https://make.com) om de webhook door te sturen naar een Google Sheet
2. Of gebruik een simpele tool als [sheetdb.io](https://sheetdb.io)

**Optie 3: eigen e-mail**
Gebruik [Pipedream](https://pipedream.com) of [n8n](https://n8n.io) om webhook-calls om te zetten in een e-mail naar jou.

## Kosten (jouw kant)

Per gratis scan betaal jij ongeveer:
- **Claude Sonnet 4.5**: €0,05 tot €0,15 per scan + €0,02 per optimize-call
- Bij 100 gratis scans + 300 optimize-calls per maand: ~€15 tot €25

Rate limit (2 scans per IP per 24 uur) voorkomt dat één persoon je budget opmaakt. Bij piekdrukte: zet in Vercel dashboard tijdelijk een lager limit.

## Lokaal testen

```bash
# Installeer Vercel CLI (eenmalig)
npm i -g vercel

# Start lokale dev-server
cd /Users/patriciaheemskerk/Claude/spark-shift-cro-scanner
vercel dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Updates pushen

Als je iets wilt wijzigen:
1. Pas het bestand aan (bijv. tekst in `public/index.html`)
2. Upload opnieuw op GitHub (of push via git)
3. Vercel deployt automatisch binnen 30 seconden

## Op je Spark & Shift website embedden

Om de scanner op je bestaande website te zetten (bijv. in een sectie van [kusvaninvloed.nl](https://kusvaninvloed.nl)):

```html
<iframe
  src="https://scanner.kusvaninvloed.nl"
  width="100%"
  height="900"
  style="border: none; border-radius: 16px;"
></iframe>
```

## Problemen oplossen

**"Server niet goed geconfigureerd"** → API-key ontbreekt in Vercel env vars.
**"Scan mislukt (502)"** → Je Anthropic-account heeft geen tegoed meer. Check [console.anthropic.com](https://console.anthropic.com).
**CNAME werkt niet** → DNS kan 24 uur duren. Gebruik [dnschecker.org](https://dnschecker.org) om te zien of het actief is.
**Rate limit te streng** → Pas `RATE_LIMIT_MAX` aan in `api/scan.js` en push opnieuw.

## Privacy & AVG

- Lead-gegevens (naam, e-mail) gaan alleen naar jouw webhook
- Scan-input wordt niet door Anthropic bewaard voor training (API-policy)
- Voeg een link naar je privacyverklaring toe in de lead-modal in `public/index.html`
- Overweeg een AVG-checkbox bij de lead-vraag als je conservatief wilt zijn

---

*Spark & Shift CRO Scanner · Gebouwd door Patricia Heemskerk · Kus van Invloed*
