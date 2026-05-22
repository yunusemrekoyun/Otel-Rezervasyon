'use client';

import React, { useState } from 'react';
import { Thermometer, Wind, Droplets, Fan, Sparkles, AlertCircle } from 'lucide-react';

interface ClimateControlProps {
  initialTemp: number;
  initialHumidity: number;
}

export function ClimateControl({ initialTemp, initialHumidity }: ClimateControlProps) {
  const [temperature, setTemperature] = useState(initialTemp);
  const [floorHeating, setFloorHeating] = useState(true);
  const [humidifier, setHumidifier] = useState(false);
  const [airPurifier, setAirPurifier] = useState(true);
  const [ecoMode, setEcoMode] = useState(true);

  return (
    <div className="glass-panel rounded-2xl p-5 text-white/90 select-none border border-white/10 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-sm tracking-wide">Cabin Climate Engine</h4>
          <p className="text-[10px] text-white/50">Smart automation and localized HVAC control</p>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all ${
          ecoMode 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-white/15 text-white/70'
        }`}>
          {ecoMode ? 'Eco Mode Active' : 'Performance'}
        </div>
      </div>

      {/* Thermostat dial view */}
      <div className="grid grid-cols-12 gap-4 items-center py-2">
        <div className="col-span-5 flex flex-col items-center justify-center border-r border-white/10">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Thermostat</span>
          <div className="flex items-baseline mt-1">
            <span className="text-3xl font-bold font-mono tracking-tighter">{temperature}</span>
            <span className="text-sm text-brand-accent ml-0.5">°C</span>
          </div>
          <div className="flex gap-2.5 mt-2.5">
            <button
              onClick={() => setTemperature(prev => Math.max(15, prev - 1))}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              -
            </button>
            <button
              onClick={() => setTemperature(prev => Math.min(28, prev + 1))}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="col-span-7 pl-2 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-white/70">
              <Thermometer size={13} className="text-orange-400" />
              <span>Underfloor Heat</span>
            </div>
            <button 
              onClick={() => setFloorHeating(!floorHeating)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${floorHeating ? 'bg-orange-500' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${floorHeating ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-white/70">
              <Droplets size={13} className="text-cyan-400" />
              <span>Mist Humidifier</span>
            </div>
            <button 
              onClick={() => setHumidifier(!humidifier)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${humidifier ? 'bg-cyan-500' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${humidifier ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-white/70">
              <Fan size={13} className="text-teal-400" />
              <span>HEPA Air Purifier</span>
            </div>
            <button 
              onClick={() => setAirPurifier(!airPurifier)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${airPurifier ? 'bg-teal-400' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${airPurifier ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[10px] text-white/50">
        <div className="flex items-center gap-1">
          <Wind size={11} />
          <span>Forest Air Flow: Active</span>
        </div>
        <button 
          onClick={() => setEcoMode(!ecoMode)}
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Sparkles size={11} className="animate-spin-slow" />
          <span>Toggle Eco Limiters</span>
        </button>
      </div>
    </div>
  );
}
