/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BookOpen, HelpCircle, GraduationCap, ArrowLeftRight, Sliders, CheckCircle2, XCircle } from 'lucide-react';
import { PhysicalParameters, TrajectoryData, DidacticObstacle } from '../types';
import { calculateTheoreticalVacuum } from '../utils/physics';

interface LessonPanelProps {
  params: PhysicalParameters;
  activeTrajectory: TrajectoryData;
  didacticObstacle: DidacticObstacle;
  setDidacticObstacle: React.Dispatch<React.SetStateAction<DidacticObstacle>>;
  isChallengeActive: boolean;
}

export default function LessonPanel({ 
  params, 
  activeTrajectory,
  didacticObstacle,
  setDidacticObstacle,
  isChallengeActive,
}: LessonPanelProps) {
  // Compute standard vacuum theoretical results based on active params
  const theory = useMemo(() => {
    return calculateTheoreticalVacuum(params);
  }, [params]);

  const thetaRad = (params.angle * Math.PI) / 180;
  const sinTh = Math.sin(thetaRad);
  const cosTh = Math.cos(thetaRad);
  const v_0x = params.v0 * cosTh;
  const v_0y = params.v0 * sinTh;

  const g = params.g;
  const v0 = params.v0;
  const h0 = params.h0;
  const x_obs = didacticObstacle.x;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 space-y-6" id="lesson-panel-container">
      {/* Head section */}
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          Étude théorique & principes physiques (Modélisation)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Comprenez les lois physiques et mathématiques qui régissent cette expérience</p>
      </div>

      {/* Newton Second Law Comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Vector Accel */}
        <div className="border border-emerald-100 p-4 rounded-xl bg-emerald-50/10">
          <h3 className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            1. Vecteur Accélération (2ème Loi de Newton)
          </h3>
          <p className="text-[11.5px] leading-relaxed text-slate-650 mb-3 font-sans">
            En négligeant tout frottement, le projectile n'est soumis qu'à son propre poids P⃗ (Chute libre dans un champ uniforme g⃗). En appliquant la deuxième loi de Newton dans un repère galiléen :
          </p>
          <div className="bg-white px-3 py-2.5 rounded-lg border border-emerald-100/50 italic text-center font-mono text-xs text-emerald-950 shadow-inner">
            Σ F⃗ = P⃗  ⟹  m · a⃗ = m · g⃗  ⟹  a⃗ = g⃗
          </div>
          <div className="mt-3 space-y-2 text-[11.5px] text-slate-600 font-sans">
            <div>• <b className="text-slate-800">Projection sur (Ox) :</b> Comme g⃗ a une composante nulle sur l'axe horizontal, l'accélération est nulle : <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700">a_x = 0</code></div>
            <div>• <b className="text-slate-800">Projection sur (Oy) :</b> L'accélération verticale est constante et orientée vers le bas : <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-700">a_y = -g</code></div>
          </div>
        </div>

        {/* Card 2: Kinematics details */}
        <div className="border border-indigo-100 p-4 rounded-xl bg-indigo-50/10">
          <h3 className="text-xs font-bold uppercase text-indigo-805 flex items-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            2. Équations de Vitesse & Équations horaires
          </h3>
          <p className="text-[11.5px] leading-relaxed text-slate-650 mb-3 font-sans">
            Par intégration successive par rapport au temps t, en utilisant les conditions initiales du tir (à t = 0s) :
          </p>
          <div className="bg-white px-3 py-2.5 rounded-lg border border-indigo-100/50 text-left font-mono text-xs text-indigo-950 shadow-inner space-y-1">
            <div>v_x(t) = v₀ · cos(θ)</div>
            <div>v_y(t) = -g · t + v₀ · sin(θ)</div>
          </div>
          <div className="mt-3 space-y-2 text-[11.5px] text-slate-600 font-sans">
            <div>• <b className="text-slate-800">Équations horaires x(t) et y(t) :</b> Par une seconde intégration, on déduit l'évolution temporelle des coordonnées :</div>
            <div className="bg-white/50 p-1.5 rounded border border-slate-100 font-mono text-xs text-[10.5px]">
              x(t) = v₀ · cos(θ) · t <br />
              y(t) = -½ · g · t² + v₀ · sin(θ) · t + h₀
            </div>
          </div>
        </div>
      </div>

      {/* Step by step math solver based on student settings */}
      <div className="border border-indigo-100 rounded-xl bg-indigo-50/20 p-4 md:p-5" id="step-by-step-physics-computations">
        <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5 mb-3">
          <BookOpen className="w-4 h-4 text-indigo-700" />
          Résolution analytique sous vide (Théorie idéale)
        </h3>
        <p className="text-[11.5px] leading-relaxed text-slate-600 mb-4 font-sans">
          Voici comment appliquer les lois physiques pour calculer la portée et le sommet théoriques de votre tir dans le vide idéal :
        </p>

        <div className="space-y-4 text-[11.5px] text-slate-700 font-sans">
          {/* Step 1: initial speed projection */}
          <div className="flex flex-col gap-1.5 border-l-2 border-indigo-500 pl-3 text-left">
            <span className="font-bold text-slate-900">Étape 1 : Projection des composantes de la vitesse initiale</span>
            <div className="font-mono text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-indigo-50 shadow-sm direction-ltr text-left">
              v₀_x = v₀ · cos(θ) = {params.v0} · cos({params.angle}°) = <span className="text-indigo-600 font-bold">{v_0x.toFixed(2)} m/s</span>
              <br />
              v₀_y = v₀ · sin(θ) = {params.v0} · sin({params.angle}°) = <span className="text-indigo-600 font-bold">{v_0y.toFixed(2)} m/s</span>
            </div>
          </div>

          {/* Step 2: Peak height (Flèche) */}
          <div className="flex flex-col gap-1.5 border-l-2 border-emerald-500 pl-3 text-left">
            <span className="font-bold text-slate-900">Étape 2 : Calcul de l'Altitude maximale (Le Sommet / Flèche)</span>
            <p className="text-slate-500">Le projectile atteint sa hauteur maximale lorsque sa vitesse verticale s'annule, v_y(t) = 0 :</p>
            <div className="font-mono text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-emerald-50 shadow-sm direction-ltr text-left">
              t_sommet = v₀_y / g = {v_0y.toFixed(2)} / {params.g} = <span className="text-emerald-600 font-bold">{theory.maxHeightTime.toFixed(2)} s</span>
              <br />
              y_max = v₀_y² / (2·g) = ({v_0y.toFixed(2)}²) / (2 · {params.g}) = <span className="text-emerald-600 font-bold">{theory.maxHeight.toFixed(2)} m</span>
            </div>
          </div>

          {/* Step 3: Theoretical Range */}
          <div className="flex flex-col gap-1.5 border-l-2 border-indigo-500 pl-3 text-left">
            <span className="font-bold text-slate-900">Étape 3 : Calcul de la Portée horizontale maximale</span>
            <p className="text-slate-500">Nous calculons le temps de vol total avant de le reporter sur l'axe horizontal X :</p>
            <div className="font-mono text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-indigo-50 shadow-sm direction-ltr text-left">
              t_vol = 2 · v₀_y / g = 2 · {v_0y.toFixed(2)} / {params.g} = <span className="text-indigo-600 font-bold">{theory.flightTime.toFixed(2)} s</span>
              <br />
              x_max = v₀_x · t_vol = {v_0x.toFixed(2)} · {theory.flightTime.toFixed(2)} = <span className="text-indigo-600 font-bold">{theory.range.toFixed(2)} m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Didactic Obstacle & Trajectory Equation Solver */}
      <div className="border border-indigo-200 rounded-xl bg-indigo-50/15 p-4 md:p-5 space-y-4" id="trajectory-equation-obstacle-solver">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              CONCRET : Obstacle Didactique & Équation de la Trajectoire
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Vérifiez comment l'équation théorique y(x) de la parabole détermine le passage d'un obstacle en situation réelle.
            </p>
          </div>
          
          <button
            onClick={() => setDidacticObstacle(prev => ({ ...prev, active: !prev.active }))}
            disabled={isChallengeActive}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all border ${
              isChallengeActive
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : didacticObstacle.active
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {didacticObstacle.active ? '✓ Obstacle Affiché' : 'Afficher l\'obstacle'}
          </button>
        </div>

        {isChallengeActive ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 text-left">
            ⚠️ <b>Note :</b> Le mode défi est actif. L'obstacle de démonstration est temporairement masqué pour ne pas encombrer le graphe de test de précision.
          </div>
        ) : (
          <>
            {/* Sliders row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-left">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-slate-700">Distance de l'obstacle (<b className="font-mono text-indigo-700">x_obs</b>) :</span>
                  <span className="text-indigo-600 font-bold font-mono">{didacticObstacle.x} m</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="40"
                  step="0.5"
                  value={didacticObstacle.x}
                  onChange={(e) => setDidacticObstacle(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[9px] text-slate-450 block leading-tight">Définit la position horizontale où calculer l'altitude intermédiairey(x).</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-slate-700">Hauteur de l'obstacle (<b className="font-mono text-indigo-700">h_obs</b>) :</span>
                  <span className="text-indigo-600 font-bold font-mono">{didacticObstacle.height} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.2"
                  value={didacticObstacle.height}
                  onChange={(e) => setDidacticObstacle(prev => ({ ...prev, height: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[9px] text-slate-455 block leading-tight">Définit la hauteur minimale nécessaire pour franchir la barrière.</span>
              </div>
            </div>

            {/* Calculations and status */}
            <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-4 font-mono text-[11.5px] leading-relaxed text-left space-y-3">
              <div className="border-b border-rose-950 pb-2 flex justify-between items-center text-[10px] text-indigo-400 font-bold">
                <span>ÉQUATION DE LA TRAJECTOIRE SOUS VIDE</span>
                <span>y(x) = ax² + bx + h₀</span>
              </div>

              {/* Formula and variable injection */}
              <div className="space-y-1 text-slate-350 text-[11px]">
                <div className="font-bold">y(x) = - [ g / (2 · v₀² · cos²(θ)) ] · x² + tan(θ) · x + h₀</div>
                <div className="text-slate-500 text-[10px]">
                  Valeurs actuelles : g = {g} m/s², v₀ = {v0} m/s, θ = {params.angle}°, h₀ = {h0} m, x = {x_obs} m
                </div>
              </div>

              {/* Substitution mathematical steps */}
              {(() => {
                const denom = 2 * v0 * v0 * cosTh * cosTh;
                const coeffA = denom !== 0 ? -g / denom : 0;
                const coeffB = Math.tan(thetaRad);
                const term1 = coeffA * x_obs * x_obs;
                const term2 = coeffB * x_obs;
                const y_predicted = term1 + term2 + h0;
                const clearanceValue = y_predicted - didacticObstacle.height;
                const cleared = y_predicted >= didacticObstacle.height;

                return (
                  <div className="space-y-3 font-mono">
                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/60 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between gap-1 items-start">
                        <span className="text-slate-500">1. Facteur de courbure (ax²) :</span>
                        <span className="font-bold text-red-400">
                          {coeffA.toFixed(5)} · ({x_obs}²) = {term1.toFixed(2)} m
                        </span>
                      </div>
                      <div className="flex justify-between gap-1 items-start">
                        <span className="text-slate-500">2. Facteur de tir incliné (bx) :</span>
                        <span className="font-bold text-emerald-400">
                          {coeffB.toFixed(4)} · {x_obs} = {term2.toFixed(2)} m
                        </span>
                      </div>
                      <div className="flex justify-between gap-1 items-start">
                        <span className="text-slate-500">3. Hauteur initiale (h₀) :</span>
                        <span className="font-bold text-slate-400">+{h0} m</span>
                      </div>
                      <div className="border-t border-slate-800 pt-1.5 flex justify-between font-extrabold text-xs sm:text-xs text-white">
                        <span>Altitude calculée y({x_obs}) :</span>
                        <span className="text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 shadow">
                          = {y_predicted.toFixed(2)} m
                        </span>
                      </div>
                    </div>

                    {/* Outcome verification banner */}
                    <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                      cleared 
                        ? 'bg-emerald-950/30 border-emerald-800 text-emerald-50' 
                        : 'bg-rose-950/30 border-rose-800 text-rose-50'
                    }`}>
                      {cleared ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1 text-left">
                        <div className="font-extrabold text-[12px] text-white">
                          {cleared 
                            ? 'RÉUSSITE : Le projectile franchit l\'obstacle !' 
                            : 'COLLISION : Le projectile percute l\'obstacle !'
                          }
                        </div>
                        <div className="text-[10px] leading-relaxed text-slate-300">
                          À la distance x = {x_obs} m, l'altitude théorique ({y_predicted.toFixed(2)} m) est {cleared ? 'supérieure' : 'inférieure'} à l'obstacle ({didacticObstacle.height.toFixed(2)} m).
                          <br />
                          Marge théorique (sous vide) : <b className={cleared ? 'text-emerald-400' : 'text-rose-455 font-bold'}>{cleared ? '+' : ''}{clearanceValue.toFixed(2)} m</b>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* Independence of mass in vacuum educational note */}
      <div className="flex gap-3 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-slate-655" id="lesson-friction-educational">
        <div className="w-8 h-8 rounded-full bg-indigo-100/80 flex items-center justify-center text-indigo-700 shrink-0 font-bold font-sans">!</div>
        <div className="space-y-1.5 font-sans">
          <span className="text-xs font-bold text-indigo-950">Note pédagogique de niveau Baccalauréat : Indépendance de la masse dans le vide</span>
          <p className="text-[11px] leading-relaxed text-slate-500 text-left">
            Dans le vide (absence totale d'air), tous les corps chutent avec la même accélération <code className="font-mono bg-white px-1 py-0.5 rounded border">a⃗ = g⃗</code> indépendamment de leur masse, de leur forme ou de leur taille. C'est l'expérience célèbre de la plume et du marteau : libérés simultanément sans frottements, ils atteignent le sol en même temps et suivent la même trajectoire parabolique exacte parce que la masse <code className="font-mono">m</code> se simplifie de part et d'autre de l'égalité dans la relation fondamentale de la dynamique (<code className="font-mono">m · a⃗ = P⃗ = m · g⃗</code> ⟹ <code className="font-mono">a⃗ = g⃗</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
