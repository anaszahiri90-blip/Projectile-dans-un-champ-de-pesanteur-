/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, Trophy, HelpCircle, RefreshCcw, Swords, CheckCircle2, XCircle } from 'lucide-react';
import { TargetChallenge, PhysicalParameters, TrajectoryData } from '../types';

interface ChallengePanelProps {
  challenge: TargetChallenge;
  setChallenge: React.Dispatch<React.SetStateAction<TargetChallenge>>;
  params: PhysicalParameters;
  setParams: React.Dispatch<React.SetStateAction<PhysicalParameters>>;
  setIsPlaying: (p: boolean) => void;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  activeTrajectory?: TrajectoryData;
}

export interface ChallengeLevel {
  id: string;
  name: string;
  description: string;
  targetX: number;
  targetY: number;
  obstacleActive: boolean;
  obstacleX: number;
  obstacleY: number;
  obstacleWidth: number;
  obstacleHeight: number;
  presetParams: Partial<PhysicalParameters>;
}

const PRESET_LEVELS: ChallengeLevel[] = [
  {
    id: 'easy_ground',
    name: "Niveau 1 : Test d'initiation de portée (Initiation)",
    description: "La cible est placée sur le sol à une distance de X = 25m. Aucun obstacle n'est présent. Trouvez la vitesse et l'angle optimaux pour l'atteindre !",
    targetX: 25,
    targetY: 0,
    obstacleActive: false,
    obstacleX: 0,
    obstacleY: 0,
    obstacleWidth: 0,
    obstacleHeight: 0,
    presetParams: { h0: 0, airResistanceEnabled: false, v0: 16, angle: 30, mass: 1 },
  },
  {
    id: 'medium_wall',
    name: 'Niveau 2 : Passage par-dessus le mur (Obstacle)',
    description: "La cible se situe à une distance de 40m, abritée par un mur vertical de 8 mètres de hauteur situé au milieu du parcours (X = 18m).",
    targetX: 40,
    targetY: 0,
    obstacleActive: true,
    obstacleX: 18,
    obstacleY: 0,
    obstacleWidth: 3,
    obstacleHeight: 8,
    presetParams: { h0: 0, airResistanceEnabled: false, v0: 22, angle: 55, mass: 1 },
  },
  {
    id: 'hard_roof',
    name: 'Niveau 3 : Le toit fortifié (Hauteur et Distance)',
    description: "La cible est posée sur une plateforme surélevée (altitude Y = 5.5m) située à 35m du point d'impact, avec un mur d'obstacle de 8.5 mètres à franchir.",
    targetX: 35,
    targetY: 5.5,
    obstacleActive: true,
    obstacleX: 15,
    obstacleY: 0,
    obstacleWidth: 4,
    obstacleHeight: 8.5,
    presetParams: { h0: 0, airResistanceEnabled: false, v0: 24, angle: 45, mass: 1 },
  },
];

