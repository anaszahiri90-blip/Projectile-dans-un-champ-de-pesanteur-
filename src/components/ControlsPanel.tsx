/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Globe, Circle, Wind, Info, Disc } from 'lucide-react';
import { PhysicalParameters, ProjectilePreset, EnvironmentPreset } from '../types';
import { PROJECTILE_PRESETS, ENVIRONMENT_PRESETS } from '../utils/physics';

interface ControlsPanelProps {
  params: PhysicalParameters;
  setParams: React.Dispatch<React.SetStateAction<PhysicalParameters>>;
}

export default function ControlsPanel({ params, setParams }: ControlsPanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState('tennis');
  const [selectedEnvId, setSelectedEnvId] = useState('earth');

  const updateParam = (key: keyof PhysicalParameters, value: any) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PROJECTILE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setParams((prev) => ({
        ...prev,
        mass: preset.mass,
        diameter: preset.diameter,
        cd: preset.cd,
      }));
    }
  };

  const handleEnvChange = (envId: string) => {
    setSelectedEnvId(envId);
    const env = ENVIRONMENT_PRESETS.find((e) => e.id === envId);
    if (env) {
      setParams((prev) => ({
        ...prev,
        g: env.g,
        airDensity: env.density,
        airResistanceEnabled: env.density > 0, // auto enable friction if there's air
      }));
    }
  };

  const activePreset = PROJECTILE_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 gap-6" id="controls-panel-container">
      <div>
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          Pupitre de Configuration
        </h2>
        <p className="text-xs text-slate-500">Ajustez les conditions initiales du lancer</p>
      </div>

      {/* 1. Launch Parameters Sliders */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          1. Conditions de Sortie de Bouche
        </h3>

        {/* Speed Slider v0 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Vitesse initiale (<span className="font-mono text-indigo-600">v₀</span>)
            </span>
            <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-indigo-700 font-bold">
              {params.v0.toFixed(1)} m/s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="0.5"
            value={params.v0}
            onChange={(e) => updateParam('v0', parseFloat(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 m/s (Chute libre)</span>
            <span>60 m/s ({Math.round(60 * 3.6)} km/h)</span>
          </div>
        </div>

        {/* Angle Slider theta */}
        <div className="space-y-1 mt-4">
          <div className="flex justify-between items-center text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Angle d'inclinaison (<span className="font-mono text-indigo-600">θ</span>)
            </span>
            <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-indigo-700 font-bold">
              {Math.round(params.angle)}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={params.angle}
            onChange={(e) => updateParam('angle', parseInt(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0° (Horizontal)</span>
            <span>45° (Optimum idéal)</span>
            <span>90° (Vertical)</span>
          </div>
        </div>

        {/* Height Slider h0 */}
        <div className="space-y-1 mt-4">
          <div className="flex justify-between items-center text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Hauteur de départ (<span className="font-mono text-indigo-600">y₀</span>)
            </span>
            <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-indigo-700 font-bold">
              {params.h0.toFixed(1)} m
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            value={params.h0}
            onChange={(e) => updateParam('h0', parseFloat(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0m (Au sol)</span>
            <span>50m (Sommet d'une falaise)</span>
          </div>
        </div>
      </div>

      {/* 2. Environment (Gravity & Atmosphere) */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            2. Astre & Champ de Pesanteur
          </h3>
        </div>

        {/* Environment Grid Selection Cards */}
        <div className="grid grid-cols-2 gap-2">
          {ENVIRONMENT_PRESETS.map((env) => (
            <button
              key={env.id}
              onClick={() => handleEnvChange(env.id)}
              className={`text-left p-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                selectedEnvId === env.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-sm'
                  : 'border-slate-200 hover:border-slate-350 text-slate-650 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 font-sans">
                <span>{env.nameFr}</span>
              </div>
              <div className="font-mono text-[10px] text-slate-450 mt-1 font-medium select-none">
                g = {env.g} m/s²
              </div>
            </button>
          ))}
        </div>

        {/* Atmosphere Air resistance toggle */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 select-none cursor-pointer" onClick={() => updateParam('airResistanceEnabled', !params.airResistanceEnabled)}>
              <Wind className="w-4 h-4 text-emerald-600" />
              Résistance de l'air
            </span>
            <button
              onClick={() => updateParam('airResistanceEnabled', !params.airResistanceEnabled)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                params.airResistanceEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  params.airResistanceEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Active Air drag parameters */}
          {params.airResistanceEnabled ? (
            <div className="space-y-2 mt-1 animate-fadeIn">
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-650">
                <span>Masse volumique de l'air (ρ)</span>
                <span className="font-mono font-bold text-emerald-700">{params.airDensity.toFixed(3)} kg/m³</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="3.0"
                step="0.05"
                value={params.airDensity}
                onChange={(e) => updateParam('airDensity', parseFloat(e.target.value))}
                className="w-full accent-emerald-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="block text-[9.5px] leading-relaxed text-slate-400">
                Note : Dans le vide (ρ = 0), la trajectoire est une parabole parfaite, indépendante de la masse du projectile.
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 leading-normal">
              Atmosphère désactivée (Vide spatial). Aucun frottement, les équations analytiques classiques s'appliquent.
            </div>
          )}
        </div>
      </div>

      {/* 3. Projectile Selectors */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Circle className="w-3.5 h-3.5" />
          3. Nature du Projectile
        </h3>

        {/* Projectile grid selection */}
        <div className="grid grid-cols-2 gap-2">
          {PROJECTILE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              className={`text-left p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedPresetId === p.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div>{p.nameFr}</div>
              <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                {p.mass < 1 ? `${(p.mass * 1000).toFixed(0)}g` : `${p.mass.toFixed(1)}kg`} | {Math.round(p.diameter * 100)}cm
              </div>
            </button>
          ))}
        </div>

        {/* If Custom selected: allow slider custom tuning */}
        {selectedPresetId === 'custom' && (
          <div className="bg-slate-50 border border-indigo-10/20 p-3.5 rounded-xl space-y-3 mt-2 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 mb-1">
              <Disc className="w-4 h-4 text-indigo-600" />
              Ajustement personnalisé
            </div>

            {/* Custom mass */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Masse (m)</span>
                <span className="font-mono text-indigo-600 font-bold">{params.mass.toFixed(2)} kg</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="50"
                step="0.05"
                value={params.mass}
                onChange={(e) => updateParam('mass', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-250 rounded-lg cursor-pointer"
              />
            </div>

            {/* Custom Diameter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Diamètre (d)</span>
                <span className="font-mono text-indigo-600 font-bold">{Math.round(params.diameter * 100)} cm</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="1.50"
                step="0.01"
                value={params.diameter}
                onChange={(e) => updateParam('diameter', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-250 rounded-lg cursor-pointer"
              />
            </div>

            {/* Custom Drag Cd */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Coefficient de traînée (<span className="font-mono text-xs">C_x</span>)</span>
                <span className="font-mono text-indigo-600 font-bold">{params.cd.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="1.5"
                step="0.01"
                value={params.cd}
                onChange={(e) => updateParam('cd', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-250 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Info notification */}
      <div className="flex gap-2 p-3 bg-indigo-50/50 border border-indigo-10/20 rounded-xl text-slate-500" id="controls-physics-info">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[10.5px] leading-relaxed">
          En chute libre sans air, la forme et le poids de l'objet n'ont aucune influence sur sa vitesse ou sa portée. 
          Découvrez la différence saisissante en activant la <b>résistance de l'air</b> !
        </p>
      </div>
    </div>
  );
}
