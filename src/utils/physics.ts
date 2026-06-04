/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectilePreset, EnvironmentPreset, PhysicalParameters, SimulationPoint, TrajectoryData } from '../types';

// Presets definitions
export const PROJECTILE_PRESETS: ProjectilePreset[] = [
  { id: 'tennis', name: 'Tennis Ball', nameFr: 'Balle de tennis', mass: 0.057, diameter: 0.067, cd: 0.45 },
  { id: 'football', name: 'Football', nameFr: 'Ballon de foot', mass: 0.43, diameter: 0.220, cd: 0.25 },
  { id: 'golf', name: 'Golf Ball', nameFr: 'Balle de golf', mass: 0.045, diameter: 0.043, cd: 0.24 },
  { id: 'cannonball', name: 'Cannonball', nameFr: 'Boulet de canon', mass: 8.0, diameter: 0.120, cd: 0.47 },
  { id: 'balloon', name: 'Balloon', nameFr: 'Ballon gonflable', mass: 0.003, diameter: 0.250, cd: 0.50 },
  { id: 'custom', name: 'Custom Projectile', nameFr: 'Projectile personnalisé', mass: 1.0, diameter: 0.100, cd: 0.40 },
];

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  { id: 'earth', name: 'Earth', nameFr: 'Terre (1g)', g: 9.81, density: 1.225 },
  { id: 'moon', name: 'Moon', nameFr: 'Lune (0.16g)', g: 1.62, density: 0.0 },
  { id: 'mars', name: 'Mars', nameFr: 'Mars (0.38g)', g: 3.71, density: 0.020 }, // Mars has thin atmosphere
  { id: 'jupiter', name: 'Jupiter', nameFr: 'Jupiter (2.5g)', g: 24.79, density: 0.200 }, // Dense outer atmosphere
  { id: 'vacuum_space', name: 'Deep Space', nameFr: 'Vide spatial (0g)', g: 0.1, density: 0.0 }, // Almost no gravity, no air
];

/**
 * Calculates a complete simulation trajectory.
 * Integrates equations of motion numerically using the 4th-order Runge-Kutta (RK4) method.
 * If air resistance is disabled, this still computes the same format, matching analytical paths.
 */
