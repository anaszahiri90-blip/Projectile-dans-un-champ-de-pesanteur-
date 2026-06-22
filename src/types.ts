/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectilePreset {
  id: string;
  name: string;
  nameFr: string;
  mass: number; // in kg
  diameter: number; // in meters
  cd: number; // drag coefficient C_d
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  nameFr: string;
  g: number; // in m/s^2
  density: number; // air density in kg/m^3
}

export interface PhysicalParameters {
  v0: number; // initial velocity in m/s
  angle: number; // launch angle in degrees (0 to 90)
  h0: number; // launch height in meters
  g: number; // gravity in m/s^2
  airResistanceEnabled: boolean;
  airDensity: number; // kg/m^3
  mass: number; // kg
  diameter: number; // meters
  cd: number; // drag coefficient
}

export interface SimulationPoint {
  t: number; // time in s
  x: number; // coordinate in m
  y: number; // coordinate in m
  vx: number; // speed component x in m/s
  vy: number; // speed component y in m/s
  ax: number; // accel component x in m/s^2
  ay: number; // accel component y in m/s^2
  ke: number; // kinetic energy in J
  pe: number; // potential energy in J
  me: number; // mechanical energy in J
}

export interface TrajectoryData {
  points: SimulationPoint[];
  maxHeight: number; // y_max
  maxHeightTime: number; // t at y_max
  range: number; // x of landing
  flightTime: number; // total duration
  impactSpeed: number; // speed at landing
  impactAngle: number; // angle at landing in degrees
}

export interface TargetChallenge {
  active: boolean;
  targetX: number;
  targetY: number;
  targetRadius: number;
  obstacleActive: boolean;
  obstacleX: number;
  obstacleY: number;
  obstacleWidth: number;
  obstacleHeight: number;
  hasHit: boolean;
  isFailed: boolean;
  attempts: number;
}

export interface DidacticObstacle {
  active: boolean;
  x: number;
  height: number;
  width: number;
}

