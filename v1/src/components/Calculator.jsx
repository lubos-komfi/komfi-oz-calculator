import React, { useState, useMemo, useEffect } from 'react';

const TIERS = [
  { min: 0, max: 20, percent: 10, label: '0–20' },
  { min: 21, max: 50, percent: 12, label: '21–50' },
  { min: 51, max: 100, percent: 15, label: '51–100' },
  { min: 101, max: 200, percent: 18, label: '101–200' },
  { min: 201, max: 400, percent: 20, label: '201–400' },
  { min: 401, max: Infinity, percent: 22, label: '400+' },
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
const PORTFOLIO_COMMISSION = 0.02;

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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full mb-6 border border-[#e8e5de]">
            <span className="w-2 h-2 rounded-full bg-[#c67c4e]"></span>
            <span className="text-[#8a8279] text-sm tracking-wide uppercase">Komfi Health</span>
          </div>
          <h1 className="font-display text-4xl md:text-[48px] lg:text-[48px] text-[#2d2d2d] mb-4 tracking-tight">
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
                value: '10–22 %',
                description: 'Progresivní provize z první objednávky. Čím více klientů získáte, tím vyšší procento.',
              },
              {
                title: 'Provize z portfolia',
                value: '2 %',
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
                    <td className="py-4 text-center text-[#8a8279]">2 %</td>
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
              { label: 'Provize portf.', desc: 'portfolio × 2 000 Kč × 2%' },
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
                {[
                  { label: 'Získaných klientů', value: formatNumber(calculations.totalClients), highlight: true },
                  { label: 'Výdělek M1–6', value: formatCurrency(calculations.activeTotal), highlight: true },
                  { label: 'Průměr/měsíc', value: formatCurrency(calculations.activeTotal / 6), highlight: false },
                  { label: 'Dobíhající M7–12', value: formatCurrency(calculations.passiveTotal), highlight: false },
                ].map((item, i) => (
                  <div key={i} className="group">
                    <div className="text-[#a69f94] text-sm mb-2">{item.label}</div>
                    <div className={`font-display text-2xl md:text-3xl lg:text-4xl number-highlight ${item.highlight ? 'text-[#c67c4e]' : 'text-white'}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
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
