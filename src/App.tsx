import React, { useState, useMemo } from 'react';
import { 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  Wind, 
  Milk, 
  Beef, 
  Egg,
  ExternalLink,
  CloudRain,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Types ---

type RiskLevel = 'Safety' | 'Discomfort' | 'Alert' | 'Danger' | 'Extreme';

interface RiskData {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  icon: React.ReactNode;
  recommendations: string[];
}

const RISK_CONFIG: Record<RiskLevel, RiskData> = {
  Safety: {
    label: 'Zona di Sicurezza - Safety',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    dotColor: 'bg-emerald-500',
    icon: <ShieldCheck className="w-5 h-5" />,
    recommendations: [
      'Mantenere i normali regimi di ventilazione.',
      'Assicurare acqua fresca e pulita sempre disponibile.',
      'Monitorare le previsioni meteo per i giorni successivi.'
    ]
  },
  Discomfort: {
    label: 'Disagio - Discomfort',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
    dotColor: 'bg-amber-500',
    icon: <Info className="w-5 h-5" />,
    recommendations: [
      'Aumentare la velocità dell\'aria a livello degli animali.',
      'Controllare il corretto funzionamento degli abbeveratoi.',
      'Evitare spostamenti o trattamenti nelle ore più calde.'
    ]
  },
  Alert: {
    label: 'Allerta - Alert',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100',
    dotColor: 'bg-orange-500',
    icon: <AlertTriangle className="w-5 h-5" />,
    recommendations: [
      'Attivare i ventilatori o i movimentatori d\'aria a pieno regime.',
      'Iniziare il raffrescamento evaporativo (misting/soaking) nelle zone di attesa.',
      'Aumentare la frequenza di pulizia delle corsie per ridurre l\'umidità.'
    ]
  },
  Danger: {
    label: 'Pericolo - Danger',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    dotColor: 'bg-red-500',
    icon: <AlertTriangle className="w-5 h-5" />,
    recommendations: [
      'Raffrescamento intensivo: ventilazione forzata combinata con bagnatura (soaking).',
      'Ridurre la densità di stalla se possibile.',
      'Spostare la somministrazione della razione nelle ore più fresche (alba/tramonto).',
      'Aggiungere sali minerali e tamponi alla dieta.'
    ]
  },
  Extreme: {
    label: 'Estremo Pericolo - Extreme',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100',
    dotColor: 'bg-purple-500',
    icon: <AlertTriangle className="w-5 h-5" />,
    recommendations: [
      'MISURE DI EMERGENZA: Raffrescamento continuo h24.',
      'Monitoraggio costante della frequenza respiratoria degli animali.',
      'Evitare qualsiasi stress aggiuntivo agli animali.',
      'Rischio elevato di mortalità: allertare il veterinario aziendale.'
    ]
  }
};

const PRODUCTION_LOSSES = [
  {
    category: 'Vacche da Latte',
    icon: <Milk className="w-5 h-5" />,
    loss: 'Riduzione produzione latte: 1.0 - 3.5+ kg/capo/giorno.',
    source: 'NRC (2001); Zimbelman et al. (2009)',
    threshold: 'THI > 68-72'
  },
  {
    category: 'Suini all\'ingrasso',
    icon: <Beef className="w-5 h-5" />,
    loss: 'Riduzione accrescimento giornaliero (ADG) fino al 15-20%.',
    source: 'St-Pierre et al. (2003)',
    threshold: 'THI > 74'
  },
  {
    category: 'Galline Ovaiole',
    icon: <Egg className="w-5 h-5" />,
    loss: 'Riduzione peso uova e qualità del guscio.',
    source: 'Daghir (2008)',
    threshold: 'T > 30°C'
  }
];

// --- Helper Functions ---

const calculateTHI = (T: number, UR: number) => {
  return (1.8 * T) - ((1 - UR / 100) * (T - 14.3)) + 32;
};

const getSVP = (T: number) => 6.112 * Math.exp((17.67 * T) / (T + 243.5));

const getWetBulb = (T: number, RH: number) => {
  // Stull's formula for Wet Bulb Temperature
  return T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) + 
         Math.atan(T + RH) - 
         Math.atan(RH - 1.676331) + 
         0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 
         4.686035;
};

// --- Main Component ---