export default function ChallengePanel({
  challenge,
  setChallenge,
  params,
  setParams,
  setIsPlaying,
  setCurrentTime,
  activeTrajectory,
}: ChallengePanelProps) {

  const [studentHeightInput, setStudentHeightInput] = React.useState('');
  const [isVerified, setIsVerified] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<'correct' | 'incorrect' | null>(null);
  const [showResolution, setShowResolution] = React.useState(false);

  React.useEffect(() => {
    setStudentHeightInput('');
    setIsVerified(false);
    setVerificationResult(null);
    setShowResolution(false);
  }, [params, challenge.targetX, challenge.obstacleHeight, challenge.obstacleX]);

  // Dynamically compute analytical clearance details at the center of the wall
  const analyticalDetails = React.useMemo(() => {
    if (!challenge.active || !challenge.obstacleActive) return null;
    
    const xObs = challenge.obstacleX + challenge.obstacleWidth / 2;
    const v0 = params.v0;
    const angleRad = (params.angle * Math.PI) / 180;
    const g = params.g;
    const h0 = params.h0;
    
    const v0x = v0 * Math.cos(angleRad);
    const v0y = v0 * Math.sin(angleRad);
    
    if (v0x <= 0.01) {
      return { reaches: false, reason: "Le projectile a été lancé verticalement ou vers l'arrière !" };
    }
    
    const tPassage = xObs / v0x;
    const yPassageVacuum = -0.5 * g * tPassage * tPassage + v0y * tPassage + h0;
    
    // Calculate total flight time under vacuum to see if it lands before the obstacle distance
    const a = -0.5 * g;
    const b = v0y;
    const c = h0;
    const delta = b * b - 4 * a * c;
    let tFlightVacuum = 0;
    if (delta >= 0) {
      tFlightVacuum = (-b - Math.sqrt(delta)) / (2 * a);
    }
    
    const landsBefore = tPassage > tFlightVacuum || yPassageVacuum < 0;
    
    return {
      reaches: !landsBefore,
      tPassage,
      yPassageVacuum: Math.max(0, yPassageVacuum),
      xObs,
      obstacleHeight: challenge.obstacleHeight
    };
  }, [params, challenge]);

  const handleVerify = () => {
    if (!analyticalDetails || !analyticalDetails.reaches) return;
    
    const parsedInput = parseFloat(studentHeightInput.replace(',', '.'));
    if (isNaN(parsedInput)) return;
    
    setIsVerified(true);
    const absDiff = Math.abs(parsedInput - analyticalDetails.yPassageVacuum);
    // Allow an acceptable precision margin (e.g., 0.25m) for student rounded manual inputs
    if (absDiff <= 0.25) {
      setVerificationResult('correct');
    } else {
      setVerificationResult('incorrect');
    }
  };

  // Load a preset challenge level
  const loadLevel = (level: ChallengeLevel) => {
    setIsPlaying(false);
    setCurrentTime(0);

    // Apply level params
    setParams((prev) => ({
      ...prev,
      ...level.presetParams,
    }));

    setChallenge({
      active: true,
      targetX: level.targetX,
      targetY: level.targetY,
      targetRadius: 2.0,
      obstacleActive: level.obstacleActive,
      obstacleX: level.obstacleX,
      obstacleY: level.obstacleY,
      obstacleWidth: level.obstacleWidth,
      obstacleHeight: level.obstacleHeight,
      hasHit: false,
      isFailed: false,
      attempts: 0,
    });
  };

  // Generate a random customized sandbox challenge
  const generateRandomChallenge = () => {
    setIsPlaying(false);
    setCurrentTime(0);

    const randX = 20 + Math.floor(Math.random() * 25); // 20m - 45m
    const randY = Math.random() > 0.6 ? 2 + Math.floor(Math.random() * 8) : 0; // sometimes flat, sometimes elevated
    const hasObstacle = Math.random() > 0.4;
    
    const obsX = 8 + Math.floor(Math.random() * (randX - 14));
    const obsH = 4 + Math.floor(Math.random() * 6); // 4m - 10m

    // Configure a base pleasant configuration parameter
    setParams((prev) => ({
      ...prev,
      h0: randY > 0 ? 0 : Math.random() > 0.5 ? 2 : 0,
    }));

    setChallenge({
      active: true,
      targetX: randX,
      targetY: randY,
      targetRadius: 2.0,
      obstacleActive: hasObstacle,
      obstacleX: obsX,
      obstacleY: 0,
      obstacleWidth: 2.5,
      obstacleHeight: obsH,
      hasHit: false,
      isFailed: false,
      attempts: 0,
    });
  };

  // Deactivate challenge mode
  const stopChallenge = () => {
    setChallenge((prev) => ({
      ...prev,
      active: false,
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 space-y-6" id="challenge-panel-container">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-650 animate-pulse" />
            Défis académiques & entraînement
          </h2>
          <p className="text-xs text-slate-500">Développez votre intuition physique et visez les cibles dans ce simulateur !</p>
        </div>

        {challenge.active && (
          <button
            onClick={stopChallenge}
            className="text-xs font-semibold text-slate-550 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer transition"
          >
            Quitter le défi
          </button>
        )}
      </div>

      {challenge.active ? (
        /* Active Game HUD screen */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-red-50/20 p-4 rounded-xl border border-red-100/50">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Coordonnées de la cible</span>
              <span className="font-mono text-sm font-extrabold text-red-700">
                X = {challenge.targetX} m | Y = {challenge.targetY} m
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Tirs effectués</span>
              <span className="font-mono text-sm font-extrabold text-slate-700">
                {challenge.attempts} tentative(s)
              </span>
            </div>

            {challenge.obstacleActive && (
              <div className="col-span-2 pt-2 border-t border-red-100/30 text-[11px] text-slate-600 font-sans">
                ⚠️ <b className="text-red-950 font-bold">Alerte Obstacle :</b> Il y a un mur vertical de hauteur <b>{challenge.obstacleHeight} m</b> situé à <b>X = {challenge.obstacleX} m</b>. Ajustez de l'angle et de la vitesse pour passer au-dessus !
              </div>
            )}
          </div>

          {/* Mission Élève - Vérification de la hauteur de dégagement */}
          {challenge.obstacleActive && analyticalDetails && (
            <div className="p-4 rounded-xl border border-indigo-150 bg-indigo-50/15 space-y-3 shadow-inner" id="educational-clearance-task">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] font-bold text-white uppercase font-mono">Calcul</span>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-widest">
                  Mission élève : Vérifier si la hauteur franchit le mur d'obstacle
                </h4>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Calculez l'altitude théorique attendue <span className="font-mono text-indigo-700 font-bold">Y(x)</span> du projectile lorsqu'il arrive au niveau de l'obstacle (<span className="font-mono font-semibold">x = {analyticalDetails.xObs.toFixed(1)} m</span>) pour vérifier s'il franchit le mur de face (en considérant l'idéal sous vide) :
                <br />
                <span className="inline-block mt-1.5 font-mono text-[10px] text-slate-500 bg-white/70 px-2 py-1 rounded border border-slate-100 shadow-sm direction-ltr text-left">
                  v₀ = {params.v0} m/s | θ = {params.angle}° | h₀ = {params.h0} m | g = {params.g} m/s²
                </span>
              </p>
              
              {analyticalDetails.reaches ? (
                <div className="space-y-2.5 font-sans">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={studentHeightInput}
                      onChange={(e) => setStudentHeightInput(e.target.value)}
                      placeholder="Votre réponse (ex: 8.41)"
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline bg-white text-slate-800 focus:outline-indigo-500 font-mono shadow-sm"
                      id="student-height-answer-input"
                    />
                    <button
                      onClick={handleVerify}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0 shadow-sm"
                    >
                      Vérifier
                    </button>
                  </div>
                  
                  {isVerified && (
                    <div className="text-xs">
                      {verificationResult === 'correct' ? (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-250 text-emerald-800 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
                          <div>
                            <b>Excellent travail !</b> Vos calculs ou approximations sont parfaitement corrects. La hauteur théorique calculée est bien d'environ <b>{analyticalDetails.yPassageVacuum.toFixed(2)} m</b>, ce qui prouve mathématiquement qu'il passe au-dessus du mur.
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-250 text-amber-900 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <b>La réponse diffère de la théorie !</b> La hauteur attendue n'est pas tout à fait correcte. Rappel de la méthode : trouvez l'instant t = x / (v₀·cosθ) puis calculez Y(t).
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Detailed resolution steps */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowResolution(!showResolution)}
                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                    >
                      {showResolution ? 'Masquer la démonstration détaillée 📝' : 'Afficher la démonstration détaillée 📝'}
                    </button>
                    
                    {showResolution && (
                      <div className="mt-2.5 bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2 text-[10.5px] text-slate-700 font-sans leading-relaxed text-left">
                        <div>
                          <b className="text-indigo-950 font-bold block mb-1">1. Temps de vol jusqu'à l'abscisse de l'obstacle :</b>
                          <div className="font-mono text-slate-500 bg-white px-2 py-1.5 rounded border border-slate-100 inline-block direction-ltr text-left">
                            t_passage = x_obstacle / (v₀ * cos(θ))
                            <br />
                            t_passage = {analyticalDetails.xObs.toFixed(1)} / ({params.v0} * cos({params.angle}°)) = <span className="text-indigo-650 font-bold">{analyticalDetails.tPassage.toFixed(3)} s</span>
                          </div>
                        </div>
                        
                        <div>
                          <b className="text-indigo-950 font-bold block mb-1">2. Altitude théorique Y à cet instant :</b>
                          <div className="font-mono text-slate-500 bg-white px-2 py-1.5 rounded border border-slate-100 inline-block direction-ltr text-left">
                            Y(t) = -0.5 * g * t² + v₀*sin(θ)*t + h₀
                            <br />
                            Y = -0.5 * {params.g} * ({analyticalDetails.tPassage.toFixed(3)})² + {params.v0} * sin({params.angle}°) * {analyticalDetails.tPassage.toFixed(3)} + {params.h0}
                            <br />
                            Y ≈ <span className="text-indigo-650 font-bold">{analyticalDetails.yPassageVacuum.toFixed(2)} m</span>
                          </div>
                        </div>
                        
                        <div>
                          <b className="text-indigo-950 font-bold block mb-1">3. Comparaison avec la hauteur de l'obstacle :</b>
                          <p className="mt-1">
                            Altitude théorique du projectile : <b>{analyticalDetails.yPassageVacuum.toFixed(2)} m</b>
                            <br />
                            Hauteur du mur d'obstacle : <b>{challenge.obstacleHeight} m</b>
                          </p>
                          <div className={`p-2 rounded text-center font-mono font-bold mt-1.5 ${
                            analyticalDetails.yPassageVacuum > challenge.obstacleHeight 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' 
                              : 'bg-red-50 text-red-800 border border-red-250'
                          }`}>
                            {analyticalDetails.yPassageVacuum > challenge.obstacleHeight 
                              ? `Le projectile franchit le mur avec une marge de : +${(analyticalDetails.yPassageVacuum - challenge.obstacleHeight).toFixed(2)} m` 
                              : `Collision directe théorique : défaut de hauteur de ${(challenge.obstacleHeight - analyticalDetails.yPassageVacuum).toFixed(2)} m`
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 text-xs border border-amber-100 font-sans">
                  ⚠️ Le projectile retombe au sol avant d'arriver au niveau de l'obstacle ({analyticalDetails.xObs.toFixed(1)} m). Augmentez la vitesse initiale ou modifiez l'angle pour franchir la distance.
                </div>
              )}
            </div>
          )}

          {/* Hit / Failed status notifications feedback */}
          <div className="flex flex-col gap-3">
            {challenge.hasHit ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-55 border border-emerald-250 text-emerald-800 font-sans">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />
                <div className="text-xs leading-normal">
                  <b>Cible atteinte avec succès !</b> Vous avez touché le centre de la cible en <b>{challenge.attempts}</b> tentative(s). Votre angle d'inclinaison ({Math.round(params.angle)}°) et vitesse ({params.v0.toFixed(1)} m/s) sont parfaits !
                </div>
              </div>
            ) : challenge.isFailed ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-sans">
                <XCircle className="w-5 h-5 text-red-600" />
                <div className="text-xs leading-normal">
                  <b>Impact manqué / Échec du tir !</b> Le projectile s'est écrasé au sol ou contre l'obstacle avant d'atteindre la cible. Modifiez la vitesse initiale et l'angle pour ajuster la portée et le sommet !
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100/50 flex items-start gap-2 font-sans">
                <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <span>
                  Ajustez la <b>masse, la vitesse initiale et l'angle d'inclinaison</b> dans le panneau latéral pour adapter la trajectoire, puis cliquez sur le bouton <b>Lancer</b> pour lancer le projectile physique.
                </span>
              </div>
            )}

            {!challenge.hasHit && !challenge.isFailed && (
              <div className="text-[11px] text-slate-500 italic font-sans">
                💡 <b>Indice d'apprentissage :</b> Pour franchir un obstacle situé à {challenge.obstacleX} m, l'altitude de la trajectoire à cette abscisse doit être supérieure à {challenge.obstacleHeight} m. Utilisez un angle supérieur à 45° pour une cloche plus haute !
              </div>
            )}
          </div>

          {/* Reset / New Levels action options */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={generateRandomChallenge}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer font-sans"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Générer un défi aléatoire
            </button>
          </div>
        </div>
      ) : (
        /* Inactive welcome state: listing potential levels */
        <div className="space-y-4">
          <p className="text-[11px] md:text-xs text-slate-550 leading-relaxed font-sans">
            Cher élève, appliquez les lois du mouvement d'un projectile dans un champ de pesanteur uniforme (portée, sommet, zéniths) pour atteindre ces objectifs académiques et surmonter les obstacles :
          </p>

          <div className="space-y-3">
            {PRESET_LEVELS.map((level) => (
              <div
                key={level.id}
                className="group border border-slate-150 p-3 rounded-xl hover:border-slate-350 hover:bg-slate-50/50 transition flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800">{level.name}</h3>
                  <p className="text-[11px] text-slate-450 leading-normal">{level.description}</p>
                </div>
                <button
                  onClick={() => loadLevel(level)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition shadow-sm whitespace-nowrap"
                >
                  Commencer le défi
                </button>
              </div>
            ))}

            {/* Random custom sandbox trigger */}
            <div
              onClick={generateRandomChallenge}
              className="border-2 border-dashed border-slate-200 p-3.5 rounded-xl text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/10 transition group"
            >
              <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="text-xs font-bold text-slate-700 block">Arène des défis aléatoires</span>
              <span className="text-[10px] text-slate-400">Générez une cible et un obstacle de hauteurs et positions aléatoires de manière automatique !</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
