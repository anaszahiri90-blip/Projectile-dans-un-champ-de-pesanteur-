/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BookOpen, HelpCircle, GraduationCap, ChevronRight } from 'lucide-react';
import { PhysicalParameters, TrajectoryData } from '../types';
import { calculateTheoreticalVacuum } from '../utils/physics';

interface LessonPanelProps {
  params: PhysicalParameters;
  activeTrajectory: TrajectoryData;
}

export default function LessonPanel({ params, activeTrajectory }: LessonPanelProps) {
  // Compute standard vacuum theoretical results based on active params
  const theory = useMemo(() => {
    return calculateTheoreticalVacuum(params);
  }, [params]);

  const thetaRad = (params.angle * Math.PI) / 180;
  const sinTh = Math.sin(thetaRad);
  const cosTh = Math.cos(thetaRad);
  const v_0x = params.v0 * cosTh;
  const v_0y = params.v0 * sinTh;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 space-y-6" id="lesson-panel-container">
      {/* Head section */}
      <div>
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          Cours & Modélisation Physique
        </h2>
        <p className="text-xs text-slate-500">Comprendre la théorie qui régit cette simulation</p>
      </div>

      {/* Newton Second Law Comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Newton vacuum */}
        <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/40">
          <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Modèle Idéal (Vide Spatial)
          </h3>
          <p className="text-[11.5px] leading-relaxed text-slate-600 mb-3">
            La seule force agissant sur le projectile est son poids. D'après la deuxième loi de Newton :
          </p>
          <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-100 italic text-center font-mono text-xs text-slate-800 shadow-inner">
            Σ F⃗ = P⃗  ⟹  m · a⃗ = m · g⃗  ⟹  a⃗ = g⃗
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] text-slate-500 list-disc">
            <div>• <b className="text-slate-800">Équations d'accélération :</b> a_x(t) = 0 , a_y(t) = -g</div>
            <div>• <b className="text-slate-800">Équations de vitesse (linéaire) :</b> v_x(t) = v₀·cos(θ) , v_y(t) = -g·t + v₀·sin(θ)</div>
            <div>• <b className="text-slate-800">Positions paramétriques :</b> x(t) = v₀·cos(θ)·t , y(t) = -½·g·t² + v₀·sin(θ)·t + y₀</div>
          </div>
        </div>

        {/* Card 2: Air friction */}
        <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/40">
          <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Modèle Réel (Avec Frottement)
          </h3>
          <p className="text-[11.5px] leading-relaxed text-slate-600 mb-3">
            S'ajoute la force de frottement fluide (résistance quadratique de l'air) proportionnelle au carré de la vitesse :
          </p>
          <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-100 italic text-center font-mono text-xs text-slate-800 shadow-inner">
            F_air = -½ · ρ · C_x · A · v · v⃗
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
            <div>• <b className="text-indigo-950">Accélération :</b> a_x = - (½ρC_x A v)·v_x / m , a_y = -g - (½ρC_x A v)·v_y / m</div>
            <div>• <b className="text-indigo-900">Résolution :</b> Pas de solution analytique directe ! Le simulateur utilise la méthode d'intégration de <b>Runge-Kutta d'ordre 4 (RK4)</b> pour calculer chaque point à intervalle dt = 0.005s.</div>
          </div>
        </div>
      </div>

      {/* Step by step math solver based on user settings */}
      <div className="border border-indigo-150/40 rounded-xl bg-indigo-50/30 p-4 md:p-5" id="step-by-step-physics-computations">
        <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5 mb-3">
          <BookOpen className="w-4 h-4 text-indigo-700" />
          Résolution Numérique (Détail de vos calculs)
        </h3>
        <p className="text-[11.5px] leading-relaxed text-slate-650 mb-4">
          Voici comment s'appliquent les formules de physique pour vos paramètres de tir actuels en l'absence de frottement de l'air :
        </p>

        <div className="space-y-4 text-[11.5px] text-slate-700">
          {/* Step 1: initial speed projection */}
          <div className="flex flex-col gap-1.5 border-l-2 border-indigo-500 pl-3">
            <span className="font-semibold text-slate-800">Étape 1 : Projection des vecteurs de vitesse initiale</span>
            <div className="font-mono text-xs text-slate-500 bg-white p-2 rounded border border-indigo-50/50">
              v₀_x = v₀ · cos(θ) = {params.v0} · cos({params.angle}°) = <span className="text-indigo-600 font-bold">{v_0x.toFixed(2)} m/s</span>
              <br />
              v₀_y = v₀ · sin(θ) = {params.v0} · sin({params.angle}°) = <span className="text-indigo-600 font-bold">{v_0y.toFixed(2)} m/s</span>
            </div>
          </div>

          {/* Step 2: Peak height (Flèche) */}
          <div className="flex flex-col gap-1.5 border-l-2 border-indigo-500 pl-3">
            <span className="font-semibold text-slate-800">Étape 2 : Calcul du sommet de la trajectoire (Flèche)</span>
            <p className="text-slate-500">Le projectile atteint son apogée quand la vitesse verticale s'annule : v_y(t) = 0.</p>
            <div className="font-mono text-xs text-slate-500 bg-white p-2 rounded border border-indigo-50/50">
              t_sommet = v₀_y / g = {v_0y.toFixed(2)} / {params.g} = <span className="text-indigo-600 font-bold">{theory.maxHeightTime.toFixed(2)} secondes</span>
              <br />
              y_max = y₀ + v₀_y² / (2·g) = {params.h0} + ({v_0y.toFixed(2)}²) / (2 · {params.g}) = <span className="text-indigo-600 font-bold">{theory.maxHeight.toFixed(2)} mètres</span>
            </div>
          </div>

          {/* Step 3: Total time of flight */}
          <div className="flex flex-col gap-1.5 border-l-2 border-indigo-500 pl-3">
            <span className="font-semibold text-slate-800">Étape 3 : Durée totale de vol (Atterrissage y = 0)</span>
            <p className="text-slate-500">On résout l'équation du second degré : -½·g·t² + v₀_y·t + y₀ = 0.</p>
            <div className="font-mono text-xs text-slate-500 bg-white p-2 rounded border border-indigo-50/50">
              -0.5 · {params.g} · t² + {v_0y.toFixed(2)} · t + {params.h0} = 0
              <br />
              t_total = <span className="text-indigo-600 font-bold">{theory.flightTime.toFixed(3)} secondes</span>
            </div>
          </div>

          {/* Step 4: Theoretical Range */}
          <div className="flex flex-col gap-1.5 border-l-2 border-indigo-500 pl-3">
            <span className="font-semibold text-slate-800">Étape 4 : Détermination de la portée horizontale max</span>
            <p className="text-slate-500">On réinjecte le temps de vol total dans la coordonnée horizontale x(t) :</p>
            <div className="font-mono text-xs text-slate-500 bg-white p-2 rounded border border-indigo-50/50">
              x_max = v₀_x · t_total = {v_0x.toFixed(2)} · {theory.flightTime.toFixed(2)}s = <span className="text-indigo-600 font-bold">{theory.range.toFixed(2)} mètres</span>
            </div>
          </div>
        </div>
      </div>

      {/* Friction Air resistance educational note */}
      <div className="flex gap-3 bg-violet-50/50 border border-violet-100 p-4 rounded-xl text-slate-650" id="lesson-friction-educational">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 shrink-0 font-bold font-sans">!</div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-violet-950">L'influence cruciale des frottements de l'air :</span>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Comparez vos résultats réels ci-dessus avec la courbe affichée. 
            Avec frottement (<b>courbe bleue</b>), le projectile perd constamment sa vitesse horizontale. 
            Son angle d'impact au sol est donc beaucoup plus vertical (plus proche de -90°) que son angle initial. 
            C'est ce qui explique le repli asymétrique de la parabole réelle que l'on observe sur les ballons de football ou les balles de tennis !
          </p>
        </div>
      </div>
    </div>
  );
}