export default function App() {
  const [temp, setTemp] = useState<number>(25);
  const [humidity, setHumidity] = useState<number>(60);

  const calculations = useMemo(() => {
    const T = temp;
    const UR = humidity;

    const thi = calculateTHI(T, UR);

    // Dew Point (Magnus Formula)
    const b = 17.27;
    const c = 237.7;
    const gamma = Math.log(UR / 100) + (b * T) / (c + T);
    const dewPoint = (c * gamma) / (b - gamma);

    // Adiabatic Evaporative Capacity (g/m3)
    // Refers to the amount of water that can be evaporated until saturation is reached (Wet Bulb)
    const es = getSVP(T);
    const ea = es * (UR / 100);
    const Tw = getWetBulb(T, UR);
    const es_tw = getSVP(Tw);
    
    const P = 1013.25; // Standard atmospheric pressure (hPa)
    const w = 0.622 * ea / (P - ea);
    const w_s_tw = 0.622 * es_tw / (P - es_tw);
    
    // Dry air density (kg/m3)
    const rho_dry = ((P - ea) * 100 * 0.0289644) / (8.31447 * (T + 273.15));
    const evaporativeCapacity = (w_s_tw - w) * rho_dry * 1000;

    let risk: RiskLevel = 'Safety';
    if (thi >= 84) risk = 'Extreme';
    else if (thi >= 79) risk = 'Danger';
    else if (thi >= 75) risk = 'Alert';
    else if (thi >= 72) risk = 'Discomfort';

    return {
      thi: parseFloat(thi.toFixed(1)),
      dewPoint: parseFloat(dewPoint.toFixed(1)),
      evaporativeCapacity: parseFloat(evaporativeCapacity.toFixed(2)),
      risk
    };
  }, [temp, humidity]);

  const sensitivityData = useMemo(() => {
    // Range +/- 2°C with 0.2°C step (21 points)
    const tempRange = Array.from({ length: 21 }, (_, i) => parseFloat((temp - 2 + i * 0.2).toFixed(1)));
    // Range +/- 10% with 1% step (21 points)
    const humidityRange = Array.from({ length: 21 }, (_, i) => humidity - 10 + i);

    const tempSensitivity = tempRange.map(t => ({
      name: `${t}°C`,
      thi: parseFloat(calculateTHI(t, humidity).toFixed(1)),
      current: Math.abs(t - temp) < 0.01
    }));

    const humiditySensitivity = humidityRange.map(h => ({
      name: `${h}%`,
      thi: parseFloat(calculateTHI(temp, h).toFixed(1)),
      current: h === humidity
    }));

    // Calculate critical points (where THI crosses thresholds)
    const thresholds = [72, 75, 79, 84];
    const k = 1 - humidity / 100;
    
    const criticalTemps = thresholds.map(th => {
      const t = (th - 32 - 14.3 * k) / (1.8 - k);
      return { threshold: th, value: parseFloat(t.toFixed(1)) };
    }).filter(cp => cp.value >= temp - 2 && cp.value <= temp + 2);

    const criticalHumidities = thresholds.map(th => {
      const h = 100 * (1 + (th - 1.8 * temp - 32) / (temp - 14.3));
      return { threshold: th, value: Math.round(h) };
    }).filter(cp => cp.value >= humidity - 10 && cp.value <= humidity + 10);

    return { tempSensitivity, humiditySensitivity, criticalTemps, criticalHumidities };
  }, [temp, humidity]);

  const riskInfo = RISK_CONFIG[calculations.risk];

  // Data for the gauge
  const gaugeData = [
    { value: Math.min(Math.max(calculations.thi - 60, 0), 40) },
    { value: Math.max(40 - (calculations.thi - 60), 0) }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation / Header */}
      <header className="bg-slate-900 text-slate-100 border-b border-slate-800 px-6 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Wind className="w-64 h-64" />
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
                <Thermometer className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-black tracking-tight text-white">Livestock Heat Stress Calculator</h1>
                <p className="text-sm font-medium text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Uno Strumento Integrato per il Calcolo del THI e per la Gestione dello Stress da Calore negli Animali
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 border border-white/10">
                <Milk className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 border border-white/10">
                <Wind className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 border border-white/10">
                <Beef className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 w-full flex-1 space-y-8">
        
        {/* 1) Parametri Ambientali */}
        <section className="glass-card p-8 rounded-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Thermometer className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-800">Parametri Ambientali</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="label-text mb-0">Temperatura Aria</label>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" 
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-right text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      step="0.5"
                    />
                    <span className="text-xs font-bold text-slate-400">°C</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="50" 
                  step="0.5"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                  <span>10°C</span>
                  <span>50°C</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="label-text mb-0">Umidità Relativa</label>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" 
                      value={humidity}
                      onChange={(e) => setHumidity(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-right text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Temperatura di Rugiada</span>
                <span className="font-mono text-lg font-bold text-slate-900">{calculations.dewPoint}°C</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Indice di Max Evaporazione</span>
                <span className="font-mono text-lg font-bold text-slate-900">{calculations.evaporativeCapacity} g/m³</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2) Calcolo THI */}
        <section className={cn("glass-card p-8 rounded-xl border-l-8", riskInfo.borderColor.replace('border-', 'border-l-'))}>
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-48 h-48 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    startAngle={180}
                    endAngle={0}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill={calculations.thi >= 72 ? (calculations.thi >= 79 ? (calculations.thi >= 84 ? '#9333ea' : '#dc2626') : '#f59e0b') : '#10b981'} />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-5xl font-display font-black text-slate-900">{calculations.thi}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Indice THI</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2.5 rounded-xl", riskInfo.bgColor)}>
                  {riskInfo.icon}
                </div>
                <h3 className={cn("text-3xl font-display font-bold tracking-tight", riskInfo.color)}>
                  {riskInfo.label}
                </h3>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">
                L'attuale combinazione di temperatura e umidità determina un indice di stress termico pari a <span className="font-bold text-slate-900">{calculations.thi}</span>. 
                Questo valore ricade nella categoria <span className="font-bold">{riskInfo.label.toLowerCase()}</span>.
              </p>
            </div>
          </div>
        </section>

        {/* 3) Provvedimenti Consigliati */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-800">Provvedimenti Consigliati</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskInfo.recommendations.map((rec, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5 rounded-xl flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", riskInfo.dotColor)} />
                <span className="text-sm text-slate-600 leading-relaxed font-medium">{rec}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4) Analisi Sensibilità */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-800">Analisi Sensibilità</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">Variazione THI vs Temperatura</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensitivityData.tempSensitivity} margin={{ left: 10, right: 30, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={9} 
                      tick={{ fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: 'Temperatura (°C)', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      fontSize={9} 
                      tick={{ fill: '#64748b' }} 
                      width={35} 
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: 'THI', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#1e293b' }}
                    />
                    <ReferenceLine y={72} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: '72', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={75} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'right', value: '75', fill: '#f97316', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={79} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'right', value: '79', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={84} stroke="#9333ea" strokeDasharray="3 3" label={{ position: 'right', value: '84', fill: '#9333ea', fontSize: 10, fontWeight: 'bold' }} />
                    <Line 
                      type="monotone" 
                      dataKey="thi" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.current) return <circle key={`dot-t-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#10b981" stroke="white" strokeWidth={2} />;
                        return null;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {sensitivityData.criticalTemps.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Punti di Transizione</p>
                  <div className="space-y-1">
                    {sensitivityData.criticalTemps.map((cp, i) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Soglia {cp.threshold}:</span>
                        <span className="font-bold text-slate-700">{cp.value}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-6 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">Variazione THI vs Umidità</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensitivityData.humiditySensitivity} margin={{ left: 10, right: 30, top: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={9} 
                      tick={{ fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: 'Umidità Relativa (%)', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      fontSize={10} 
                      tick={{ fill: '#64748b' }} 
                      width={35} 
                      axisLine={false} 
                      tickLine={false}
                      label={{ value: 'THI', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#1e293b' }}
                    />
                    <ReferenceLine y={72} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'right', value: '72', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={75} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'right', value: '75', fill: '#f97316', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={79} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'right', value: '79', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={84} stroke="#9333ea" strokeDasharray="3 3" label={{ position: 'right', value: '84', fill: '#9333ea', fontSize: 10, fontWeight: 'bold' }} />
                    <Line 
                      type="monotone" 
                      dataKey="thi" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.current) return <circle key={`dot-h-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#3b82f6" stroke="white" strokeWidth={2} />;
                        return null;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {sensitivityData.criticalHumidities.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Punti di Transizione</p>
                  <div className="space-y-1">
                    {sensitivityData.criticalHumidities.map((cp, i) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Soglia {cp.threshold}:</span>
                        <span className="font-bold text-slate-700">{cp.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5) Impatto Produttivo Stimato */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-800">Impatto Produttivo Stimato</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRODUCTION_LOSSES.map((item, idx) => (
              <div key={idx} className="glass-card p-6 rounded-xl flex flex-col hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                    {item.icon}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{item.category}</h4>
                </div>
                <p className="text-sm text-slate-600 italic mb-4 leading-relaxed flex-1">
                  "{item.loss}"
                </p>
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Soglia: {item.threshold}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    Fonte: {item.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6) Nota Tecnica */}
        <section className="p-8 rounded-xl bg-slate-900 text-slate-100 border-none overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <CloudRain className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight">Nota Tecnica</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
                <p>
                  L'indice THI (Temperature-Humidity Index) è lo standard internazionale per valutare lo stress da calore nei bovini. 
                  La formula utilizzata è quella di <strong className="text-slate-200">NRC (1971)</strong>, validata per le vacche da latte.
                </p>
                <p>
                  Fattori come l'irraggiamento solare e la velocità dell'aria influenzano la percezione reale. 
                  La ventilazione forzata può mitigare significativamente l'impatto del THI elevato.
                </p>
              </div>
              <div className="flex flex-col justify-end gap-3">
                <a 
                  href="https://www.meteo.fvg.it/thi.php?ln" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Monitoraggio Indice Bioclimatico Bovine in FVG</span>
                  <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a 
                  href="https://www.thedairysite.com/articles/4101/climate-change-could-lower-milk-yields-through-heat-stress" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">The Dairy Site</span>
                  <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-xs font-medium">© 2026 Livestock Heat Stress Calculator • Sviluppato da francesco.daborso@uniud.it</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Versione 2.1.0</span>
            <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <Info className="w-4 h-4" />
              <span className="text-xs font-medium">Supporto Tecnico</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
