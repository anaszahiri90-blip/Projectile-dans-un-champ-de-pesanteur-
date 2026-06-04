/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Eye, Target, AlertTriangle } from 'lucide-react';
import { SimulationPoint, TrajectoryData, PhysicalParameters, TargetChallenge } from '../types';

interface SimulationCanvasProps {
  vacuumTrajectory: TrajectoryData;
  activeTrajectory: TrajectoryData; // either air or vacuum depending on choice
  params: PhysicalParameters;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (s: number) => void;
  challenge: TargetChallenge;
  onTargetHitCheck: (x: number, y: number) => void;
}

export default function SimulationCanvas({
  vacuumTrajectory,
  activeTrajectory,
  params,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  challenge,
  onTargetHitCheck,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  // Update canvas bounds on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Keep ratio around 2:1
      setDimensions({
        width: Math.max(400, width),
        height: Math.max(300, Math.min(480, width * 0.5)),
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Display toggles
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showFrictionPath, setShowFrictionPath] = useState(true);
  
  // Find physical bounds to fit trajectory and target perfectly
  const physicalBounds = useMemo(() => {
    const defaultMaxX = 40;
    const defaultMaxY = 20;

    let maxX = Math.max(
      vacuumTrajectory.range,
      activeTrajectory.range,
      defaultMaxX
    );
    let maxY = Math.max(
      vacuumTrajectory.maxHeight,
      activeTrajectory.maxHeight,
      defaultMaxY
    );

    if (challenge.active) {
      maxX = Math.max(maxX, challenge.targetX + 10);
      maxY = Math.max(maxY, challenge.targetY + 8);
      if (challenge.obstacleActive) {
        maxX = Math.max(maxX, challenge.obstacleX + challenge.obstacleWidth + 5);
        maxY = Math.max(maxY, challenge.obstacleY + challenge.obstacleHeight + 5);
      }
    }

    // Add padding margin
    maxX *= 1.1;
    maxY *= 1.15;

    // Minimum scale guarantees
    if (maxX < 15) maxX = 15;
    if (maxY < 8) maxY = 8;

    return { maxX, maxY };
  }, [vacuumTrajectory, activeTrajectory, challenge]);

  // Translate physical coordinates (meters) to SVG viewbox coordinates (pixels)
  const padding = { left: 55, right: 30, top: 40, bottom: 45 };
  
  const plotWidth = dimensions.width - padding.left - padding.right;
  const plotHeight = dimensions.height - padding.top - padding.bottom;

  // Compute uniform scaling to avoid physical distortion of angles
  const scale = useMemo(() => {
    const scaleX = plotWidth / physicalBounds.maxX;
    const scaleY = plotHeight / physicalBounds.maxY;
    // We use uniform scaling (the smaller of the two) to preserve aspect ratio
    const visualScale = Math.min(scaleX, scaleY);
    return visualScale;
  }, [plotWidth, plotHeight, physicalBounds]);

  const physToSvg = (x: number, y: number) => {
    const svgX = padding.left + x * scale;
    const svgY = dimensions.height - padding.bottom - y * scale;
    return { x: svgX, y: svgY };
  };

  // Find the exact simulation coordinates corresponding to the active current time
  const currentPoint = useMemo(() => {
    const pts = activeTrajectory.points;
    if (pts.length === 0) return null;
    
    // Binary search for closest time point
    let low = 0;
    let high = pts.length - 1;
    let bestIdx = 0;
    let minDist = Infinity;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const currT = pts[mid].t;
      const dist = Math.abs(currT - currentTime);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = mid;
      }
      if (currT < currentTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return pts[bestIdx];
  }, [activeTrajectory, currentTime]);

  // Find point in activeTrajectory closest to center of the obstacle-wall
  const obstaclePassagePt = useMemo(() => {
    if (!challenge.active || !challenge.obstacleActive || activeTrajectory.points.length === 0) return null;
    
    const obsCenterX = challenge.obstacleX + challenge.obstacleWidth / 2;
    let closestPt = activeTrajectory.points[0];
    let minDiff = Math.abs(closestPt.x - obsCenterX);
    
    for (const pt of activeTrajectory.points) {
      const diff = Math.abs(pt.x - obsCenterX);
      if (diff < minDiff) {
        minDiff = diff;
        closestPt = pt;
      }
    }
    
    // Safety guard: only return if it actually reaches/crosses around the obstacle X
    if (closestPt.x < challenge.obstacleX - 1.5 || closestPt.x > challenge.obstacleX + challenge.obstacleWidth + 1.5) {
      return null;
    }
    
    return closestPt;
  }, [activeTrajectory, challenge]);

  // Check target hits
  useEffect(() => {
    if (challenge.active && currentPoint && !challenge.hasHit && !challenge.isFailed) {
      onTargetHitCheck(currentPoint.x, currentPoint.y);
    }
  }, [currentPoint, challenge, onTargetHitCheck]);

  // Render grids lines in meters
  const gridLines = useMemo(() => {
    const lines = [];
    const maxValX = physicalBounds.maxX;
    const maxValY = physicalBounds.maxY;

    // X step helper
    let xStep = 5;
    if (maxValX > 150) xStep = 20;
    else if (maxValX > 75) xStep = 10;
    else if (maxValX < 15) xStep = 2;

    // Vertical lines
    for (let x = 0; x <= maxValX; x += xStep) {
      lines.push({ type: 'x', val: x, label: `${x}m` });
    }

    // Y step helper
    let yStep = 5;
    if (maxValY > 100) yStep = 20;
    else if (maxValY > 40) yStep = 10;
    else if (maxValY < 10) yStep = 2;

    // Horizontal lines
    for (let y = 0; y <= maxValY; y += yStep) {
      lines.push({ type: 'y', val: y, label: `${y}m` });
    }

    return lines;
  }, [physicalBounds]);

  // Generate SVG path for trajectory drawing
  const getSvgPathStr = (pts: SimulationPoint[]) => {
    if (pts.length === 0) return '';
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const p = physToSvg(pts[i].x, pts[i].y);
      if (i === 0) {
        d += `M ${p.x} ${p.y}`;
      } else {
        d += ` L ${p.x} ${p.y}`;
      }
    }
    return d;
  };

  const vacuumPath = useMemo(() => getSvgPathStr(vacuumTrajectory.points), [vacuumTrajectory, scale]);
  const activePath = useMemo(() => getSvgPathStr(activeTrajectory.points), [activeTrajectory, scale]);

  // Playback timer ticker hook
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsedSec = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const nextTime = prev + elapsedSec * playbackSpeed;
          const maxTime = activeTrajectory.flightTime;
          if (nextTime >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return nextTime;
        });
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, playbackSpeed, activeTrajectory]);

  // Reset launch
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Launch canon styling
  const launcherPos = physToSvg(0, params.h0);
  const cannonLength = 28;
  const angleRad = (params.angle * Math.PI) / 180;
  const muzzleX = launcherPos.x + cannonLength * Math.cos(angleRad);
  const muzzleY = launcherPos.y - cannonLength * Math.sin(angleRad);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6" id="simulation-canvas-wrapper">
      {/* Title with live speed & timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            Espace Physologique 2D
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Échelle mathématique : 1m = {Math.round(scale)}px | Pas d'intégration d'Euler : dt = 0.005s
          </p>
        </div>

        {/* HUD state indicators */}
        {currentPoint && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg">
            <div>
              t = <span className="text-indigo-600 font-bold">{currentPoint.t.toFixed(3)}s</span>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              x = <span className="text-slate-800 font-bold">{currentPoint.x.toFixed(2)}m</span>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              y = <span className="text-slate-800 font-bold">{currentPoint.y.toFixed(2)}m</span>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              v = <span className="text-emerald-600 font-bold">
                {Math.sqrt(currentPoint.vx * currentPoint.vx + currentPoint.vy * currentPoint.vy).toFixed(2)} m/s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Trajectory Area */}
      <div 
        ref={containerRef} 
        className="relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100" 
        id="physics-canvas-board"
      >
        <svg 
          width={dimensions.width} 
          height={dimensions.height}
          className="select-none"
        >
          {/* Defs for arrow heads, patterns */}
          <defs>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
            </marker>
            <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
            </marker>
            <pattern id="brick" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#f8fafc" />
              <path d="M 0 10 L 20 10 M 10 0 L 10 10 M 20 10 L 20 20 M 0 10 L 0 20 M 10 10 L 10 20" stroke="#cbd5e1" strokeWidth="1" />
            </pattern>
          </defs>

          {/* 1. Grid Background */}
          {showGrid && gridLines.map((line, idx) => {
            if (line.type === 'x') {
              const pStart = physToSvg(line.val, 0);
              const pEnd = physToSvg(line.val, physicalBounds.maxY);
              return (
                <g key={`gx-${idx}`}>
                  <line 
                    x1={pStart.x} 
                    y1={pStart.y} 
                    x2={pEnd.x} 
                    y2={pEnd.y} 
                    className="stroke-slate-200/50" 
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text 
                    x={pStart.x} 
                    y={dimensions.height - 18} 
                    className="fill-slate-400 font-mono text-[9px] text-center" 
                    textAnchor="middle"
                  >
                    {line.label}
                  </text>
                </g>
              );
            } else {
              const pStart = physToSvg(0, line.val);
              const pEnd = physToSvg(physicalBounds.maxX, line.val);
              return (
                <g key={`gy-${idx}`}>
                  <line 
                    x1={pStart.x} 
                    y1={pStart.y} 
                    x2={pEnd.x} 
                    y2={pEnd.y} 
                    className="stroke-slate-200/50" 
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text 
                    x={padding.left - 12} 
                    y={pStart.y + 3} 
                    className="fill-slate-400 font-mono text-[9px]" 
                    textAnchor="end"
                  >
                    {line.label}
                  </text>
                </g>
              );
            }
          })}

          {/* 2. Physical Axis lines */}
          {showAxes && (
            <g className="stroke-slate-500" strokeWidth="1.5">
              {/* X Axis */}
              <line 
                x1={padding.left} 
                y1={dimensions.height - padding.bottom} 
                x2={dimensions.width - padding.right} 
                y2={dimensions.height - padding.bottom} 
              />
              {/* Y Axis */}
              <line 
                x1={padding.left} 
                y1={padding.top} 
                x2={padding.left} 
                y2={dimensions.height - padding.bottom} 
              />
              {/* Arrow symbols labels */}
              <text x={dimensions.width - padding.right - 5} y={dimensions.height - padding.bottom + 15} className="fill-slate-600 font-sans font-medium text-[10px]" textAnchor="end">X (Distance en mètres)</text>
              <text x={padding.left - 10} y={padding.top - 10} className="fill-slate-600 font-sans font-medium text-[10px]" textAnchor="start">Y (Altitude en m)</text>
            </g>
          )}

          {/* 3. Obstacle (Challenge mode) */}
          {challenge.active && challenge.obstacleActive && (
            <g id="challenge-obstacle">
              {(() => {
                const wallTL = physToSvg(challenge.obstacleX, challenge.obstacleY + challenge.obstacleHeight);
                const wallWidth = challenge.obstacleWidth * scale;
                const wallHeight = challenge.obstacleHeight * scale;
                return (
                  <g>
                    <rect 
                      x={wallTL.x} 
                      y={wallTL.y} 
                      width={wallWidth} 
                      height={wallHeight} 
                      fill="url(#brick)" 
                      stroke="#ef4444" 
                      strokeWidth="2"
                      rx="3"
                    />
                    {/* Hazard danger stripings on wall top */}
                    <rect 
                      x={wallTL.x} 
                      y={wallTL.y} 
                      width={wallWidth} 
                      height="4" 
                      fill="#ef4444"
                    />
                    <text 
                      x={wallTL.x + wallWidth / 2} 
                      y={wallTL.y + wallHeight / 2 + 3} 
                      className="fill-slate-500 font-sans font-bold text-[8px] sm:text-[10px]" 
                      textAnchor="middle"
                    >
                      Obstacle !
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* 4. Target Bullseye (Challenge mode) */}
          {challenge.active && (
            <g id="challenge-target">
              {(() => {
                const targetCenter = physToSvg(challenge.targetX, challenge.targetY);
                const outerRad = challenge.targetRadius * scale;
                const innerRad1 = outerRad * 0.67;
                const innerRad2 = outerRad * 0.33;
                return (
                  <g className="cursor-crosshair">
                    {/* Concentric red/white rings */}
                    <circle cx={targetCenter.x} cy={targetCenter.y} r={outerRad} fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1.5" />
                    <circle cx={targetCenter.x} cy={targetCenter.y} r={innerRad1} fill="white" stroke="#ef4444" strokeWidth="1.5" />
                    <circle cx={targetCenter.x} cy={targetCenter.y} r={innerRad2} fill="#ef4444" />
                    {/* Flagpole to make it clearly standing */}
                    <line x1={targetCenter.x} y1={targetCenter.y} x2={targetCenter.x} y2={targetCenter.y + outerRad * 1.5} stroke="#ef4444" strokeWidth="2" />
                    <text 
                      x={targetCenter.x} 
                      y={targetCenter.y - outerRad - 4} 
                      className="fill-red-600 font-sans font-extrabold text-[9px] select-none" 
                      textAnchor="middle"
                    >
                      CIBLE
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* 5. Trajectory paths */}
          {/* Theoretical Vacuum (always drawn in background style for educational visual reference) */}
          {vacuumPath && (
            <path 
              d={vacuumPath} 
              fill="none" 
              stroke="#64748b" 
              strokeWidth="2.5" 
              strokeDasharray="4 4" 
              opacity="0.4"
            />
          )}

          {/* Active trajectory line */}
          {activePath && (
            <path 
              d={activePath} 
              fill="none" 
              stroke={params.airResistanceEnabled ? '#4f46e5' : '#10b981'} 
              strokeWidth="3" 
              opacity="0.9"
            />
          )}

          {/* Obstacle clearance height indicator */}
          {challenge.active && challenge.obstacleActive && obstaclePassagePt && (
            <g id="challenge-obstacle-clearance">
              {(() => {
                const obsCenterX = challenge.obstacleX + challenge.obstacleWidth / 2;
                const obsTopY = challenge.obstacleHeight;
                
                // Active clearance coordinates
                const projPt = physToSvg(obstaclePassagePt.x, obstaclePassagePt.y);
                const wallTopPt = physToSvg(obsCenterX, obsTopY);
                const groundPt = physToSvg(obsCenterX, 0);
                
                const cleared = obstaclePassagePt.y >= obsTopY;
                const clearanceValue = obstaclePassagePt.y - obsTopY;
                
                return (
                  <g>
                    {/* Dotted vertical reference line crossing the obstacle */}
                    <line 
                      x1={groundPt.x} 
                      y1={groundPt.y} 
                      x2={projPt.x} 
                      y2={projPt.y} 
                      stroke="#818cf8" 
                      strokeWidth="1.2" 
                      strokeDasharray="3 3" 
                      opacity="0.75"
                    />
                    
                    {/* Clearance indicator vertical connector */}
                    {cleared ? (
                      <g>
                        <line 
                          x1={wallTopPt.x} 
                          y1={wallTopPt.y} 
                          x2={projPt.x} 
                          y2={projPt.y} 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                        />
                        {/* Little helper ticks at the end of the clearance connector */}
                        <line x1={wallTopPt.x - 4} y1={wallTopPt.y} x2={wallTopPt.x + 4} y2={wallTopPt.y} stroke="#10b981" strokeWidth="2" />
                        <line x1={projPt.x - 4} y1={projPt.y} x2={projPt.x + 4} y2={projPt.y} stroke="#10b981" strokeWidth="2" />
                        
                        {/* Text bubble showing the exact clearance */}
                        <rect 
                          x={wallTopPt.x + 6} 
                          y={(wallTopPt.y + projPt.y) / 2 - 10} 
                          width="122" 
                          height="20" 
                          rx="4" 
                          fill="#f0fdf4" 
                          stroke="#10b981" 
                          strokeWidth="1.2" 
                        />
                        <text 
                          x={wallTopPt.x + 12} 
                          y={(wallTopPt.y + projPt.y) / 2 + 3} 
                          className="fill-emerald-800 font-sans font-extrabold text-[9px] select-none"
                        >
                          Dégagement : +{clearanceValue.toFixed(2)}m
                        </text>
                      </g>
                    ) : (
                      // If trajectory goes below the wall top (collision)
                      <g>
                        <line 
                          x1={projPt.x} 
                          y1={projPt.y} 
                          x2={wallTopPt.x} 
                          y2={wallTopPt.y} 
                          stroke="#ef4444" 
                          strokeWidth="2" 
                          strokeDasharray="2 2"
                        />
                        <rect 
                          x={wallTopPt.x + 6} 
                          y={(wallTopPt.y + projPt.y) / 2 - 10} 
                          width="122" 
                          height="20" 
                          rx="4" 
                          fill="#fef2f2" 
                          stroke="#ef4444" 
                          strokeWidth="1.2" 
                        />
                        <text 
                          x={wallTopPt.x + 12} 
                          y={(wallTopPt.y + projPt.y) / 2 + 3} 
                          className="fill-red-800 font-sans font-extrabold text-[9px] select-none"
                        >
                          Déficit : {clearanceValue.toFixed(2)}m
                        </text>
                      </g>
                    )}
                    
                    {/* Ring highlight at the trajectory crossover point */}
                    <circle cx={projPt.x} cy={projPt.y} r="5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                    <text 
                      x={projPt.x} 
                      y={projPt.y - 10} 
                      className="fill-indigo-950 font-mono text-[9px] font-bold bg-white" 
                      textAnchor="middle"
                    >
                      H_passage = {obstaclePassagePt.y.toFixed(2)}m
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Display key theoretical peak labels */}
          {activeTrajectory.points.length > 0 && (
            <g>
              {/* Vertex pointer */}
              {(() => {
                const peakPt = physToSvg(activeTrajectory.maxHeightTime * (activeTrajectory.points[activeTrajectory.points.length - 1].x / activeTrajectory.flightTime), activeTrajectory.maxHeight);
                // Adjust for realistic peak pos physically
                const exactPeakPt = activeTrajectory.points.reduce((prev, curr) => (curr.y > prev.y) ? curr : prev, activeTrajectory.points[0]);
                const peakSvg = physToSvg(exactPeakPt.x, exactPeakPt.y);
                return (
                  <g>
                    <circle cx={peakSvg.x} cy={peakSvg.y} r="3" fill="#ef4444" />
                    <line x1={peakSvg.x} y1={peakSvg.y} x2={peakSvg.x} y2={peakSvg.y - 20} stroke="#ef4444" strokeWidth="1" strokeDasharray="2 1" />
                    <rect x={peakSvg.x - 35} y={peakSvg.y - 34} width="70" height="13" rx="3" fill="white" stroke="#ef4444" strokeWidth="0.8" />
                    <text x={peakSvg.x} y={peakSvg.y - 25} className="fill-red-600 font-mono text-[8px] font-bold" textAnchor="middle">
                      Flèche : {exactPeakPt.y.toFixed(2)}m
                    </text>
                  </g>
                );
              })()}

              {/* Range pointer */}
              {(() => {
                const landingSvg = physToSvg(activeTrajectory.range, 0);
                return (
                  <g>
                    <circle cx={landingSvg.x} cy={landingSvg.y} r="3.5" fill="#4f46e5" />
                    <line x1={landingSvg.x} y1={landingSvg.y} x2={landingSvg.x} y2={landingSvg.y + 15} stroke="#4f46e5" strokeWidth="1" strokeDasharray="2 1" />
                    <text x={landingSvg.x} y={landingSvg.y + 26} className="fill-indigo-700 font-mono text-[9px] font-bold" textAnchor="middle">
                      Portée : {activeTrajectory.range.toFixed(2)}m
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* 6. Draw Launcher Canon */}
          <g id="canon-launcher">
            {/* Cannon foundation stand */}
            <rect 
              x={launcherPos.x - 14} 
              y={launcherPos.y - 3} 
              width="28" 
              height="8" 
              fill="#334155" 
              rx="2" 
            />
            <circle cx={launcherPos.x} cy={launcherPos.y} r="9" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            
            {/* Rotating Cannon gun barrel */}
            <line 
              x1={launcherPos.x} 
              y1={launcherPos.y} 
              x2={muzzleX} 
              y2={muzzleY} 
              stroke="#1e293b" 
              strokeWidth="9" 
              strokeLinecap="round" 
            />
            {/* Inner muzzle hole */}
            <circle cx={muzzleX} cy={muzzleY} r="3.2" fill="white" />
            
            {/* Launch Angle protractor helper */}
            <path 
              d={`M ${launcherPos.x + 35} ${launcherPos.y} A 35 35 0 0 0 ${launcherPos.x + 35 * Math.cos(angleRad)} ${launcherPos.y - 35 * Math.sin(angleRad)}`} 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="1.5" 
              opacity="0.6"
            />
            <text 
              x={launcherPos.x + 40} 
              y={launcherPos.y - 12} 
              className="fill-indigo-600 font-mono text-[10px] font-medium"
            >
              {Math.round(params.angle)}°
            </text>
          </g>

          {/* 7. Draw projectile object and dynamic vectors */}
          {currentPoint && (
            <g id="projectile-ball">
              {(() => {
                const p = physToSvg(currentPoint.x, currentPoint.y);
                
                // Visual radius of the ball proportional to physics scale, with a safe visual ceiling
                const radiusPx = Math.max(3.5, Math.min(12, (params.diameter / 2) * scale));

                return (
                  <g>
                    {/* Trajectory dot helper along motion */}
                    <circle cx={p.x} cy={p.y} r={radiusPx + 4} fill="#818cf8" fillOpacity="0.15" />
                    <circle cx={p.x} cy={p.y} r={radiusPx} fill="#4f46e5" stroke="white" strokeWidth="1.5" className="shadow-lg" />
                    
                    {/* DRAW VECTORS */}
                    {showVectors && (
                      <g>
                        {/* 1. Velocity vector (Green) */}
                        {(() => {
                          const vScale = 1.6; // magnification for physics readout readability
                          const arrowEndX = p.x + currentPoint.vx * vScale;
                          const arrowEndY = p.y - currentPoint.vy * vScale;
                          
                          const vxEndX = p.x + currentPoint.vx * vScale;
                          const vyEndY = p.y - currentPoint.vy * vScale;

                          return (
                            <g>
                              {/* Total speed vector */}
                              <line 
                                x1={p.x} 
                                y1={p.y} 
                                x2={arrowEndX} 
                                y2={arrowEndY} 
                                stroke="#10b981" 
                                strokeWidth="2" 
                                markerEnd="url(#arrow-green)" 
                              />
                              <text x={arrowEndX + 5} y={arrowEndY - 2} className="fill-emerald-700 font-mono text-[9px] font-bold">v⃗</text>

                              {/* Dashed projections Vx and Vy */}
                              <line 
                                x1={p.x} 
                                y1={p.y} 
                                x2={vxEndX} 
                                y2={p.y} 
                                stroke="#10b981" 
                                strokeWidth="1" 
                                strokeDasharray="2 3"
                                opacity="0.7" 
                                markerEnd="url(#arrow-green)"
                              />
                              <line 
                                x1={p.x} 
                                y1={p.y} 
                                x2={p.x} 
                                y2={vyEndY} 
                                stroke="#10b981" 
                                strokeWidth="1" 
                                strokeDasharray="2 3"
                                opacity="0.7"
                                markerEnd="url(#arrow-green)" 
                              />
                            </g>
                          );
                        })()}

                        {/* 2. Weight / Gravity P Force vector (Blue) */}
                        {(() => {
                          const forceScale = 0.8;
                          const weightLength = params.mass * params.g * forceScale;
                          const finalWeightLength = Math.max(15, Math.min(60, weightLength)); // bound visually
                          const arrowEndY = p.y + finalWeightLength;

                          return (
                            <g>
                              <line 
                                x1={p.x} 
                                y1={p.y} 
                                x2={p.x} 
                                y2={arrowEndY} 
                                stroke="#3b82f6" 
                                strokeWidth="2.2" 
                                markerEnd="url(#arrow-blue)" 
                              />
                              <text x={p.x + 5} y={arrowEndY + 8} className="fill-blue-600 font-mono text-[9px] font-bold">P⃗ = m·g⃗</text>
                            </g>
                          );
                        })()}

                        {/* 3. Drag / Friction force vector (Orange, only active if air resistance exists and velocity > 0) */}
                        {params.airResistanceEnabled && (currentPoint.vx !== 0 || currentPoint.vy !== 0) && (() => {
                          // Acceleration is proportional to dragForce
                          const frictionScale = 3.5;
                          // Force coordinates in opposite direction of speed
                          const dragForceX = -currentPoint.ax * params.mass * frictionScale;
                          const dragForceY = currentPoint.ay * params.mass * frictionScale; // vertical drag resists vertical speed
                          
                           // Visual length bounds
                          const rawLength = Math.sqrt(dragForceX * dragForceX + dragForceY * dragForceY);
                          if (rawLength < 3) return null;
                          
                          const boundedFactor = Math.min(50, rawLength) / Math.max(0.1, rawLength);
                          const visDragX = dragForceX * boundedFactor;
                          const visDragY = dragForceY * boundedFactor;

                          const arrowEndX = p.x - visDragX;
                          const arrowEndY = p.y - visDragY;

                          return (
                            <g>
                              <line 
                                x1={p.x} 
                                y1={p.y} 
                                x2={arrowEndX} 
                                y2={arrowEndY} 
                                stroke="#f97316" 
                                strokeWidth="1.8" 
                                markerEnd="url(#arrow-orange)" 
                              />
                              <text x={arrowEndX - 10} y={arrowEndY - 4} className="fill-orange-600 font-mono text-[9px] font-bold">f⃗_air</text>
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Floating status alert for target challenge success */}
        {challenge.active && (challenge.hasHit || challenge.isFailed) && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center p-4">
            <div className={`p-4 rounded-xl shadow-xl flex flex-col items-center border animate-bounce ${
              challenge.hasHit ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {challenge.hasHit ? (
                  <>
                    <Target className="w-6 h-6 text-emerald-600 animate-spin" />
                    <span className="font-sans font-bold text-base">Cible Atteinte ! 🎉</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <span className="font-sans font-bold text-base">Échec ! Cible manquée</span>
                  </>
                )}
              </div>
              <p className="text-xs mt-1 font-sans">
                {challenge.hasHit 
                  ? `Félicitations pour votre tir ! Réussi en ${challenge.attempts} tentative${challenge.attempts > 1 ? 's' : ''}.` 
                  : 'Essayez d\'ajuster l\'angle θ ou la vitesse v0 pour éviter l\'obstacle et toucher la cible.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 border-t border-slate-100 pt-4" id="sim-playback-hud">
        {/* Play Pause Stop Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            id="play-pause-btn"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition ${
              isPlaying 
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-slate-800" />
                Démarrer
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Lancer
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            id="reset-time-btn"
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer transition tooltip"
            title="Revenir au départ"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider / Scrubber */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">0.00s</span>
          <input
            type="range"
            min="0"
            max={activeTrajectory.flightTime || 1}
            step="0.005"
            value={currentTime}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTime(parseFloat(e.target.value));
            }}
            id="timeline-scrubber"
            className="flex-1 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
            {activeTrajectory.flightTime.toFixed(2)}s
          </span>
        </div>

        {/* Simulation playback multiplier speed */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[0.1, 0.5, 1, 2].map((speed) => (
            <button
              key={`speed-${speed}`}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
                playbackSpeed === speed 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              {speed}x{speed === 0.1 && ' (Ralenti)'}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Visibility toggles */}
      <div className="flex flex-wrap items-center gap-4 mt-3 pt-2 border-t border-slate-150/50 text-slate-650">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> Affichage :
        </span>

        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer user-select-none">
          <input 
            type="checkbox" 
            checked={showGrid} 
            onChange={(e) => setShowGrid(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
          />
          Grille de mesure
        </label>

        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer user-select-none">
          <input 
            type="checkbox" 
            checked={showAxes} 
            onChange={(e) => setShowAxes(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
          />
          Repère orthonormé
        </label>

        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer user-select-none">
          <input 
            type="checkbox" 
            checked={showVectors} 
            onChange={(e) => setShowVectors(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
          />
          Vecteurs (Vitesse v⃗, Poids P⃗, Frottement f⃗)
        </label>
      </div>
    </div>
  );
}
