# Komfi – Kalkulačka odměn pro obchodníky

Interaktivní React kalkulačka pro simulaci výdělků obchodních zástupců Komfi.

## Quick Start

```bash
# 1. Nainstaluj závislosti
npm install

# 2. Spusť vývojový server
npm run dev

# 3. Otevři v prohlížeči
# http://localhost:5173
```

## Produkční build

```bash
# Vytvoř produkční build
npm run build

# Náhled produkčního buildu
npm run preview
```

## Tech Stack

- **React 18** – UI framework
- **Vite 5** – Build tool & dev server
- **Tailwind CSS 3** – Utility-first CSS

## Struktura projektu

```
komfi-project/
├── public/
│   └── favicon.svg           # Ikona aplikace
├── src/
│   ├── components/
│   │   └── Calculator.jsx    # Hlavní komponenta kalkulačky
│   ├── App.jsx               # Root komponenta
│   ├── main.jsx              # Entry point
│   └── index.css             # Tailwind directives
├── index.html                # HTML šablona
├── package.json              # Závislosti a skripty
├── vite.config.js            # Vite konfigurace
├── tailwind.config.js        # Tailwind konfigurace
├── postcss.config.js         # PostCSS konfigurace
└── README.md                 # Tato dokumentace
```

---

## Struktura odměňování

### Fixní složka
- **25 000 Kč/měsíc** – základní plat

### Progresivní provize za 1. měsíc

| Tier (noví klienti) | Provize |
|---------------------|---------|
| 0–20                | 10%     |
| 21–50               | 12%     |
| 51–100              | 15%     |
| 101–200             | 18%     |
| 201–400             | 20%     |
| 400+                | 22%     |

### Provize za 2.–6. měsíc
- **2%** z obratu klientů v portfoliu (jednotně)

---

## Logika výpočtů

### Klíčové konstanty

```javascript
const FIXED_SALARY = 25000;        // Fixní plat
const AVG_ORDER = 2000;            // Průměrná měsíční útrata klienta
const RETENTION = 0.5;             // Retence po 1. měsíci (50%)
const PORTFOLIO_COMMISSION = 0.02; // Provize z portfolia (2%)
```

### Výpočet měsíčního výdělku

```
Měsíční výdělek = Fixní plat 
                + (Noví klienti × Útrata × Tier%)
                + (Portfolio × Útrata × 2%)
```

### Portfolio

Portfolio = součet klientů z předchozích měsíců (M-1 až M-5), kteří:
1. Jsou v okně 2–6 měsíců od své akvizice
2. Aplikuje se 50% retence

### CPA (Cost Per Acquisition)

```
CPA = Celkový výdělek M1–6 / Počet získaných klientů
```

Zahrnuje fixní plat i všechny provize.

---

## Scénáře

### Konzervativní
Postupný růst přes menší partnery.

| Měsíc | Klientů | Partner |
|-------|---------|---------|
| 1     | 40      | 2× malá obec |
| 2     | 60      | 1× malá + 1× mini |
| 3     | 80      | 1× střední obec |
| 4     | 100     | 1× střední obec |
| 5     | 125     | 1× střední + 1× mini |
| 6     | 150     | 1× střední + 1× malá |

**Celkem:** 555 klientů

### Realistický
Střední tempo růstu.

| Měsíc | Klientů | Partner |
|-------|---------|---------|
| 1     | 50      | 1× malá obec |
| 2     | 100     | 1× střední obec |
| 3     | 200     | 1× velká obec |
| 4     | 300     | 1× velká + 1× střední |
| 5     | 400     | 2× velká obec |
| 6     | 500     | 1× město + 1× střední |

**Celkem:** 1 550 klientů

### Optimistický
Agresivní růst přes velké partnery.

| Měsíc | Klientů | Partner |
|-------|---------|---------|
| 1     | 100     | 1× střední obec |
| 2     | 200     | 1× velká obec |
| 3     | 400     | 2× velká obec |
| 4     | 600     | 1× město + 1× velká |
| 5     | 800     | 2× města |
| 6     | 1000    | 2× města + 1× velká |

**Celkem:** 3 100 klientů

---

## Typy partnerů (obcí)

| Typ | Obyvatel | Odhadovaný počet seniorů |
|-----|----------|--------------------------|
| 🏘️ Mini obec | ~1 000 | 20–50 |
| 🏡 Malá obec | ~3 000 | 50–100 |
| 🏢 Střední obec | 5 000–10 000 | 100–200 |
| 🏙️ Velká obec | 10 000–30 000 | 200–400 |
| 🌆 Město | 30 000+ | 400+ |

---

## Customizace

### Změna tierů

V souboru `src/components/Calculator.jsx`:

```javascript
const TIERS = [
  { min: 0, max: 20, percent: 10, label: '0–20' },
  { min: 21, max: 50, percent: 12, label: '21–50' },
  // ...
];
```

### Změna scénářů

```javascript
const SCENARIOS = {
  conservative: {
    name: 'Konzervativní',
    clients: [40, 60, 80, 100, 125, 150],  // klienti per měsíc
    partners: ['2× malá obec', ...],       // popis partnerů
  },
  // ...
};
```

### Změna konstant

```javascript
const FIXED_SALARY = 25000;  // Základní plat
const AVG_ORDER = 2000;      // Průměrná útrata
const RETENTION = 0.5;       // Retence (0-1)
```

---

## UI komponenty

- **Sticky taby** – přepínání scénářů, zůstávají viditelné při scrollu
- **Collapsible sekce** – typy partnerů (defaultně zavřená)
- **Tooltips** – kontextové nápovědy (komponenta `InfoTooltip`)
- **Tabulky s vysvětlivkami** – možnost skrýt/zobrazit

---

## Deployment

### Vercel

```bash
npm run build
# Upload složky `dist/` na Vercel
```

### Netlify

```bash
npm run build
# Upload složky `dist/` na Netlify
```

### Static hosting

Po `npm run build` je aplikace ve složce `dist/` připravená k nasazení na jakýkoliv static hosting.

---

## Kontakt

**Komfi Health s.r.o.**  
IČ 09208241  
Korunní 2569/108, Praha 101 00

- **Luboš Buračinský** – CEO – lubos@komfi.health
- **Roman Bořánek** – Product Manager – roman@komfi.health
