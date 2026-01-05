import React, { useState, useMemo, useEffect } from 'react';

const TIERS = [
  { min: 0, max: 20, percent: 10, label: '0–20' },
  { min: 21, max: 50, percent: 11, label: '21–50' },
  { min: 51, max: 100, percent: 12, label: '51–100' },
  { min: 101, max: 200, percent: 13, label: '101–200' },
  { min: 201, max: 400, percent: 14, label: '201–400' },
  { min: 401, max: Infinity, percent: 15, label: '400+' },
];

const PARTNER_TYPES = [
  { name: 'Mini obec', population: '~1 000 obyvatel', clients: '20–50 seniorů' },
  { name: 'Malá obec', population: '~3 000 obyvatel', clients: '50–100 seniorů' },
  { name: 'Střední obec', population: '5–10 tis. obyvatel', clients: '100–200 seniorů' },
  { name: 'Velká obec', population: '10–30 tis. obyvatel', clients: '200–400 seniorů' },
  { name: 'Město', population: '30 000+ obyvatel', clients: '400+ seniorů' },
];

const SCENARIOS = {
  conservative: {
    name: 'Konzervativní',
    description: 'Opatrný odhad s nižší aktivitou',
    clients: [40, 60, 80, 100, 125, 150],
    partners: [
      '2× malá obec',
      '1× malá + 1× mini',
      '1× střední obec',
      '1× střední obec',
      '1× střední + 1× mini',
      '1× střední + 1× malá',
    ],
  },
  realistic: {
    name: 'Realistický',
    description: 'Očekávaný výkon při aktivní práci',
    clients: [50, 100, 200, 300, 400, 500],
    partners: [
      '1× malá obec',
      '1× střední obec',
      '1× velká obec',
      '1× velká + 1× střední',
      '2× velká obec',
      '1× město + 1× střední',
    ],
  },
  optimistic: {
    name: 'Optimistický',
    description: 'Maximální nasazení a úspěšnost',
    clients: [100, 200, 400, 600, 800, 1000],
    partners: [
      '1× střední obec',
      '1× velká obec',
      '2× velká obec',
      '1× město + 1× velká',
      '2× města',
      '2× města + 1× velká',
    ],
  },
};

const FIXED_SALARY = 25000;
const AVG_ORDER = 2000;
const RETENTION = 0.5;
const PORTFOLIO_COMMISSION = 0.05;

