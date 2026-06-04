/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { AreaChart, TrendingUp, Zap, Radio } from 'lucide-react';
import { SimulationPoint, TrajectoryData, PhysicalParameters } from '../types';

interface GraphsPanelProps {
  activeTrajectory: TrajectoryData;
  currentTime: number;
  params: PhysicalParameters;
}

export default function GraphsPanel({ activeTrajectory, currentTime, params }: GraphsPanelProps) {
  const [activeTab, setActiveTab] = useState<'energies' | 'speeds'>('energies');

  const pts = activeTrajectory.points;

  // Find active simulation point for highlighting time cursor
  const currentPoint = useMemo(() => {
    if (pts.length === 0) return null;
    let closest = pts[0];
    let minDist = Infinity;
    for (const p of pts) {
      const dist = Math.abs(p.t - currentTime);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    return closest;
  }, [pts, currentTime]);

  // Dimension setup for inline SVG charts
  const width = 500;
  const height = 220;
  const padding = { left: 50, right: 20, top: 25, bottom: 35 };
  
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // 1. Energie Chart Calculations
  const energyData = useMemo(() => {
    if (pts.length === 0) return { maxEnergy: 10, pathKe: '', pathPe: '', pathMe: '', timeScale: 1, energyScale: 1 };

    // Max mechanical energy is generally original energy
    const maxEnergy = Math.max(...pts.map(p => Math.max(p.ke, p.pe, p.me))) * 1.1 || 10;
    const maxTime = activeTrajectory.flightTime || 1;

    const timeScale = plotWidth / maxTime;
    const energyScale = plotHeight / maxEnergy;

    // Build SVG path
    let pathKe = '';
    let pathPe = '';
    let pathMe = '';

    pts.forEach((p, i) => {
      const x = padding.left + p.t * timeScale;
      const yKe = height - padding.bottom - p.ke * energyScale;
      const yPe = height - padding.bottom - p.pe * energyScale;
      const yMe = height - padding.bottom - p.me * energyScale;

      if (i === 0) {
        pathKe = `M ${x} ${yKe}`;
        pathPe = `M ${x} ${yPe}`;
        pathMe = `M ${x} ${yMe}`;
      } else {
        pathKe += ` L ${x} ${yKe}`;
        pathPe += ` L ${x} ${yPe}`;
        pathMe += ` L ${x} ${yMe}`;
      }
    });

    return { maxEnergy, pathKe, pathPe, pathMe, timeScale, energyScale };
  }, [pts, activeTrajectory.flightTime, plotWidth, plotHeight]);

  // 2. Velocity Component Chart Calculations
  const speedData = useMemo(() => {
    if (pts.length === 0) return { maxSpeed: 10, minSpeed: -10, pathVx: '', pathVy: '', pathVt: '', timeScale: 1, speedScale: 1, zeroY: 0 };

    const velocities = pts.flatMap(p => [p.vx, p.vy, Math.sqrt(p.vx * p.vx + p.vy * p.vy)]);
    let maxSpeed = Math.max(...velocities) * 1.1;
    let minSpeed = Math.min(...velocities) * 1.1;

    // Minimum boundary guarantees
    if (maxSpeed < 5) maxSpeed = 5;
    if (minSpeed > -5) minSpeed = -5;

    const maxTime = activeTrajectory.flightTime || 1;
    const timeScale = plotWidth / maxTime;

    const speedSpan = maxSpeed - minSpeed;
    const speedScale = plotHeight / speedSpan;

    // coordinate mapping y = height - pb - (val - minSpeed) * scale
    const getSvgY = (v: number) => height - padding.bottom - (v - minSpeed) * speedScale;

    let pathVx = '';
    let pathVy = '';
    let pathVt = '';

    pts.forEach((p, i) => {
      const x = padding.left + p.t * timeScale;
      const yVx = getSvgY(p.vx);
      const yVy = getSvgY(p.vy);
      const yVt = getSvgY(Math.sqrt(p.vx * p.vx + p.vy * p.vy));

      if (i === 0) {
        pathVx = `M ${x} ${yVx}`;
        pathVy = `M ${x} ${yVy}`;
        pathVt = `M ${x} ${yVt}`;
      } else {
        pathVx += ` L ${x} ${yVx}`;
        pathVy += ` L ${x} ${yVy}`;
        pathVt += ` L ${x} ${yVt}`;
      }
    });

    const zeroY = getSvgY(0);

    return { maxSpeed, minSpeed, pathVx, pathVy, pathVt, timeScale, speedScale, zeroY, getSvgY };
  }, [pts, activeTrajectory.flightTime, plotWidth, plotHeight]);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6" id="graphs-panel-wrapper">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <AreaChart className="w-4 h-4 text-indigo-600" />
            Analyse Graphique
          </h2>
          <p className="text-xs text-slate-500">Comprendre le mouvement pas-à-pas</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('energies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'energies' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Bilan Énergétique
          </button>
          <button
            onClick={() => setActiveTab('speeds')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'speeds' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Vecteurs Vitesse
          </button>
        </div>
      </div>

      {/* Render selected graph */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full flex justify-center">
          {pts.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400 font-mono">
              Aucune donnée à afficher. Lancez la simulation.
            </div>
          ) : activeTab === 'energies' ? (
            /* Energies SVG Graph */
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="font-mono">
              {/* Horizontal gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const energyVal = ratio * energyData.maxEnergy;
                const y = height - padding.bottom - energyVal * energyData.energyScale;
                return (
                  <g key={`eg-${idx}`} className="opacity-40">
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 3" />
                    <text x={padding.left - 8} y={y + 3} className="fill-slate-400 text-[8px] text-right" textAnchor="end">{energyVal.toFixed(1)}J</text>
                  </g>
                );
              })}

              {/* Draw Axis */}
              <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#64748b" strokeWidth="1.2" />
              <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#64748b" strokeWidth="1.2" />
              <text x={width/2} y={height - 5} className="fill-slate-500 text-[9px] text-center font-sans font-medium" textAnchor="middle">Temps (en secondes t)</text>

              {/* Paths */}
              <path d={energyData.pathPe} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <path d={energyData.pathKe} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              <path d={energyData.pathMe} fill="none" stroke="#ef4444" strokeWidth="3.2" strokeLinecap="round" />

              {/* Dynamic playhead line matching slide progress */}
              {currentPoint && (
                <g>
                  {/* Vertical Playhead */}
                  <line 
                    x1={padding.left + currentPoint.t * energyData.timeScale} 
                    y1={padding.top} 
                    x2={padding.left + currentPoint.t * energyData.timeScale} 
                    y2={height - padding.bottom} 
                    className="stroke-indigo-400" 
                    strokeWidth="1.5" 
                    strokeDasharray="3 2"
                  />
                  {/* Indicator cursors */}
                  <circle cx={padding.left + currentPoint.t * energyData.timeScale} cy={height - padding.bottom - currentPoint.pe * energyData.energyScale} r="4.5" fill="#3b82f6" stroke="white" strokeWidth="1.2" />
                  <circle cx={padding.left + currentPoint.t * energyData.timeScale} cy={height - padding.bottom - currentPoint.ke * energyData.energyScale} r="4.5" fill="#10b981" stroke="white" strokeWidth="1.2" />
                  <circle cx={padding.left + currentPoint.t * energyData.timeScale} cy={height - padding.bottom - currentPoint.me * energyData.energyScale} r="4.5" fill="#ef4444" stroke="white" strokeWidth="1.2" />
                </g>
              )}
            </svg>
          ) : (
            /* Speeds SVG Graph */
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="font-mono">
              {/* Horizontal speed gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const speedVal = speedData.minSpeed + ratio * (speedData.maxSpeed - speedData.minSpeed);
                const y = speedData.getSvgY(speedVal);
                return (
                  <g key={`sg-${idx}`} className="opacity-40">
                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 3" />
                    <text x={padding.left - 8} y={y + 3} className="fill-slate-400 text-[8px]" textAnchor="end">{speedVal.toFixed(1)}m/s</text>
                  </g>
                );
              })}

              {/* Ground speed zero line */}
              <line x1={padding.left} y1={speedData.zeroY} x2={width - padding.right} y2={speedData.zeroY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

              {/* Draw Axis */}
              <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#64748b" strokeWidth="1.2" />
              <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#64748b" strokeWidth="1.2" />
              <text x={width/2} y={height - 5} className="fill-slate-500 text-[9px] text-center font-sans font-medium" textAnchor="middle">Temps (en secondes t)</text>

              {/* Paths */}
              <path d={speedData.pathVx} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <path d={speedData.pathVy} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
              <path d={speedData.pathVt} fill="none" stroke="#10b981" strokeWidth="3" opacity="0.85" strokeLinecap="round" />

              {/* Dynamic playhead */}
              {currentPoint && (
                <g>
                  <line 
                    x1={padding.left + currentPoint.t * speedData.timeScale} 
                    y1={padding.top} 
                    x2={padding.left + currentPoint.t * speedData.timeScale} 
                    y2={height - padding.bottom} 
                    className="stroke-indigo-400" 
                    strokeWidth="1.5" 
                    strokeDasharray="3 2"
                  />
                  {/* Circles */}
                  <circle cx={padding.left + currentPoint.t * speedData.timeScale} cy={speedData.getSvgY(currentPoint.vx)} r="4" fill="#f59e0b" stroke="white" strokeWidth="1" />
                  <circle cx={padding.left + currentPoint.t * speedData.timeScale} cy={speedData.getSvgY(currentPoint.vy)} r="4" fill="#06b6d4" stroke="white" strokeWidth="1" />
                  <circle cx={padding.left + currentPoint.t * speedData.timeScale} cy={speedData.getSvgY(Math.sqrt(currentPoint.vx * currentPoint.vx + currentPoint.vy * currentPoint.vy))} r="4" fill="#10b981" stroke="white" strokeWidth="1" />
                </g>
              )}
            </svg>
          )}
        </div>

        {/* Legend and Real-time indicators readout side pane */}
        <div className="w-full md:w-[170px] flex flex-col gap-3 font-sans text-xs bg-slate-50/50 p-4 border border-indigo-50/20 rounded-xl" id="legend-pannel">
          <span className="font-bold text-slate-800 mb-1 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-indigo-500" />
            Légende & Valeurs
          </span>

          {activeTab === 'energies' ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold text-[#ef4444]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                  E_m (Mécanique)
                </span>
                <span className="font-mono text-slate-500 pl-4">{currentPoint ? `${currentPoint.me.toFixed(1)} Joules` : '-- J'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold text-[#10b981]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  E_c (Cinétique)
                </span>
                <span className="font-mono text-slate-500 pl-4">{currentPoint ? `${currentPoint.ke.toFixed(1)} Joules` : '-- J'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold text-[#3b82f6]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                  E_p (Potentielle)
                </span>
                <span className="font-mono text-slate-500 pl-4">{currentPoint ? `${currentPoint.pe.toFixed(1)} Joules` : '-- J'}</span>
              </div>

              {/* Energy Conservation Note */}
              <div className="mt-2 text-[10.5px] leading-relaxed text-slate-500 border-t border-slate-100 pt-2 italic">
                {params.airResistanceEnabled ? (
                  <span className="text-amber-800">⚠️ L'énergie mécanique <b>diminue</b> car les frottements de l'air dissipent l'énergie en chaleur thermique.</span>
                ) : (
                  <span className="text-emerald-800">✅ <b>Conservation</b> parfaite de l'énergie mécanique (Em constante) en l'absence de frottement de l'air !</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold text-[#10b981]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                  v (Norme vitesse)
                </span>
                <span className="font-mono text-slate-500 pl-4">
                  {currentPoint ? `${Math.sqrt(currentPoint.vx * currentPoint.vx + currentPoint.vy * currentPoint.vy).toFixed(1)} m/s` : '-- m/s'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold text-[#f59e0b]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                  v_x (Horizontale)
                </span>
                <span className="font-mono text-slate-500 pl-4">
                  {currentPoint ? `${currentPoint.vx.toFixed(1)} m/s` : '-- m/s'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-semibold text-[#06b6d4]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]"></span>
                  v_y (Verticale)
                </span>
                <span className="font-mono text-slate-500 pl-4 flex items-center gap-1">
                  {currentPoint ? `${currentPoint.vy.toFixed(1)} m/s` : '-- m/s'}
                  {currentPoint && currentPoint.vy < -0.01 && <span className="text-[10px] text-blue-500">(chute)</span>}
                  {currentPoint && currentPoint.vy > 0.01 && <span className="text-[10px] text-amber-500">(montée)</span>}
                </span>
              </div>

              {/* Physical vector observation note */}
              <div className="mt-2 text-[10.5px] leading-relaxed text-slate-500 border-t border-slate-100 pt-2 italic">
                {params.airResistanceEnabled ? (
                  <span className="text-indigo-800">La vitesse horizontale $v_x$ <b>ralentit</b> à cause du frottement, tandis que $v_y$ converge vers une vitesse terminale stable.</span>
                ) : (
                  <span className="text-emerald-800">La vitesse horizontale $v_x$ reste <b>strictement constante</b> en l'absence de frottement.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
