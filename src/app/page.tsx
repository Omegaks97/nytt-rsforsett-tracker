'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import './globals.css';

type PersonData = {
  id: number;
  person: string;
  movies: number;
  workouts: number;
  smash_sets: number;
};

const GOALS = { movies: 100, workouts: 100, smash_sets: 100, total: 300 };

export default function Home() {
  const [data, setData] = useState<PersonData[]>([]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('realtime-p').on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'progress' }, 
      (payload) => {
        setData((prev) => prev.map((item) => item.id === (payload.new as PersonData).id ? (payload.new as PersonData) : item));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('progress').select('*').order('id');
    if (data) setData(data);
  };

  const updateCount = async (person: string, category: keyof PersonData, change: number) => {
    const p = data.find((p) => p.person === person);
    if (!p) return;
    const newValue = Math.max(0, (p[category] as number) + change);
    await supabase.from('progress').update({ [category]: newValue }).eq('person', person);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-16 tracking-tight text-yellow-400">
          🏆 CHALLENGE 2026 🏆
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.map((p) => {
            const total = p.movies + p.workouts + p.smash_sets;
            const totalPct = Math.min(100, Math.round((total / GOALS.total) * 100));

            return (
              <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-xl">
                <div className="flex justify-between items-end mb-2">
                   <h2 className="text-4xl font-black italic tracking-tighter uppercase">{p.person}</h2>
                   <span className="text-yellow-400 font-mono font-bold text-xl">{totalPct}%</span>
                </div>
                
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                   Total progresjon ({total}/300)
                </p>

                {/* HOVEDPROGRESJON BAR */}
                <div className="w-full bg-slate-900 h-4 rounded-full mb-12 overflow-hidden border border-slate-700">
                  <div 
                    className="bg-yellow-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
                    style={{ width: `${totalPct}%` }} 
                  />
                </div>

                <div className="space-y-10">
                  <StatRow label="🎬 Filmer" val={p.movies} goal={GOALS.movies} color="bg-cyan-500" onPlus={() => updateCount(p.person, 'movies', 1)} onMinus={() => updateCount(p.person, 'movies', -1)} />
                  <StatRow label="💪 Trening" val={p.workouts} goal={GOALS.workouts} color="bg-emerald-500" onPlus={() => updateCount(p.person, 'workouts', 1)} onMinus={() => updateCount(p.person, 'workouts', -1)} />
                  <StatRow label="🎮 Smash" val={p.smash_sets} goal={GOALS.smash_sets} color="bg-rose-500" onPlus={() => updateCount(p.person, 'smash_sets', 1)} onMinus={() => updateCount(p.person, 'smash_sets', -1)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function StatRow({ label, val, goal, color, onPlus, onMinus }: any) {
  const pct = Math.min(100, Math.round((val / goal) * 100));
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-slate-200 text-sm tracking-wide">{label}</span>
        <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
          <button onClick={onMinus} className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">-</button>
          <span className="w-8 text-center font-mono font-bold text-lg">{val}</span>
          <button onClick={onPlus} className="w-8 h-8 flex items-center justify-center bg-white text-black hover:bg-yellow-400 rounded-md transition-colors font-bold">+</button>
        </div>
      </div>
      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
        <div 
          className={`${color} h-full rounded-full transition-all duration-700 shadow-sm`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}