function getTier(clients) {
  return TIERS.find(t => clients >= t.min && clients <= t.max) || TIERS[0];
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatNumber(num) {
  return new Intl.NumberFormat('cs-CZ').format(num);
}

// Decorative arrow icon
const ArrowIcon = ({ className = '' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Komfi Logo
const KomfiLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 569.75 170.24" fill="currentColor">
    <path d="m502.11,7.86c7.82,0,15.68,4.28,15.68,20.12,0,10.4,8.43,18.82,18.82,18.82s18.82-8.43,18.82-18.82c0,0,2.32-27.32-49.79-27.47-.14-.02-.28-.04-.43-.04-.13,0-.26.03-.39.04h-2.72c-24.85,0-49.9,20.84-49.9,46.59v18.93h-8.71c-1.83,0-3.53,1.25-3.82,3.06-.37,2.3,1.39,4.29,3.62,4.29.34,0,.67.04.99.1h2.99c2.72,0,4.93,2.21,4.93,4.93v68.59c0,6.89-5.59,12.48-12.47,12.48h-3.57c-6.89,0-12.48-5.59-12.48-12.48v-54.59c0-18.44-7.23-38.38-30.91-38.38-13.61,0-23.92,6.31-31.81,15.02-3.27,3.5-5.51,6.82-6.4,8.22-.28.43-.75.7-1.26.7-.67,0-1.25-.45-1.44-1.09-.82-3.28-1.98-6.36-3.54-9.13-.02-.04-.05-.08-.07-.12-4.6-8.11-12.53-13.58-24.77-13.58-16.84,0-29.37,10.26-39.25,23.09-.4.53-1.02.84-1.69.84-1.45,0-2.48-1.42-2.04-2.8l5.32-16.55c.31-.97.04-2.04-.7-2.74l-2.23-2.12c-.9-.86-2.28-.96-3.32-.27-9.98,6.63-19.1,10.51-33.37,12.9-1.29.22-2.25,1.32-2.25,2.62,0,1.47,1.21,2.65,2.68,2.65,12.03,0,13.77,4.9,13.77,13.28v62.07c0,10.07-5.05,11.52-13.98,13.04-1.42.24-2.47,1.48-2.47,2.92h0c0,1.65,1.33,2.98,2.97,2.98h49.9c1.64,0,2.97-1.33,2.97-2.97v-.06c0-1.42-1.02-2.65-2.42-2.91-7.92-1.51-13.28-3.02-13.28-13v-60.82c9.97-13.21,20.69-16.2,27.67-16.2,11.96,0,18.45,8.97,18.45,23.67v53.34c0,10.09-5.06,11.53-14.21,13.05-1.43.24-2.48,1.48-2.48,2.93,0,1.64,1.33,2.97,2.97,2.97h50.65c1.64,0,2.97-1.33,2.97-2.97v-.02c0-1.44-1.05-2.67-2.46-2.92-8.71-1.52-13.74-2.98-13.74-13.03v-60.82c10.22-13.21,19.94-16.2,27.42-16.2,12.71,0,18.69,8.97,18.69,23.67v53.34c0,10.09-5.07,11.53-14.03,13.05-1.39.24-2.42,1.45-2.42,2.86v.13c0,1.6,1.3,2.9,2.9,2.9h113.2c1.6,0,2.9-1.3,2.9-2.9,0-1.47-1.1-2.71-2.57-2.88-13.6-1.57-23.11-2.83-23.11-13.16v-73.52h0v-.1h19.81c1.83,0,3.53-1.25,3.82-3.06.37-2.3-1.39-4.29-3.62-4.29h-14.79c-2.93,0-5.31-2.38-5.31-5.31v-19.46c0-27.45,16.69-33.4,25.31-33.4Z"/>
    <path d="m567.28,160.02c-8.56-1.51-13.98-2.99-13.98-13.03V61.75c0-.82-.35-1.61-.96-2.17l-2.51-2.28c-1.03-.93-2.44-.81-3.68-.19-12.21,6.17-18.61,6.98-30.55,9.19-1.4.26-2.43,1.45-2.43,2.87s1.05,2.65,2.46,2.88c12.23,2.01,13.99,6.91,13.99,15.35v59.57c0,10.03-5.42,11.51-13.98,13.03-1.42.25-2.47,1.49-2.47,2.94,0,1.65,1.34,2.98,2.98,2.98h50.61c1.65,0,2.98-1.33,2.98-2.98,0-1.44-1.05-2.68-2.47-2.94Z"/>
    <path d="m184.67,52.43c-33.05,0-59.85,26.37-59.85,58.9s26.79,58.9,59.85,58.9,59.85-26.37,59.85-58.9-26.79-58.9-59.85-58.9Zm0,106.93c-19.08,0-34.55-21.5-34.55-48.02s15.47-48.02,34.55-48.02,34.55,21.5,34.55,48.02-15.47,48.02-34.55,48.02Z"/>
    <path d="m83.7,92.35h15.71c11.02,0,19.96-8.94,19.96-19.96h0c0-11.02-8.94-19.96-19.96-19.96h0c-11.02,0-19.96,8.94-19.96,19.96v15.71c0,2.35,1.9,4.25,4.25,4.25Z"/>
    <path d="m129.98,160.15c-13.18-8.72-33.57-34.13-45.77-50.2-6.55-8.63-11.48-13.73-22.29-13.84h-5.24s-.35-.01-.35-.01h-12.55V5.71c0-.88-.36-1.72-1-2.33l-2.62-2.49c-1.07-1.01-2.69-1.18-3.93-.38C25.33,7.63,16.68,11.64,2.77,14.24c-1.23.23-2.32,1.09-2.65,2.31-.52,1.91.73,3.75,2.56,4.04,13.67,2.2,17.31,7.6,17.31,16.88v107.66c0,11.03-4.43,12.65-14.12,14.32-1.77.3-3.01,1.99-2.66,3.84.29,1.58,1.78,2.66,3.39,2.66h49.9c1.61,0,3.1-1.08,3.39-2.66.34-1.84-.9-3.53-2.66-3.84-9.69-1.67-13.44-3.28-13.44-14.32v-38.11c.06-3.47,4.49-4.93,6.58-2.13l7.91,10.55v-.08c9.19,12.19,20.41,27.01,26.17,34.41,2.68,3.44,11.86,16.17,24.11,16.17h20.02c3.01,0,3.91-4.13,1.4-5.79Z"/>
  </svg>
);

// Chevron icon for accordions
const ChevronIcon = ({ isOpen, className = '' }) => (
  <svg
    className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Calculator() {
  const [scenario, setScenario] = useState('realistic');
  const [showPartnerTypes, setShowPartnerTypes] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clients = SCENARIOS[scenario].clients;
  const partners = SCENARIOS[scenario].partners;

  const calculations = useMemo(() => {
    const months = [];
    let totalClients = 0;
    const cohorts = [];

    for (let m = 0; m < 6; m++) {
      const newClients = clients[m];
      totalClients += newClients;
      const tier = getTier(newClients);
      const newCommission = newClients * AVG_ORDER * (tier.percent / 100);

      let activePortfolio = 0;
      for (let i = 0; i < cohorts.length; i++) {
        const monthsActive = m - cohorts[i].month;
        if (monthsActive >= 1 && monthsActive <= 5) {
          activePortfolio += cohorts[i].retained;
        }
      }

      const portfolioCommission = activePortfolio * AVG_ORDER * PORTFOLIO_COMMISSION;
      const total = FIXED_SALARY + newCommission + portfolioCommission;

      cohorts.push({ month: m, original: newClients, retained: Math.round(newClients * RETENTION) });

      months.push({
        month: m + 1,
        newClients,
        tier: tier.label,
        tierPercent: tier.percent,
        newCommission,
        portfolio: activePortfolio,
        portfolioCommission,
        fixed: FIXED_SALARY,
        total,
        partner: partners[m],
        isActive: true,
      });
    }

    for (let m = 6; m < 12; m++) {
      let activePortfolio = 0;
      for (let i = 0; i < cohorts.length; i++) {
        const monthsActive = m - cohorts[i].month;
        if (monthsActive >= 1 && monthsActive <= 5) {
          activePortfolio += cohorts[i].retained;
        }
      }

      const portfolioCommission = activePortfolio * AVG_ORDER * PORTFOLIO_COMMISSION;

      months.push({
        month: m + 1,
        newClients: 0,
        tier: '—',
        tierPercent: 0,
        newCommission: 0,
        portfolio: activePortfolio,
        portfolioCommission,
        fixed: 0,
        total: portfolioCommission,
        partner: '—',
        isActive: false,
      });
    }

    const activeTotal = months.slice(0, 6).reduce((sum, m) => sum + m.total, 0);
    const passiveTotal = months.slice(6).reduce((sum, m) => sum + m.total, 0);
    const grandTotal = activeTotal + passiveTotal;
    const avgCPA = totalClients > 0 ? activeTotal / totalClients : 0;

    return { months, activeTotal, passiveTotal, grandTotal, totalClients, avgCPA };
  }, [clients, partners]);

  return (
    <div className="min-h-screen bg-[#f7f5f0] grain-overlay">
      <div className="max-w-[1140px] mx-auto px-4 py-8 md:px-8 md:py-16">

        {/* Header */}
        <header className={`text-center mb-12 md:mb-16 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex justify-center mb-8">
            <KomfiLogo className="h-6 text-[#2d2d2d]" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[#2d2d2d] mb-4 tracking-tight">
            Odměny obchodních zástupců
          </h1>
          <p className="text-[#8a8279] text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Interaktivní simulace výdělku
          </p>
        </header>

        {/* How it works section */}
        <section className={`bg-white rounded-2xl p-6 md:p-10 mb-8 shadow-sm border border-[#e8e5de] ${mounted ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="decorative-line"></div>
            <h2 className="font-display text-2xl md:text-3xl text-[#2d2d2d]">Jak funguje odměňování</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {[
              {
                title: 'Fixní odměna',
                value: '25 000 Kč',
                description: 'Garantovaný měsíční příjem po dobu akivní akvizice nových partnerů.',
              },
              {
                title: 'Provize z nových klientů',
                value: '10–15 %',
                description: 'Progresivní provize z první objednávky. Čím více klientů získáte, tím vyšší procento.',
              },
              {
                title: 'Provize z portfolia',
                value: '5 %',
                description: 'Dlouhodobý příjem z aktivních klientů po dobu 2.–6. měsíce od jejich akvizice.',
              },
            ].map((item, index) => (
              <div key={index} className="group">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-display text-3xl md:text-4xl text-[#c67c4e] number-highlight">
                    {item.value}
                  </span>
                </div>
                <h3 className="font-display text-lg text-[#2d2d2d] mb-2">{item.title}</h3>
                <p className="text-[#8a8279] text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partner Types - Collapsible */}
        <section className={`bg-white rounded-2xl mb-6 shadow-sm border border-[#e8e5de] overflow-hidden ${mounted ? 'animate-fade-in-up stagger-3' : 'opacity-0'}`}>
          <button
            onClick={() => setShowPartnerTypes(!showPartnerTypes)}
            className="w-full p-5 md:p-6 flex items-center justify-between text-left hover:bg-[#fdfcfa] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f7f5f0] flex items-center justify-center">
                <span className="text-[#c67c4e] text-sm">?</span>
              </div>
              <h2 className="font-display text-xl text-[#2d2d2d]">Typy partnerů (obcí)</h2>
            </div>
            <ChevronIcon isOpen={showPartnerTypes} className="text-[#a69f94]" />
          </button>

          <div className={`grid transition-all duration-300 ease-in-out ${showPartnerTypes ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="px-5 pb-6 md:px-6">
                <p className="text-[#8a8279] text-sm mb-4">
                  Senior = osoba 65+. Ve skutečnosti nám ale nezáleží na věku klienta — důležité je, aby šel identifikovat jako součást obchodu skrze danou obec.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {PARTNER_TYPES.map((p, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#f7f5f0] rounded-xl border border-[#e8e5de] hover:border-[#c67c4e]/30 transition-colors"
                    >
                      <div className="font-display text-[#2d2d2d] mb-1">{p.name}</div>
                      <div className="text-xs text-[#a69f94] mb-2">{p.population}</div>
                      <div className="text-sm font-semibold text-[#c67c4e]">{p.clients}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Commission Tiers Table */}
        <section className={`bg-white rounded-2xl p-5 md:p-8 mb-6 shadow-sm border border-[#e8e5de] ${mounted ? 'animate-fade-in-up stagger-4' : 'opacity-0'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="decorative-line"></div>
            <h2 className="font-display text-xl md:text-2xl text-[#2d2d2d]">Provizní tabulka</h2>
          </div>

          <div className="overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-[#e8e5de]">
                  <th className="pb-4 text-left text-[#a69f94] text-xs uppercase tracking-wider font-medium">Počet klientů</th>
                  <th className="pb-4 text-center text-[#a69f94] text-xs uppercase tracking-wider font-medium">1. měsíc</th>
                  <th className="pb-4 text-center text-[#a69f94] text-xs uppercase tracking-wider font-medium">2.–6. měsíc</th>
                  <th className="pb-4 text-right text-[#a69f94] text-xs uppercase tracking-wider font-medium">Provize per klient</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t, i) => (
                  <tr key={i} className="table-row-hover border-b border-[#f7f5f0] last:border-0">
                    <td className="py-4 font-medium text-[#2d2d2d]">{t.label}</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-[#c67c4e]/10 text-[#c67c4e] font-semibold rounded-full text-sm">
                        {t.percent} %
                      </span>
                    </td>
                    <td className="py-4 text-center text-[#8a8279]">5 %</td>
                    <td className="py-4 text-right text-[#2d2d2d] font-medium">
                      {formatCurrency(AVG_ORDER * (t.percent / 100) + 5 * AVG_ORDER * RETENTION * PORTFOLIO_COMMISSION)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Simulation Section Header */}
        <div className={`flex items-center gap-4 mb-6 ${mounted ? 'animate-fade-in-up stagger-5' : 'opacity-0'}`}>
          <div className="decorative-line"></div>
          <h2 className="font-display text-2xl md:text-3xl text-[#2d2d2d]">Simulace obchodních scénářů</h2>
        </div>

        {/* Scenario Tabs - Sticky */}
        <div className="sticky top-0 z-20 py-4 -mx-4 px-4 md:-mx-8 md:px-8 bg-[#f7f5f0]/95 backdrop-blur-sm mb-6">
          <div className="bg-white rounded-xl p-1.5 shadow-sm border border-[#e8e5de] max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(SCENARIOS).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    scenario === key
                      ? 'bg-[#2d2d2d] text-white shadow-md'
                      : 'text-[#8a8279] hover:text-[#2d2d2d] hover:bg-[#f7f5f0]'
                  }`}
                >
                  <span className="relative z-10">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Months Table */}
        <section className={`bg-white rounded-2xl p-5 md:p-8 mb-6 shadow-sm border border-[#e8e5de] ${mounted ? 'animate-fade-in-up stagger-5' : 'opacity-0'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
            <div>
              <h2 className="font-display text-xl md:text-2xl text-[#2d2d2d]">
                Měsíce 1–6
                <span className="text-[#c67c4e] ml-2">Aktivní akvizice</span>
              </h2>
              <p className="text-[#a69f94] text-sm mt-1">
                Fixní odměna {formatCurrency(FIXED_SALARY)}/měsíc + provize
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-[#c67c4e]"></span>
              <span className="text-[#8a8279]">Scénář: {SCENARIOS[scenario].name}</span>
            </div>
          </div>

          <div className="mb-6 p-4 bg-[#f7f5f0] rounded-xl text-sm grid grid-cols-2 md:grid-cols-3 gap-3 border border-[#e8e5de]">
            {[
              { label: 'Noví klienti', desc: 'počet nově získaných' },
              { label: 'Úroveň', desc: 'pásmo dle počtu nových' },
              { label: 'Provize nové', desc: 'noví × 2 000 Kč × %' },
              { label: 'Portfolio', desc: 'klienti v okně 2–6M × 50% retence' },
              { label: 'Provize portf.', desc: 'portfolio × 2 000 Kč × 5%' },
              { label: 'Partner', desc: 'orientační typ partnera' },
            ].map((item, i) => (
              <div key={i} className="text-[#8a8279]">
                <span className="font-medium text-[#4a4a4a]">{item.label}:</span> {item.desc}
              </div>
            ))}
          </div>

          <div className="overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-[#e8e5de]">
                  <th className="pb-3 text-left text-[#a69f94] text-xs uppercase tracking-wider font-medium">Měsíc</th>
                  <th className="pb-3 text-left text-[#a69f94] text-xs uppercase tracking-wider font-medium">Partner</th>
                  <th className="pb-3 text-center text-[#a69f94] text-xs uppercase tracking-wider font-medium">Noví</th>
                  <th className="pb-3 text-center text-[#a69f94] text-xs uppercase tracking-wider font-medium">Úroveň</th>
                  <th className="pb-3 text-right text-[#a69f94] text-xs uppercase tracking-wider font-medium">Provize</th>
                  <th className="pb-3 text-center text-[#a69f94] text-xs uppercase tracking-wider font-medium pr-2">Portf.</th>
                  <th className="pb-3 text-right text-[#a69f94] text-xs uppercase tracking-wider font-medium pl-2">Portf. prov.</th>
                  <th className="pb-3 text-right text-[#a69f94] text-xs uppercase tracking-wider font-medium">Fixní</th>
                  <th className="pb-3 text-right text-[#a69f94] text-xs uppercase tracking-wider font-medium font-semibold">Celkem</th>
                </tr>
              </thead>
              <tbody>
                {calculations.months.slice(0, 6).map((m, index) => (
                  <tr
                    key={m.month}
                    className="table-row-hover border-b border-[#f7f5f0]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-3.5 font-display text-lg text-[#2d2d2d]">M{m.month}</td>
                    <td className="py-3.5 text-xs text-[#a69f94]">{m.partner}</td>
                    <td className="py-3.5 text-center">
                      <span className="font-semibold text-[#c67c4e]">{m.newClients}</span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex px-2 py-0.5 bg-[#f7f5f0] rounded text-xs text-[#4a4a4a]">
                        {m.tier} <span className="text-[#a69f94] ml-1">({m.tierPercent}%)</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-[#2d2d2d]">{formatCurrency(m.newCommission)}</td>
                    <td className="py-3.5 text-center text-[#a69f94] pr-2">{m.portfolio}</td>
                    <td className="py-3.5 text-right text-[#8a8279] pl-2">{formatCurrency(m.portfolioCommission)}</td>
                    <td className="py-3.5 text-right text-[#a69f94]">{formatCurrency(m.fixed)}</td>
                    <td className="py-3.5 text-right font-semibold text-[#2d2d2d]">{formatCurrency(m.total)}</td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-[#f7f5f0] to-[#ebe8e1]">
                  <td className="py-4 rounded-l-lg font-display text-lg text-[#2d2d2d]" colSpan={8}>
                    Celkem M1–6
                  </td>
                  <td className="py-4 rounded-r-lg text-right">
                    <span className="font-display text-xl text-[#c67c4e]">{formatCurrency(calculations.activeTotal)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Passive Months Table */}
        <section className={`bg-white rounded-2xl p-5 md:p-8 mb-8 shadow-sm border border-[#e8e5de] ${mounted ? 'animate-fade-in-up stagger-6' : 'opacity-0'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
            <div>
              <h2 className="font-display text-xl md:text-2xl text-[#2d2d2d]">
                Měsíce 7–12
                <span className="text-[#8a8279] ml-2">Dobíhající provize</span>
              </h2>
              <p className="text-[#a69f94] text-sm mt-1">
                Pohled na dobíhající pasivní příjem z práce provedené v prvních 6 měsících
              </p>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b-2 border-[#e8e5de]">
                  <th className="pb-3 text-left text-[#a69f94] text-xs uppercase tracking-wider font-medium">Měsíc</th>
                  <th className="pb-3 text-center text-[#a69f94] text-xs uppercase tracking-wider font-medium">Portfolio</th>
                  <th className="pb-3 text-right text-[#a69f94] text-xs uppercase tracking-wider font-medium">Provize</th>
                  <th className="pb-3 text-left text-[#a69f94] text-xs uppercase tracking-wider font-medium pl-6">Poznámka</th>
                </tr>
              </thead>
              <tbody>
                {calculations.months.slice(6).map((m) => (
                  <tr key={m.month} className="table-row-hover border-b border-[#f7f5f0]">
                    <td className="py-3.5 font-display text-lg text-[#2d2d2d]">M{m.month}</td>
                    <td className="py-3.5 text-center text-[#a69f94]">{m.portfolio}</td>
                    <td className="py-3.5 text-right font-medium text-[#2d2d2d]">{formatCurrency(m.portfolioCommission)}</td>
                    <td className="py-3.5 text-sm text-[#a69f94] pl-6">
                      {m.portfolio > 0
                        ? `Kohorty M${Math.max(1, m.month - 5)}–M6`
                        : 'Všichni mimo okno'
                      }
                    </td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-[#f7f5f0] to-[#ebe8e1]">
                  <td className="py-4 rounded-l-lg font-display text-lg text-[#2d2d2d]" colSpan={2}>
                    Celkem M7–12
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-display text-xl text-[#c67c4e]">{formatCurrency(calculations.passiveTotal)}</span>
                  </td>
                  <td className="rounded-r-lg"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Summary Cards */}
        <section className={`mb-12 ${mounted ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="bg-[#2d2d2d] rounded-2xl p-6 md:p-10 text-white overflow-hidden relative summary-glow">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#c67c4e]/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="decorative-line !bg-gradient-to-r !from-[#c67c4e] !to-[#d4956b]"></div>
                <h2 className="font-display text-2xl md:text-3xl">
                  Souhrn — {SCENARIOS[scenario].name} scénář
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-8">
                <div className="group">
                  <div className="text-[#a69f94] text-sm mb-2">Získaných klientů</div>
                  <div className="font-display text-2xl md:text-3xl lg:text-4xl number-highlight text-[#c67c4e]">
                    {formatNumber(calculations.totalClients)}
                  </div>
                </div>
                <div className="group">
                  <div className="text-[#a69f94] text-sm mb-2">Výdělek M1–6</div>
                  <div className="font-display text-2xl md:text-3xl lg:text-4xl number-highlight text-[#c67c4e]">
                    {formatCurrency(calculations.activeTotal)}
                  </div>
                </div>
                <div className="group">
                  <div className="text-[#a69f94] text-sm mb-2">Průměr/měsíc</div>
                  <div className="font-display text-2xl md:text-3xl lg:text-4xl number-highlight text-white">
                    {formatCurrency((calculations.activeTotal + calculations.passiveTotal) / 6)}
                  </div>
                  <div className="text-[#a69f94] text-xs mt-2">
                    {formatCurrency(calculations.activeTotal / 6)} + {formatCurrency(calculations.passiveTotal / 6)} dobíhající (celkem {formatCurrency(calculations.passiveTotal)} za 6 měsíců)
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-white/10 gap-4">
                <div>
                  <span className="text-[#a69f94]">Celkový výdělek za práci za 6 měsíců: </span>
                  <span className="font-display text-2xl text-white ml-2">{formatCurrency(calculations.grandTotal)}</span>
                </div>
                <div className="text-[#a69f94] text-sm">
                  CPA: <span className="text-white font-medium">{formatCurrency(calculations.avgCPA)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-8">
          <p className="text-[#a69f94] text-sm mb-3">
            Předpoklady: průměrná objednávka {formatCurrency(AVG_ORDER)}/měsíc, retence {RETENTION * 100}%
          </p>
          <div className="flex items-center justify-center gap-2 text-[#8a8279]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c67c4e]"></span>
            <span className="font-display text-lg">Komfi Health s.r.o.</span>
            <span className="text-[#a69f94]">•</span>
            <span className="text-sm">{new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Calculator;
