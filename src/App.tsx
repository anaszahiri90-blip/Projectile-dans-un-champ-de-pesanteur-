/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Atom, 
  HelpCircle, 
  Target, 
  GraduationCap, 
  Trash2, 
  Award, 
  Scale, 
  Zap,
  Flame,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { PhysicalParameters, TargetChallenge, TrajectoryData, DidacticObstacle } from './types';
import { calculateTrajectory, calculateTheoreticalVacuum } from './utils/physics';

import SimulationCanvas from './components/SimulationCanvas';
import LessonPanel from './components/LessonPanel';
import ChallengePanel from './components/ChallengePanel';

export default function App() {
  // 1. Initial State for physics parameters
  const [params, setParams] = useState<PhysicalParameters>({
    v0: 18.0, // initial velocity m/s
    angle: 45, // launch angle in degrees
    h0: 0.0, // launch height in meters (starts at ground level)
    g: 9.81, // Earth gravity
    airResistanceEnabled: false, // disabled for Baccalaureate vacuum-only simulation
    airDensity: 1.225, // default Earth surface density
    mass: 1.0, // 1 kg standard
    diameter: 0.12,
    cd: 0.45,
  });

  // State to control mass unit (kg or g)
  const [massUnit, setMassUnit] = useState<'kg' | 'g'>('kg');

  // Track player progress
  const [scoreList, setScoreList] = useState<{ id: number; angle: number; speed: number; hit: boolean; date: string }[]>([]);

  // Slider scrubber states
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.1x to 2x

  // Sub tab navigation selectors : "equations" or "challenge" in the bottom card
  const [bottomModule, setBottomModule] = useState<'lessons' | 'challenge'>('lessons');

  // 2. State for Target Challenge mode
  const [challenge, setChallenge] = useState<TargetChallenge>({
    active: false,
    targetX: 30,
    targetY: 0,
    targetRadius: 2.0,
    obstacleActive: true,
    obstacleX: 14,
    obstacleY: 0,
    obstacleWidth: 3.0,
    obstacleHeight: 6.5,
    hasHit: false,
    isFailed: false,
    attempts: 0,
  });

  // State for didactic obstacle specifically to explain trajectory equation in french
  const [didacticObstacle, setDidacticObstacle] = useState<DidacticObstacle>({
    active: true,
    x: 18,
    height: 6.0,
    width: 2.0,
  });

  // Reset clock slider on parameters change to prevent stale indexes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    
    // Clear targeted success highlights when inputs move
    if (challenge.active) {
      setChallenge((prev) => ({
        ...prev,
        hasHit: false,
        isFailed: false,
      }));
    }
  }, [params, challenge.active]);

  // Compute trajectories
  const trajectoryVacuum = useMemo(() => {
    // Force resistance to false for the control path
    return calculateTrajectory({
      ...params,
      airResistanceEnabled: false,
    });
  }, [params]);

  const trajectoryActive = useMemo(() => {
    return calculateTrajectory(params);
  }, [params]);

  // Check target collision or obstacle crashes
  const handleTargetHitCheck = (x: number, y: number) => {
    if (!challenge.active || challenge.hasHit || challenge.isFailed) return;

    // Obstacle hit check
    if (challenge.obstacleActive) {
      const withinX = x >= challenge.obstacleX && x <= (challenge.obstacleX + challenge.obstacleWidth);
      const withinY = y <= challenge.obstacleHeight;
      if (withinX && withinY) {
        setIsPlaying(false);
        setChallenge((prev) => ({
          ...prev,
          isFailed: true,
          attempts: prev.attempts + 1,
        }));
        
        // Log attempt
        setScoreList(prev => [
          {
            id: Date.now(),
            angle: params.angle,
            speed: params.v0,
            hit: false,
            date: new Date().toLocaleTimeString(),
          },
          ...prev
        ]);
        return;
      }
    }

    // Target bullseye hit check
    const dx = x - challenge.targetX;
    const dy = y - challenge.targetY;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget <= challenge.targetRadius) {
      setIsPlaying(false);
      setChallenge((prev) => ({
        ...prev,
        hasHit: true,
        attempts: prev.attempts + 1,
      }));
      setScoreList(prev => [
        {
          id: Date.now(),
          angle: params.angle,
          speed: params.v0,
          hit: true,
          date: new Date().toLocaleTimeString(),
        },
        ...prev
      ]);
      return;
    }

    // Ground landing point but missed target check
    if (y <= 0.001 && x > 0.1) {
      setIsPlaying(false);
      setChallenge((prev) => ({
        ...prev,
        isFailed: true,
        attempts: prev.attempts + 1,
      }));
      setScoreList(prev => [
        {
          id: Date.now(),
          angle: params.angle,
          speed: params.v0,
          hit: false,
          date: new Date().toLocaleTimeString(),
        },
        ...prev
      ]);
    }
  };

  // Switch tab module easily if we load a challenge from the launcher levels
  useEffect(() => {
    if (challenge.active) {
      setBottomModule('challenge');
    }
  }, [challenge.active]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-3 md:p-6" id="app-container">
      {/* 1. Global Navigation Bar */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm" id="main-navigation">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-150">
            <Atom className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              Simulation de projectile : Mouvement dans un champ de pesanteur uniforme (Vide)
            </h1>
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
              Conforme au programme du Baccalauréat (Sans frottements)
            </p>
          </div>
        </div>

        {/* Informative educational header blocks */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100 p-2 rounded-lg text-indigo-900">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Modèle : <b>Sous Vide (Idéal)</b>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg text-emerald-900">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Deuxième loi de Newton : <b>a⃗ = g⃗</b>
          </div>
        </div>
      </header>



      {/* 2. Main Dashboard Bento Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 align-start">
        
        {/* Left Columns (Canvas, Statistics, Graphs) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* A. 2D Interactive Space Canvas & Controls Sidebar (Side-by-Side on Desktop/XL screens) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch" id="simulation-workspace">
            {/* High-Contrast Controls Sidebar card (Takes 4 cols) */}
            <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 md:p-5 flex flex-col justify-between space-y-4 shadow-sm" id="physics-controls-sidebar">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Sliders className="w-4 h-4 text-indigo-650 animate-pulse" />
                  <span>Conditions du Tir</span>
                </h3>

                {/* 1. Velocity (v₀) */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-150 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs font-black text-indigo-950">v₀ : Vitesse initiale</span>
                      <span className="block text-[10px] text-slate-500 font-bold mt-0.5">Vitesse de départ à t = 0s</span>
                    </div>
                    <span className="font-mono bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 font-extrabold text-[11px] border border-emerald-150 shadow-2xs">
                      {params.v0.toFixed(1)} m/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="0.5"
                    value={params.v0}
                    onChange={(e) => setParams(prev => ({ ...prev, v0: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-bold font-mono">
                    <span>0 m/s</span>
                    <span className="text-slate-400">30 ms</span>
                    <span>60 m/s</span>
                  </div>
                </div>

                {/* 2. Angle (θ) */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-150 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs font-black text-indigo-950">θ : Angle de tir</span>
                      <span className="block text-[10px] text-slate-500 font-bold mt-0.5">Inclinaison par r. à l'horizontale</span>
                    </div>
                    <span className="font-mono bg-indigo-50 px-2 py-0.5 rounded text-indigo-800 font-extrabold text-[11px] border border-indigo-150 shadow-2xs">
                      {Math.round(params.angle)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={params.angle}
                    onChange={(e) => setParams(prev => ({ ...prev, angle: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-bold font-mono">
                    <span>0° (Horiz.)</span>
                    <span className="text-slate-400">45° (Max)</span>
                    <span>90° (Vert.)</span>
                  </div>
                </div>

                {/* 3. Altitude initiale (h₀) */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-150 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs font-black text-indigo-950">h₀ : Altitude de départ</span>
                      <span className="block text-[10px] text-slate-500 font-bold mt-0.5">Hauteur de lancement à t = 0s</span>
                    </div>
                    <span className="font-mono bg-indigo-50 px-2 py-0.5 rounded text-indigo-800 font-extrabold text-[11px] border border-indigo-150 shadow-2xs">
                      {params.h0.toFixed(1)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={params.h0}
                    onChange={(e) => setParams(prev => ({ ...prev, h0: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-bold font-mono">
                    <span>0 m (Sol)</span>
                    <span className="text-slate-400">10 m</span>
                    <span>20 m</span>
                  </div>
                </div>

                {/* 4. Mass (m) */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-150 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block text-xs font-black text-indigo-950">m : Masse</span>
                      <span className="block text-[10px] text-slate-500 font-bold mt-0.5">Masse de l'objet d'étude</span>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Unit switcher buttons */}
                      <div className="inline-flex bg-slate-200 p-0.5 rounded text-[9px] font-extrabold border border-slate-300">
                        <button
                          type="button"
                          onClick={() => setMassUnit('kg')}
                          className={`px-1 rounded transition-all font-black select-none cursor-pointer ${
                            massUnit === 'kg'
                              ? 'bg-indigo-600 text-white shadow-3xs'
                              : 'text-slate-600 hover:text-indigo-950'
                          }`}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setMassUnit('g')}
                          className={`px-1 rounded transition-all font-black select-none cursor-pointer ${
                            massUnit === 'g'
                              ? 'bg-indigo-600 text-white shadow-3xs'
                              : 'text-slate-600 hover:text-indigo-950'
                          }`}
                        >
                          g
                        </button>
                      </div>

                      <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-950 font-black text-[10px] border border-indigo-200 shadow-3xs min-w-[55px] text-center">
                        {massUnit === 'kg'
                          ? `${params.mass.toFixed(2)} kg`
                          : `${Math.round(params.mass * 1000)} g`
                        }
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={massUnit === 'kg' ? '0.05' : '50'}
                    max={massUnit === 'kg' ? '15.0' : '15000'}
                    step={massUnit === 'kg' ? '0.05' : '50'}
                    value={massUnit === 'kg' ? params.mass : Math.round(params.mass * 1000)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setParams(prev => ({
                        ...prev,
                        mass: massUnit === 'kg' ? val : val / 1000
                      }));
                    }}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-bold font-mono">
                    <span>{massUnit === 'kg' ? '0.05 kg' : '50 g'}</span>
                    <span className="text-amber-800 font-extrabold">Aucun effet !</span>
                    <span>{massUnit === 'kg' ? '15.00 kg' : '15 000 g'}</span>
                  </div>
                </div>

                {/* 5. Gravity (g) */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-150 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="block text-xs font-black text-slate-900">g : Pesanteur (Gravité)</span>
                    <span className="font-mono bg-rose-50 px-2 py-0.5 rounded text-rose-800 font-extrabold text-[10px] border border-rose-150">
                      {params.g.toFixed(2)} m/s²
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.62"
                    max="25.0"
                    step="0.01"
                    value={params.g}
                    onChange={(e) => setParams(prev => ({ ...prev, g: parseFloat(e.target.value) }))}
                    className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-bold font-mono">
                    <span>1.62 (Lune)</span>
                    <span className="text-rose-700 font-extrabold">9.81 (Terre)</span>
                    <span>25.00 (Jupiter)</span>
                  </div>
                </div>
              </div>

              {/* Informative side note */}
              <div className="bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl text-[10.5px] text-slate-705 leading-relaxed font-sans shadow-3xs">
                <p className="font-extrabold text-amber-950 mb-0.5">💡 Remarque :</p>
                <p className="text-slate-700 leading-normal">
                  Sous vide, la trajectory ne dépend pas de la masse car <span className="font-mono font-bold text-slate-800">a⃗ = g⃗</span>.
                </p>
              </div>
            </div>

            {/* The SVG 2D Canvas (Takes 8 cols) */}
            <div className="xl:col-span-8 flex flex-col h-full">
              <SimulationCanvas
                vacuumTrajectory={trajectoryVacuum}
                activeTrajectory={trajectoryActive}
                params={params}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                challenge={challenge}
                onTargetHitCheck={handleTargetHitCheck}
                didacticObstacle={didacticObstacle}
              />
            </div>
          </div>

          {/* B. Realtime Physics Performance Indicator Panel */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-xl p-4 md:p-6" id="metrics-panel">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-805 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Résultats principaux de la simulation / Mesures</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Stat 1: Flight Range */}
              <div className="bg-gradient-to-br from-indigo-50/45 to-indigo-100/10 p-5 rounded-2xl border border-indigo-100/80 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Portée maximale (X)</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold font-mono">Portée (X)</span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold font-mono text-indigo-950 block">
                    {trajectoryActive.range.toFixed(2)} m
                  </span>
                  <span className="text-[11px] text-indigo-955 font-mono block mt-1.5 bg-white/70 px-2 py-1 rounded border border-indigo-100/50">
                    Formule académique : <b>v₀² · sin(2θ) / g + h₀</b>
                  </span>
                </div>
              </div>

              {/* Stat 2: Peak Height */}
              <div className="bg-gradient-to-br from-emerald-50/45 to-emerald-100/10 p-5 rounded-2xl border border-emerald-100/80 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sommet du trajet (Y_max)</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold font-mono">Apogée (Flèche)</span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold font-mono text-emerald-950 block">
                    {trajectoryActive.maxHeight.toFixed(2)} m
                  </span>
                  <span className="text-[11px] text-emerald-955 font-mono block mt-1.5 bg-white/70 px-2 py-1 rounded border border-emerald-100/50">
                    Formule académique : <b>v₀_y² / (2g) + h₀</b>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* D. Bottom Tab Navigator (Lesson VS Target challenge levels) */}
          <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="bottom-bento-card">
            {/* Nav selection tabs button row */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setBottomModule('lessons')}
                className={`flex-1 py-3.5 px-4 text-xs font-bold font-sans flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  bottomModule === 'lessons'
                    ? 'border-indigo-600 text-indigo-950 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Démonstrations & Théorie
              </button>

              <button
                onClick={() => setBottomModule('challenge')}
                className={`flex-1 py-3.5 px-4 text-xs font-bold font-sans flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  bottomModule === 'challenge'
                    ? 'border-indigo-600 text-indigo-950 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/20'
                }`}
              >
                <Target className="w-4 h-4 text-red-650" />
                Défis académiques {challenge.active && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse font-mono">ACTIF</span>}
              </button>
            </div>

            {/* Embed Panel views block */}
            <div className="p-4 md:p-6 bg-white">
              {bottomModule === 'lessons' ? (
                <LessonPanel 
                  params={params} 
                  activeTrajectory={trajectoryActive} 
                  didacticObstacle={didacticObstacle}
                  setDidacticObstacle={setDidacticObstacle}
                  isChallengeActive={challenge.active}
                />
              ) : (
                <ChallengePanel
                  challenge={challenge}
                  setChallenge={setChallenge}
                  params={params}
                  setParams={setParams}
                  setIsPlaying={setIsPlaying}
                  setCurrentTime={setCurrentTime}
                  activeTrajectory={trajectoryActive}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Collateral Sidebar (Challenge score board histories) */}
        <div className="space-y-6">
          {/* score dashboard showing student firing logs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 flex flex-col gap-4" id="score-board-logs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                Rapport de Tir & Scores
              </h3>
              {scoreList.length > 0 && (
                <button
                  onClick={() => setScoreList([])}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Effacer
                </button>
              )}
            </div>

            {scoreList.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono text-center py-6 border border-dashed border-slate-150 rounded-xl">
                Aucun historique de tir pour l'instant. 
                <br /> Activez le <b>Défi Cible</b> pour vous mesurer !
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {scoreList.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition ${
                      log.hit 
                        ? 'border-emerald-200 bg-emerald-50/30 text-emerald-900' 
                        : 'border-slate-150 bg-slate-50/50 text-slate-600'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1">
                        {log.hit ? (
                          <span className="text-emerald-700">🎯 CIBLE TOUCHÉE !</span>
                        ) : (
                          <span className="text-slate-500">❌ Tir manqué</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Angle : {Math.round(log.angle)}° | Vitesse : {log.speed.toFixed(1)}m/s | {log.date}
                      </div>
                    </div>
                    {log.hit && <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">SUCCÈS</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer system status bar */}
      <footer className="max-w-7xl mx-auto mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-400 font-mono">
        © 2026 Physix Corp | Conçu pour l'Éducation Nationale française pour stimuler l'apprentissage des lois de Newton. 
        <br /> Intégrateur physique RK4 précis à 15000 itérations par tir.
      </footer>
    </div>
  );
}
