import React, { useState, useMemo } from 'react';

const TIERS = [
  { min: 0, max: 20, percent: 10, label: '0–20' },
  { min: 21, max: 50, percent: 12, label: '21–50' },
  { min: 51, max: 100, percent: 15, label: '51–100' },
  { min: 101, max: 200, percent: 18, label: '101–200' },
  { min: 201, max: 400, percent: 20, label: '201–400' },
  { min: 401, max: Infinity, percent: 22, label: '400+' },
];

const PARTNER_TYPES = [
  { name: 'Mini obec', population: '~1 000 obyvatel', clients: '20–50 seniorů', icon: '🏘️' },
  { name: 'Malá obec', population: '~3 000 obyvatel', clients: '50–100 seniorů', icon: '🏡' },
  { name: 'Střední obec', population: '5 000–10 000 obyvatel', clients: '100–200 seniorů', icon: '🏢' },
  { name: 'Velká obec / město', population: '10 000–30 000 obyvatel', clients: '200–400 seniorů', icon: '🏙️' },
  { name: 'Město', population: '30 000+ obyvatel', clients: '400+ seniorů', icon: '🌆' },
];

const SCENARIOS = {
  conservative: {
    name: 'Konzervativní',
    clients: [40, 60, 80, 100, 125, 150],
    partners: [
      '2× malá obec',
      '1× malá + 1× mini obec',
      '1× střední obec',
      '1× střední obec',
      '1× střední + 1× mini obec',
      '1× střední + 1× malá obec',
    ],
  },
  realistic: {
    name: 'Realistický',
    clients: [50, 100, 200, 300, 400, 500],
    partners: [
      '1× malá obec',
      '1× střední obec',
      '1× velká obec',
      '1× velká obec + 1× střední',
      '2× velká obec',
      '1× město + 1× střední obec',
    ],
  },
  optimistic: {
    name: 'Optimistický',
    clients: [100, 200, 400, 600, 800, 1000],
    partners: [
      '1× střední obec',
      '1× velká obec',
      '2× velká obec',
      '1× město + 1× velká obec',
      '2× města',
      '2× města + 1× velká obec',
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
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount);
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs leading-none hover:bg-gray-300"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        ?
      </button>
      {show && (
        <div className="absolute z-10 w-64 p-2 text-sm bg-gray-800 text-white rounded shadow-lg -left-28 top-6">
          {text}
        </div>
      )}
    </span>
  );
}