export function calculateTrajectory(params: PhysicalParameters): TrajectoryData {
  const points: SimulationPoint[] = [];
  
  const g = params.g;
  const thetaRad = (params.angle * Math.PI) / 180;
  
  // Initial state variables
  let t = 0;
  let x = 0;
  let y = params.h0;
  
  let vx = params.v0 * Math.cos(thetaRad);
  let vy = params.v0 * Math.sin(thetaRad);
  
  const mass = params.mass;
  const radius = params.diameter / 2;
  const area = Math.PI * radius * radius;
  const cd = params.cd;
  const rho = params.airResistanceEnabled ? params.airDensity : 0.0;
  
  // Drag coeff term: F_drag = 0.5 * rho * Cd * A * v^2
  // Acceleration drag Term = 0.5 * rho * Cd * A * v * vec(v) / mass
  const dragFactor = (0.5 * cd * rho * area) / mass;

  // We choose a small time-step for high integration accuracy (e.g., dt = 0.01s)
  const dt = 0.005; 
  const maxSteps = 15000; // safety ceiling
  
  // Helper to compute accelerations
  const getAcceleration = (curr_vx: number, curr_vy: number) => {
    const v = Math.sqrt(curr_vx * curr_vx + curr_vy * curr_vy);
    const ax = -dragFactor * v * curr_vx;
    const ay = -g - dragFactor * v * curr_vy;
    return { ax, ay };
  };

  // Helper to compute energies
  const getEnergies = (curr_y: number, curr_vx: number, curr_vy: number) => {
    const v2 = curr_vx * curr_vx + curr_vy * curr_vy;
    const ke = 0.5 * mass * v2;
    const pe = mass * g * Math.max(0, curr_y);
    const me = ke + pe;
    return { ke, pe, me };
  };

  let step = 0;
  let maxHeight = y;
  let maxHeightTime = 0;

  // First point (t = 0)
  const initialAccel = getAcceleration(vx, vy);
  const initialEnergies = getEnergies(y, vx, vy);
  
  points.push({
    t,
    x,
    y,
    vx,
    vy,
    ax: initialAccel.ax,
    ay: initialAccel.ay,
    ke: initialEnergies.ke,
    pe: initialEnergies.pe,
    me: initialEnergies.me,
  });

  // Numeric step loop with RK4
  while (y >= 0 && step < maxSteps) {
    // Stage 1
    const x1 = x;
    const y1 = y;
    const vx1 = vx;
    const vy1 = vy;
    const a1 = getAcceleration(vx1, vy1);

    // Stage 2
    const x2 = x + 0.5 * dt * vx1;
    const y2 = y + 0.5 * dt * vy1;
    const vx2 = vx + 0.5 * dt * a1.ax;
    const vy2 = vy + 0.5 * dt * a1.ay;
    const a2 = getAcceleration(vx2, vy2);

    // Stage 3
    const x3 = x + 0.5 * dt * vx2;
    const y3 = y + 0.5 * dt * vy2;
    const vx3 = vx + 0.5 * dt * a2.ax;
    const vy3 = vy + 0.5 * dt * a2.ay;
    const a3 = getAcceleration(vx3, vy3);

    // Stage 4
    const x4 = x + dt * vx3;
    const y4 = y + dt * vy3;
    const vx4 = vx + dt * a3.ax;
    const vy4 = vy + dt * a3.ay;
    const a4 = getAcceleration(vx4, vy4);

    // Update state using weighted averages
    x += (dt / 6) * (vx1 + 2 * vx2 + 2 * vx3 + vx4);
    y += (dt / 6) * (vy1 + 2 * vy2 + 2 * vy3 + vy4);
    vx += (dt / 6) * (a1.ax + 2 * a2.ax + 2 * a3.ax + a4.ax);
    vy += (dt / 6) * (a1.ay + 2 * a2.ay + 2 * a3.ay + a4.ay);
    t += dt;
    step++;

    const accel = getAcceleration(vx, vy);
    const energies = getEnergies(y, vx, vy);

    if (y > maxHeight) {
      maxHeight = y;
      maxHeightTime = t;
    }

    // Add point
    points.push({
      t,
      x: Math.max(0, x),
      y: Math.max(0, y),
      vx,
      vy,
      ax: accel.ax,
      ay: accel.ay,
      ke: energies.ke,
      pe: energies.pe,
      me: energies.me,
    });

    // Stop if we hit ground
    if (y < 0) {
      break;
    }
  }

  // Adjust last point exactly to y = 0 via linear interpolation
  if (points.length > 1 && points[points.length - 1].y < 0) {
    const penult = points[points.length - 2];
    const ult = points[points.length - 1];
    // Interpolation factor to reach y = 0
    const ratio = penult.y / (penult.y - ult.y);
    const tExact = penult.t + ratio * (ult.t - penult.t);
    const xExact = penult.x + ratio * (ult.x - penult.x);
    const yExact = 0;
    const vxExact = penult.vx + ratio * (ult.vx - penult.vx);
    const vyExact = penult.vy + ratio * (ult.vy - penult.vy);
    const accelExact = getAcceleration(vxExact, vyExact);
    const energiesExact = getEnergies(yExact, vxExact, vyExact);

    points[points.length - 1] = {
      t: tExact,
      x: xExact,
      y: yExact,
      vx: vxExact,
      vy: vyExact,
      ax: accelExact.ax,
      ay: accelExact.ay,
      ke: energiesExact.ke,
      pe: energiesExact.pe,
      me: energiesExact.me,
    };
  }

  const lastPoint = points[points.length - 1];
  const flightTime = lastPoint.t;
  const range = lastPoint.x;
  const impactSpeed = Math.sqrt(lastPoint.vx * lastPoint.vx + lastPoint.vy * lastPoint.vy);
  // Angle of landing (going downwards, so negative angle. We express it absolute or directed)
  const impactAngle = (Math.atan2(lastPoint.vy, lastPoint.vx) * 180) / Math.PI;

  return {
    points,
    maxHeight,
    maxHeightTime,
    range,
    flightTime,
    impactSpeed,
    impactAngle,
  };
}

/**
 * Calculates theoretical values strictly in vacuum (ideal formulas)
 */
export function calculateTheoreticalVacuum(params: PhysicalParameters) {
  const g = params.g;
  const thetaRad = (params.angle * Math.PI) / 180;
  const v0 = params.v0;
  const h0 = params.h0;

  const sinTh = Math.sin(thetaRad);
  const cosTh = Math.cos(thetaRad);

  // Time of flight: solve h0 + v0*sin(th)*t - 1/2*g*t^2 = 0
  let tFlight = 0;
  if (g > 0) {
    const a = -0.5 * g;
    const b = v0 * sinTh;
    const c = h0;
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      tFlight = (-b - Math.sqrt(disc)) / (2 * a);
    }
  }

  const range = v0 * cosTh * tFlight;
  
  // Max height (flèche)
  // If angle is 0, maximum height is simply initial height h0. Else:
  const tPeak = (v0 * sinTh) / g;
  const maxHeight = tPeak > 0 ? h0 + (v0 * v0 * sinTh * sinTh) / (2 * g) : h0;

  // Impact velocity components
  const vxImpact = v0 * cosTh;
  const vyImpact = v0 * sinTh - g * tFlight;
  const impactSpeed = Math.sqrt(vxImpact * vxImpact + vyImpact * vyImpact);
  const impactAngle = (Math.atan2(vyImpact, vxImpact) * 180) / Math.PI;

  return {
    flightTime: tFlight,
    range,
    maxHeight,
    maxHeightTime: tPeak > 0 ? tPeak : 0,
    impactSpeed,
    impactAngle,
  };
}
