# ImpactHub

> Het professionele netwerk voor fondsenwervers en iedereen die werkt voor goede doelen — "een LinkedIn, maar dan voor de sector".

Dit is een **werkend prototype**: een klikbare web-app die volledig in de browser draait. Er is geen server, login of database nodig. Alle wijzigingen (posts, likes, connecties, je profiel) worden lokaal bewaard in je browser via `localStorage`.

## Openen

Twee manieren:

1. **Dubbelklikken** op `index.html` — werkt direct in elke moderne browser.
2. **Lokaal serveren** (aanrader, geen cache-gedoe):
   ```bash
   cd impacthub
   python3 -m http.server 8000
   ```
   Open daarna [http://localhost:8000](http://localhost:8000).

## Wat kun je in het prototype?

- **🏠 Home / tijdlijn** — Lees berichten van vakgenoten, plaats zelf een post (met tags), like en reageer.
- **👥 Netwerk** — Bekijk je connecties en suggesties ("Misschien ken je…"), verbind met één klik.
- **💼 Vacatures** — Een vacaturebank gericht op de sector (fondsenwerving, campagne, vrijwilligers, subsidies, partnerschappen). Solliciteer met één knop.
- **📅 Events** — Bijeenkomsten en webinars; meld je aan.
- **👤 Profiel** — Bekijk elk profiel; bewerk je eigen profiel (naam, functietitel, organisatie, "over", vaardigheden, open-voor-werk).

Onderaan elke pagina kun je via **"voorbeeld-data resetten"** alles terugzetten naar de begintoestand.

## Bestandsstructuur

```
impacthub/
├── index.html          # De pagina; laadt de scripts
├── css/
│   └── styles.css      # Alle styling (teal/groen thema)
└── js/
    ├── data.js         # Voorbeeld-data (gebruikers, posts, vacatures, events)
    ├── store.js        # State + opslag in localStorage
    └── app.js          # Rendering, routing en interacties
```

De code gebruikt geen frameworks of build-stap — bewust simpel, zodat het makkelijk te lezen en aan te passen is.

## Hoe wordt dit een "echte" app?

Dit prototype laat het idee en de flow zien. Voor een productieversie zou je toevoegen:

1. **Backend + database** — Vervang `store.js` door echte API-calls; sla gebruikers, posts en connecties op in een database (bijv. Postgres/Supabase).
2. **Login & accounts** — Echte registratie/inloggen, zodat iedereen z'n eigen profiel heeft.
3. **Berichten (chat)** — 1-op-1 gesprekken tussen leden.
4. **Verificatie van organisaties** — Een badge voor erkende goede doelen (bijv. CBF-keurmerk), zodat het netwerk betrouwbaar blijft.
5. **Moderatie & AVG** — Privacyverklaring, rapporteren, en zorgvuldige omgang met persoonsgegevens.

De huidige mappenstructuur (data / store / app gescheiden) is alvast opgezet zodat die overstap soepel verloopt.

---

*ImpactHub · prototype · het netwerk voor de goede-doelensector*
