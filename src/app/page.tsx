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

const GOALS = {
  movies: 100,
  workouts: 100,
  smash_sets: 100,
  total: 300
};

export default function Home() {
  const [data, setData] = useState<PersonData[]>([]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('realtime progress')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'progress' }, (payload) => {
        setData((prev) => prev.map((item) => item.id === (payload.new as PersonData).id ? (payload.new as PersonData) : item));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('progress').select('*').order('id');
    if (data) setData(data);
  };

  const updateCount = async (person: string, category: keyof PersonData, change: number) => {
    const personStats = data.find((p) => p.person === person);
    if (!personStats) return;
    const newValue = Math.max(0, (personStats[category] as number) + change);
    await supabase.from('progress').update({ [category]: newValue }).eq('person', person);
  };

  // Funksjon for å beregne totalt for en person
  const calculateTotal = (p: PersonData) => p.movies + p.workouts + p.smash_sets;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent italic">
            THE 2026 CHALLENGE
          </h1>
          <p className="text-slate-400 tracking-widest uppercase text-sm">Emil vs Jørgen</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.map((person) => {
            const totalScore = calculateTotal(person);
            const totalPercent = Math.round((totalScore / GOALS.total) * 100);

            return (
              <div key={person.id} className="relative bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700 shadow-2xl overflow-hidden">
                {/* Total Progress Bakgrunnseffekt */}
                <div className="absolute top-0 right-0 p-4">
                   <span className="text-5xl font-black text-slate-700/30 italic">{totalPercent}%</span>
                </div>

                <h2 className="text-4xl font-bold mb-8 italic tracking-tight">{person.person}</h2>

                {/* TOTAL OVERALL BAR */}
                <div className="mb-10 p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                  <div className="flex justify-between mb-2 items-center">
                    <span className="text-xs font-bold uppercase tracking-tighter text-yellow-500">Total Progresjon</span>
                    <span className="text-xl font-mono font-bold">{totalScore} <span className="text-xs text-slate-500">/ {GOALS.total}</span></span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-4">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                      style={{ width: `${totalPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <StatBar 
                    label="🎬 Filmer sett" 
                    current={person.movies} 
                    goal={GOALS.movies} 
                    color="from-blue-600 to-cyan-400" 
                    onPlus={() => updateCount(person.person, 'movies', 1)}
                    onMinus={() => updateCount(person.person, 'movies', -1)}
                  />
                  <StatBar 
                    label="💪 Treningsøkter" 
                    current={person.workouts} 
                    goal={GOALS.workouts} 
                    color="from-emerald-600 to-green-400" 
                    onPlus={() => updateCount(person.person, 'workouts', 1)}
                    onMinus={() => updateCount(person.person, 'workouts', -1)}
                  />
                  <StatBar 
                    label="🎮 Smash Sets" 
                    current={person.smash_sets} 
                    goal={GOALS.smash_sets} 
                    color="from-red-600 to-orange-400" 
                    onPlus={() => updateCount(person.person, 'smash_sets', 1)}
                    onMinus={() => updateCount(person.person, 'smash_sets', -1)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function StatBar({ label, current, goal, color, onPlus, onMinus }: any) {
  const percent = Math.min(100, Math.round((current / goal) * 100));
  
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-slate-200">{label}</span>
        <div className="flex items-center gap-3">
          <button onClick={onMinus} className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-full transition-colors text-xl">-</button>
          <span className="w-12 text-center font-mono font-bold text-lg">{current}</span>
          <button onClick={onPlus} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-white text-black rounded-full transition-colors text-xl font-bold">+</button>
        </div>
      </div>
      <div className="relative w-full bg-slate-900 rounded-full h-3 overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-end mt-1">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{percent}% fullført</span>
      </div>
    </div>
  );
}
