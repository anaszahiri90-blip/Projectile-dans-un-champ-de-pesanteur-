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
  ArrowRight
} from 'lucide-react';
import { PhysicalParameters, TargetChallenge, TrajectoryData } from './types';
import { calculateTrajectory, calculateTheoreticalVacuum } from './utils/physics';

import SimulationCanvas from './components/SimulationCanvas';
import ControlsPanel from './components/ControlsPanel';
import GraphsPanel from './components/GraphsPanel';
import LessonPanel from './components/LessonPanel';
import ChallengePanel from './components/ChallengePanel';

export default function App() {
  // 1. Initial State for physics parameters
  const [params, setParams] = useState<PhysicalParameters>({
    v0: 18.0, // initial velocity m/s
    angle: 45, // launch angle in degrees
    h0: 2.0, // launch height in meters
    g: 9.81, // Earth gravity
    airResistanceEnabled: false,
    airDensity: 1.225, // default Earth surface density
    mass: 0.057, // generic tennis ball
    diameter: 0.067,
    cd: 0.45,
  });

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
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Physix : Labo Projectile
            </h1>
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
              Champ de Pesanteur Uniforme & Modèles Gazeux
            </p>
          </div>
        </div>

        {/* Informative educational header blocks */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-2 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Modèle Numérique : <b>RK4</b>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-2 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Modèle Analytique : <b>Newton-Kepler</b>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Bento Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 align-start">
        
        {/* Left Columns (Canvas, Statistics, Graphs) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* A. 2D Interactive Space Canvas */}
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
          />

          {/* B. Realtime Physics Performance Indicator Panel */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6" id="metrics-panel">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-500" />
              Comparateur d'Atterrissage : Vide vs Atmosphère
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Stat 1: Flight Range */}
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[10.5px] text-slate-500 font-medium">Portée maximum</span>
                <div>
                  <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                    {trajectoryActive.range.toFixed(2)}m
                  </span>
                  {params.airResistanceEnabled && (
                    <span className="text-[10px] text-slate-400 font-mono italic">
                      Vide : {trajectoryVacuum.range.toFixed(1)}m (-{Math.round((1 - trajectoryActive.range / trajectoryVacuum.range) * 100)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Stat 2: Peak Height */}
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[10.5px] text-slate-500 font-medium">Flèche (Hauteur max)</span>
                <div>
                  <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                    {trajectoryActive.maxHeight.toFixed(2)}m
                  </span>
                  {params.airResistanceEnabled && (
                    <span className="text-[10px] text-slate-400 font-mono italic">
                      Vide : {trajectoryVacuum.maxHeight.toFixed(1)}m
                    </span>
                  )}
                </div>
              </div>

              {/* Stat 3: Total flight time */}
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[10.5px] text-slate-500 font-medium">Temps de vol</span>
                <div>
                  <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
                    {trajectoryActive.flightTime.toFixed(2)}s
                  </span>
                  {params.airResistanceEnabled && (
                    <span className="text-[10px] text-slate-400 font-mono italic">
                      Vide : {trajectoryVacuum.flightTime.toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>

              {/* Stat 4: Impact Speed */}
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 flex flex-col justify-between">
                <span className="text-[10.5px] text-slate-500 font-medium">Vitesse à l'impact</span>
                <div>
                  <span className="text-xl font-bold font-mono text-emerald-600 block mt-1">
                    {trajectoryActive.impactSpeed.toFixed(1)} m/s
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    ({Math.round(trajectoryActive.impactSpeed * 3.6)} km/h)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* C. Interactive dynamic Graphs Component */}
          <GraphsPanel
            activeTrajectory={trajectoryActive}
            currentTime={currentTime}
            params={params}
          />

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
                Modélisation Physique & Cours
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
                Défis Cible pour Élèves {challenge.active && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse font-mono">ACTIF</span>}
              </button>
            </div>

            {/* Embed Panel views block */}
            <div className="p-4 md:p-6 bg-white">
              {bottomModule === 'lessons' ? (
                <LessonPanel params={params} activeTrajectory={trajectoryActive} />
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

        {/* Right Collateral Sidebar (Tweak parameters controls, Preset lists, Challenge score board histories) */}
        <div className="space-y-6">
          {/* Setup controls */}
          <ControlsPanel params={params} setParams={setParams} />

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