function Calculator() {
  const [scenario, setScenario] = useState('conservative');
  const [showExplanations, setShowExplanations] = useState(true);
  const [showPartnerTypes, setShowPartnerTypes] = useState(false);

  const clients = SCENARIOS[scenario].clients;
  const partners = SCENARIOS[scenario].partners;

  const calculations = useMemo(() => {
    const months = [];
    let portfolio = 0;
    let totalClients = 0;
    const cohorts = [];

    // Active months 1-6
    for (let m = 0; m < 6; m++) {
      const newClients = clients[m];
      totalClients += newClients;
      const tier = getTier(newClients);
      const newCommission = newClients * AVG_ORDER * (tier.percent / 100);
      
      // Calculate portfolio (clients from previous months, with retention, in 2-6 month window)
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

    // Passive months 7-12
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Komfi – Kalkulačka odměn</h1>
          <p className="text-gray-600">Simulace výdělku obchodního zástupce</p>
        </div>

        {/* Sticky Tabs */}
        <div className="sticky top-0 z-20 bg-gradient-to-br from-amber-50 to-orange-50 py-3 -mx-4 px-4 md:-mx-8 md:px-8">
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-md max-w-xs mx-auto">
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  scenario === key
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Partner Types Reference - Collapsible */}
        <div className="bg-white rounded-xl shadow-lg mb-6 mt-4">
          <button
            onClick={() => setShowPartnerTypes(!showPartnerTypes)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Typy partnerů (obcí)</h2>
              <InfoTooltip text="Orientační počty seniorů dle velikosti obce. Skutečný počet závisí na demografii a penetraci." />
            </div>
            <span className="text-gray-400 text-sm">
              {showPartnerTypes ? '▲ Skrýt' : '▼ Zobrazit'}
            </span>
          </button>
          {showPartnerTypes && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PARTNER_TYPES.map((p, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.population}</div>
                    <div className="text-xs font-semibold text-orange-600 mt-1">{p.clients}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commission Tiers */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Provizní tabulka
            <InfoTooltip text="Provize za 1. měsíc se počítá podle počtu nově získaných klientů v daném měsíci. Čím více klientů, tím vyšší procento." />
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Počet nových klientů</th>
                  <th className="p-2 text-center">Provize 1. měsíc</th>
                  <th className="p-2 text-center">Provize 2.–6. měsíc</th>
                  <th className="p-2 text-center">CPA per klient</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-medium">{t.label}</td>
                    <td className="p-2 text-center text-orange-600 font-semibold">{t.percent}%</td>
                    <td className="p-2 text-center">2%</td>
                    <td className="p-2 text-center text-gray-600">
                      {formatCurrency(AVG_ORDER * (t.percent / 100) + 5 * AVG_ORDER * RETENTION * PORTFOLIO_COMMISSION)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toggle Explanations */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="text-sm text-orange-600 hover:text-orange-800"
          >
            {showExplanations ? '🔽 Skrýt vysvětlivky' : '▶️ Zobrazit vysvětlivky'}
          </button>
        </div>

        {/* Active Months Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Měsíce 1–6: Aktivní akvizice
            <span className="ml-2 text-sm font-normal text-gray-500">
              (fixní plat: {formatCurrency(FIXED_SALARY)}/měsíc)
            </span>
          </h2>
          
          {showExplanations && (
            <div className="mb-4 p-4 bg-amber-50 rounded-lg text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-gray-700">
                <div><strong>Noví klienti:</strong> počet nově získaných</div>
                <div><strong>Tier:</strong> pásmo dle počtu nových</div>
                <div><strong>Provize nové:</strong> noví × 2000 Kč × %</div>
                <div><strong>Portfolio:</strong> klienti v okně 2-6M × 50% retence</div>
                <div><strong>Provize portfolio:</strong> portfolio × 2000 Kč × 2%</div>
                <div><strong>Partner:</strong> orientační typ partnera</div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50">
                  <th className="p-2 text-left">Měsíc</th>
                  <th className="p-2 text-center">Partner</th>
                  <th className="p-2 text-center">Noví</th>
                  <th className="p-2 text-center">Tier</th>
                  <th className="p-2 text-right">Provize nové</th>
                  <th className="p-2 text-center">Portfolio</th>
                  <th className="p-2 text-right">Provize portf.</th>
                  <th className="p-2 text-right">Fixní</th>
                  <th className="p-2 text-right font-bold">Celkem</th>
                </tr>
              </thead>
              <tbody>
                {calculations.months.slice(0, 6).map((m) => (
                  <tr key={m.month} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-medium">M{m.month}</td>
                    <td className="p-2 text-center text-xs text-gray-600">{m.partner}</td>
                    <td className="p-2 text-center font-semibold text-orange-600">{m.newClients}</td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{m.tier} ({m.tierPercent}%)</span>
                    </td>
                    <td className="p-2 text-right">{formatCurrency(m.newCommission)}</td>
                    <td className="p-2 text-center text-gray-600">{m.portfolio}</td>
                    <td className="p-2 text-right">{formatCurrency(m.portfolioCommission)}</td>
                    <td className="p-2 text-right text-gray-600">{formatCurrency(m.fixed)}</td>
                    <td className="p-2 text-right font-bold text-green-700">{formatCurrency(m.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-orange-300 bg-orange-50 font-semibold">
                  <td className="p-2" colSpan={8}>Celkem M1–6</td>
                  <td className="p-2 text-right text-green-700">{formatCurrency(calculations.activeTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Passive Months Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Měsíce 7–12: Dobíhající provize
            <span className="ml-2 text-sm font-normal text-gray-500">
              (po ukončení aktivní práce)
            </span>
          </h2>
          
          {showExplanations && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
              <strong>Vysvětlení:</strong> Po odchodu obchodníka mu stále náleží 2% provize z portfolia klientů, 
              kteří jsou v okně 2-6 měsíců od své akvizice. Postupně kohorty vypadávají z okna.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Měsíc</th>
                  <th className="p-2 text-center">Portfolio v okně</th>
                  <th className="p-2 text-right">Provize portfolio</th>
                  <th className="p-2 text-left">Poznámka</th>
                </tr>
              </thead>
              <tbody>
                {calculations.months.slice(6).map((m, i) => (
                  <tr key={m.month} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-medium">M{m.month}</td>
                    <td className="p-2 text-center text-gray-600">{m.portfolio}</td>
                    <td className="p-2 text-right font-semibold">{formatCurrency(m.portfolioCommission)}</td>
                    <td className="p-2 text-sm text-gray-500">
                      {m.portfolio > 0 
                        ? `Kohorty M${Math.max(1, m.month - 5)}–M6 aktivní`
                        : 'Všichni mimo okno'
                      }
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-100 font-semibold">
                  <td className="p-2" colSpan={2}>Celkem M7–12</td>
                  <td className="p-2 text-right text-green-700">{formatCurrency(calculations.passiveTotal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Souhrn za období M1–6</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-80">Získaných klientů</div>
              <div className="text-2xl font-bold">{calculations.totalClients}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-80">Celkový výdělek M1–6</div>
              <div className="text-2xl font-bold">{formatCurrency(calculations.activeTotal)}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-80">Průměrný měsíční výdělek</div>
              <div className="text-2xl font-bold">{formatCurrency(calculations.activeTotal / 6)}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-80">Dobíhající M7–12</div>
              <div className="text-2xl font-bold">{formatCurrency(calculations.passiveTotal)}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/30">
            <span className="text-sm opacity-80">Průměrné CPA per klient (vč. fixu): </span>
            <span className="font-bold">{formatCurrency(calculations.avgCPA)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Předpoklady: průměrná útrata {formatCurrency(AVG_ORDER)}/měsíc, retence {RETENTION * 100}%</p>
          <p className="mt-1">Komfi Health s.r.o. • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

export default Calculator;
