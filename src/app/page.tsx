'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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
};

export default function Home() {
  const [data, setData] = useState<PersonData[]>([]);

  // Hent data ved oppstart og sett opp Real-time lytter
  useEffect(() => {
    fetchData();

    // Dette er magien som gjør at Emil ser Jørgens oppdatering umiddelbart
    const channel = supabase
      .channel('realtime progress')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'progress' },
        (payload) => {
          console.log('Endring oppdaget!', payload);
          // Oppdater state basert på den nye raden som kom inn
          setData((prev) =>
            prev.map((item) =>
              item.id === (payload.new as PersonData).id ? (payload.new as PersonData) : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('progress').select('*').order('id');
    if (data) setData(data);
  };

  const updateCount = async (person: string, category: keyof PersonData, change: number) => {
    // Finn nåværende verdi
    const personStats = data.find((p) => p.person === person);
    if (!personStats) return;
    
    // Beregn ny verdi (kan ikke være under 0)
    // @ts-ignore
    const newValue = Math.max(0, personStats[category] + change);

    // Send oppdatering til Supabase
    await supabase
      .from('progress')
      .update({ [category]: newValue })
      .eq('person', person);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-12 text-yellow-400">
        🏆 Nyttårsforsett 2026: Emil vs Jørgen 🏆
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {data.map((person) => (
          <div key={person.id} className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-center">{person.person}</h2>

            {/* Movies */}
            <ProgressBar 
              label="Filmer" 
              current={person.movies} 
              goal={GOALS.movies} 
              color="bg-blue-500" 
              onIncrement={() => updateCount(person.person, 'movies', 1)}
              onDecrement={() => updateCount(person.person, 'movies', -1)}
            />

            {/* Workouts */}
            <ProgressBar 
              label="Treninger" 
              current={person.workouts} 
              goal={GOALS.workouts} 
              color="bg-green-500" 
              onIncrement={() => updateCount(person.person, 'workouts', 1)}
              onDecrement={() => updateCount(person.person, 'workouts', -1)}
            />

            {/* Smash Sets */}
            <ProgressBar 
              label="SSBM Sets" 
              current={person.smash_sets} 
              goal={GOALS.smash_sets} 
              color="bg-red-500" 
              onIncrement={() => updateCount(person.person, 'smash_sets', 1)}
              onDecrement={() => updateCount(person.person, 'smash_sets', -1)}
            />
          </div>
        ))}
      </div>
    </main>
  );
}

// Hjelpekomponent for ryddigere kode
function ProgressBar({ label, current, goal, color, onIncrement, onDecrement }: any) {
  const percentage = Math.min(100, Math.round((current / goal) * 100));
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-2">
        <span className="text-lg font-semibold">{label}</span>
        <span className="text-sm text-gray-400">{current} / {goal} ({percentage}%)</span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-6 mb-3 overflow-hidden">
        <div 
          className={`${color} h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2`} 
          style={{ width: `${percentage}%` }}
        >
          {percentage >= 5 && <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{percentage}%</span>}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onDecrement} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">-</button>
        <button onClick={onIncrement} className="px-4 py-1 bg-white text-black hover:bg-gray-200 font-bold rounded text-sm">+</button>
      </div>
    </div>
  );
}
