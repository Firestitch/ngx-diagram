import { ConnectorType } from './../helpers/enums';

export interface ConnectorElbowConfig {
  type?: ConnectorType,
  stub?: number[],
  gap?: number,
  cornerRadius?: number,
  midpoint?: number,
  alwaysRespectStubs?: boolean
}

export interface ConnectorArchConfig {
  type?: ConnectorType,
  margin?: number,
  curviness?: number,
  proximityLimit?: number
}

export interface ConnectorCurveConfig {
  type?: ConnectorType,
  curviness?: number
}

export interface ConnectorStraightConfig {
  type?: ConnectorType,
  stub?: number[],
  gap?: number,
}
