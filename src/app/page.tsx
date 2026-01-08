'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
    <main className="min-h-screen bg-[#0f172a] text-white p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-center mb-12 tracking-tighter text-yellow-500 uppercase">
          🏆 Challenge 2026 🏆
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {data.map((p) => {
            const total = p.movies + p.workouts + p.smash_sets;
            const totalPct = Math.min(100, Math.round((total / GOALS.total) * 100));

            return (
              <div key={p.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-3xl font-bold mb-1">{p.person}</h2>
                <div className="text-sm text-slate-400 mb-6 uppercase tracking-widest font-bold">
                  Total: {totalPct}% ({total}/300)
                </div>

                {/* TOTAL BAR */}
                <div className="w-full bg-slate-900 h-3 rounded-full mb-10">
                  <div className="bg-yellow-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_#eab308]" style={{ width: `${totalPct}%` }} />
                </div>

                <div className="space-y-8">
                  <StatRow label="🎬 Filmer" val={p.movies} goal={GOALS.movies} color="bg-blue-500" onPlus={() => updateCount(p.person, 'movies', 1)} onMinus={() => updateCount(p.person, 'movies', -1)} />
                  <StatRow label="💪 Trening" val={p.workouts} goal={GOALS.workouts} color="bg-emerald-500" onPlus={() => updateCount(p.person, 'workouts', 1)} onMinus={() => updateCount(p.person, 'workouts', -1)} />
                  <StatRow label="🎮 Smash" val={p.smash_sets} goal={GOALS.smash_sets} color="bg-red-500" onPlus={() => updateCount(p.person, 'smash_sets', 1)} onMinus={() => updateCount(p.person, 'smash_sets', -1)} />
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
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-slate-300 uppercase text-xs">{label}</span>
        <div className="flex items-center gap-3">
          <button onClick={onMinus} className="bg-slate-700 hover:bg-slate-600 px-2 rounded">-</button>
          <span className="font-mono font-bold">{val}</span>
          <button onClick={onPlus} className="bg-white text-black px-2 rounded font-bold hover:bg-slate-200">+</button>
        </div>
      </div>
      <div className="w-full bg-slate-900 h-2 rounded-full">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
