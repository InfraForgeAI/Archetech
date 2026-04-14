import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Compass, 
  Calculator, 
  Send, 
  Loader2, 
  Building2,
  Layers,
  Zap,
  DollarSign,
  TrendingUp,
  Users,
  Terminal,
  FileCode,
  Database,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  Globe,
  Languages
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { translations, type Language } from './translations';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'mentor' | 'estimator';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // Determine API Base URL
  // If we are on Netlify or another domain, we need to point to the AI Studio backend
  const API_BASE = window.location.hostname.includes('netlify.app') 
    ? 'https://ais-pre-x5zspkvx3p6l3qnoufolsi-125935498137.europe-west1.run.app'
    : '';

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [aiCost, setAiCost] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('mentor');
  const [loadingMessage, setLoadingMessage] = useState(t.loadingMessages[0]);
  const [showSql, setShowSql] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Cost Estimator State
  const [users, setUsers] = useState(1000);
  const [growth, setGrowth] = useState(20);
  const [months, setMonths] = useState(12);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const loadingMessages = t.loadingMessages;

  useEffect(() => {
    if (loading) {
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading, loadingMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setBlueprint(null);
    setAiCost(null);
    setSaveStatus('idle');
    try {
      const response = await fetch(`${API_BASE}/api/generate-blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, lang }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      setBlueprint(data.blueprint);
      setAiCost(data.estimatedCost);
    } catch (error: any) {
      console.error("Generation Error:", error);
      setBlueprint(lang === 'en' 
        ? `Error: ${error.message || 'Please check your connection and try again.'}` 
        : `Грешка: ${error.message || 'Проверете ја врската и обидете се повторно.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!blueprint) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/save-blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: input.slice(0, 50) + '...', 
          content: blueprint, 
          estimatedCost: aiCost 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const calculateCosts = () => {
    const data = [];
    let currentUsers = users;
    // Base cost adjusted by prompt size if available
    const promptMultiplier = input.length > 500 ? 1.5 : 1;
    
    for (let i = 0; i <= months; i++) {
      const apiCost = currentUsers * 0.05 * promptMultiplier;
      const dbCost = currentUsers * 0.02;
      const total = apiCost + dbCost + 50;
      
      data.push({
        month: i,
        users: Math.round(currentUsers),
        cost: Math.round(total)
      });
      currentUsers *= (1 + growth / 100);
    }
    return data;
  };

  const costData = calculateCosts();

  return (
    <div ref={containerRef} className="min-h-screen bg-[#F5F5F4] text-[#1A1A1A] selection:bg-black selection:text-white">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-black z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Header */}
      <header className="border-b border-black bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="bg-black p-2 rounded-none transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter uppercase leading-none">{t.title}</span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{t.subtitle}</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'mk' : 'en')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              <Languages className="w-4 h-4" />
              {lang === 'en' ? 'MK' : 'EN'}
            </button>

            <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-none border border-black/5">
              {[
                { id: 'mentor', label: t.mentor, icon: Compass },
                { id: 'estimator', label: t.estimator, icon: Calculator }
              ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all relative overflow-hidden",
                  activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-black"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-black -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-12">
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              <Sparkles className="w-3 h-3" />
              {lang === 'en' ? 'AI-Powered Architecture' : 'AI-Архитектура'}
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-[0.9] mb-8">
              {t.drafting} <br />
              <span className="text-gray-300 italic font-serif">{t.theFuture}</span>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md">
              {t.heroText}
            </p>
          </motion.section>

          <AnimatePresence mode="wait">
            {activeTab === 'mentor' ? (
              <motion.div
                key="mentor-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-black to-gray-400 opacity-20 group-focus-within:opacity-100 transition duration-500 blur-sm" />
                    <div className="relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full h-80 p-6 bg-white border border-black rounded-none focus:ring-0 focus:border-black resize-none text-sm placeholder:text-gray-300 transition-all font-mono"
                      />
                      <div className="absolute bottom-4 right-4 flex items-center gap-4 text-[10px] font-mono text-gray-400 uppercase">
                        <div className="flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          {input.length} {t.chars}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="group w-full bg-black text-white py-5 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all active:scale-[0.98] relative overflow-hidden"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.processing}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        {t.generate}
                      </>
                    )}
                  </button>
                </form>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: ShieldCheck, label: t.secureRls, sub: t.supabaseReady },
                    { icon: Cpu, label: t.qwenModel, sub: t.intelligence }
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-black/5 bg-white/50 flex flex-col gap-1">
                      <item.icon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                      <span className="text-[9px] text-gray-400 uppercase">{item.sub}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="estimator-controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8 bg-white p-8 border border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="w-5 h-5" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em]">{t.financialProjection}</h2>
                </div>
                
                <div className="space-y-8">
                  {[
                    { label: t.initialUsers, val: users, set: setUsers, min: 100, max: 10000, step: 100, suffix: '' },
                    { label: t.monthlyGrowth, val: growth, set: setGrowth, min: 0, max: 100, step: 5, suffix: '%' },
                    { label: t.projectionPeriod, val: months, set: setMonths, min: 1, max: 24, step: 1, suffix: 'm' }
                  ].map((param, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{param.label}</label>
                        <span className="text-lg font-black tracking-tighter">{param.val.toLocaleString()}{param.suffix}</span>
                      </div>
                      <input 
                        type="range" min={param.min} max={param.max} step={param.step}
                        value={param.val} onChange={(e) => param.set(Number(e.target.value))}
                        className="w-full h-1 bg-gray-100 appearance-none cursor-pointer accent-black hover:accent-gray-800 transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-gray-100 flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-full">
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed italic">
                    {t.infrastructureNote}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center border border-dashed border-black/20 bg-white/30 backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                </div>
                
                <div className="relative mb-12">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 border border-black/10 rounded-full flex items-center justify-center"
                  >
                    <div className="w-24 h-24 border-t-2 border-black rounded-full" />
                  </motion.div>
                  <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8" />
                </div>
                
                <div className="text-center space-y-4">
                  <motion.p 
                    key={loadingMessage}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="font-mono text-[10px] uppercase tracking-[0.4em] text-black"
                  >
                    {loadingMessage}
                  </motion.p>
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div 
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1 h-1 bg-black rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'mentor' ? (
              blueprint ? (
                <motion.div
                  key="blueprint-result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative"
                >
                  <div className="flex items-center justify-between px-8 py-6 border-b border-black">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <FileCode className="w-4 h-4" />
                        {showSql ? t.databaseSchema : t.systemArchitecture}
                      </div>
                      {aiCost && (
                        <div className="px-2 py-0.5 bg-gray-100 text-[9px] font-mono text-gray-500 uppercase">
                          {t.estCost}: ${aiCost.toFixed(4)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowSql(!showSql)}
                        className={cn(
                          "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-black transition-all",
                          showSql ? "bg-black text-white" : "hover:bg-gray-50"
                        )}
                      >
                        {showSql ? t.viewBlueprint : t.viewSql}
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={saving || saveStatus === 'success'}
                        className={cn(
                          "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-black transition-all flex items-center gap-2",
                          saveStatus === 'success' ? "bg-green-500 text-white border-green-500" : 
                          saveStatus === 'error' ? "bg-red-500 text-white border-red-500" :
                          "bg-black text-white hover:bg-gray-800"
                        )}
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                        {saveStatus === 'success' ? t.saved : saveStatus === 'error' ? t.error : t.saveSupabase}
                      </button>
                    </div>
                  </div>

                  <div className="p-8 md:p-12 max-h-[800px] overflow-y-auto custom-scrollbar">
                    <div className="markdown-body">
                      {showSql ? (
                        <div className="space-y-6">
                          <div className="p-4 bg-gray-50 border-l-4 border-black text-[10px] font-mono uppercase tracking-widest">
                            Generated Supabase SQL Schema
                          </div>
                          <ReactMarkdown>
                            {blueprint.split('4. Supabase SQL Schema')[1]?.split('5. The "First Brick"')[0] || 'SQL Schema not found in blueprint.'}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <ReactMarkdown>{blueprint}</ReactMarkdown>
                      )}
                    </div>
                  </div>

                  {/* Floating Action */}
                  <div className="absolute -bottom-6 -right-6">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-black text-white p-4 shadow-xl"
                    >
                      <Database className="w-6 h-6" />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center border border-dashed border-black/10 rounded-none text-gray-300 group hover:border-black/30 transition-colors">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Layers className="w-16 h-16 mb-6 opacity-20 group-hover:opacity-40 transition-opacity" />
                  </motion.div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em]">{t.awaitingInput}</p>
                </div>
              )
            ) : (
              <motion.div
                key="estimator-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Users, label: t.finalScale, val: costData[costData.length - 1].users.toLocaleString(), sub: t.activeUsers },
                    { icon: DollarSign, label: t.monthlyBurn, val: `$${costData[costData.length - 1].cost.toLocaleString()}`, sub: t.infrastructure },
                    { icon: TrendingUp, label: t.growthFactor, val: `${Math.round((costData[costData.length - 1].users / users - 1) * 100)}%`, sub: t.totalIncrease }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white border border-black p-8 group hover:bg-black hover:text-white transition-colors duration-500"
                    >
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-500 mb-4">
                        <stat.icon className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <div className="text-4xl font-black tracking-tighter mb-1">{stat.val}</div>
                      <div className="text-[9px] uppercase tracking-widest opacity-40">{stat.sub}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white border border-black p-10 shadow-[24px_24px_0px_0px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h2 className="text-xl font-black tracking-tight uppercase mb-1">{t.burnRateAnalysis}</h2>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{t.monthProjection}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-black" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{t.cost}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-200" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{t.users}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {costData.map((d, i) => (
                      <div key={i} className="group">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-2 opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-gray-300" />
                            {t.month} {d.month}
                          </span>
                          <span className="font-bold">${d.cost} / {d.users.toLocaleString()} {t.users.toLowerCase()}</span>
                        </div>
                        <div className="h-1.5 bg-gray-50 w-full relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(d.cost / costData[costData.length - 1].cost) * 100}%` }}
                            className="absolute inset-y-0 left-0 bg-black z-10"
                          />
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(d.users / costData[costData.length - 1].users) * 100}%` }}
                            className="absolute inset-y-0 left-0 bg-gray-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-black text-white p-10 flex items-start gap-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <Zap className="w-8 h-8 text-yellow-400 shrink-0" />
                  <div className="relative z-10">
                    <h3 className="font-black uppercase tracking-[0.2em] text-sm mb-4">{t.architectStrategy}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-serif italic">
                      {lang === 'en' ? (
                        `"At ${costData[costData.length - 1].users.toLocaleString()} users, your infrastructure will face significant pressure. Prioritize horizontal scaling, implement Redis for session management, and ensure your Supabase RLS policies are optimized for query performance. The foundation you build today determines the height you can reach tomorrow."`
                      ) : (
                        `"Со ${costData[costData.length - 1].users.toLocaleString()} корисници, вашата инфраструктура ќе се соочи со значителен притисок. Дајте приоритет на хоризонталното скалирање, имплементирајте Redis за управување со сесии и погрижете се вашите Supabase RLS политики да бидат оптимизирани за перформанси. Темелот што го градите денес ја одредува висината што можете да ја достигнете утре."`
                      )}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black bg-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-tighter">{t.title} Studio</span>
            </div>
            <div className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.3em]">
              {t.footerText}
            </div>
          </div>
          <div className="flex items-center gap-12">
            {[
              { label: t.documentation, href: '#' },
              { label: t.supabaseIntegration, href: '#' },
              { label: t.openRouterApi, href: '#' }
            ].map((link, i) => (
              <a key={i} href={link.href} className="text-[9px] font-bold uppercase tracking-widest hover:text-gray-400 transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000;
        }
        .markdown-body {
          font-size: 0.875rem;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
