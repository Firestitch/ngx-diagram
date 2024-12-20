import { PointShape } from '../helpers/enums';

import {
  ConnectorArchConfig,
  ConnectorCurveConfig,
  ConnectorElbowConfig,
  ConnectorStraightConfig,
} from './connector-config';
import { HoverPaintStyleConfig } from './hover-paint-style-config';
import { PaintStyleConfig } from './paint-style-config';


export interface DiagramConfig {
  paintStyle?: PaintStyleConfig;
  hoverPaintStyle?: HoverPaintStyleConfig;
  Point?: DiagramSourceConfig;
  targetPoint?: DiagramSourceConfig;
  connector?: ConnectorArchConfig | ConnectorElbowConfig | ConnectorCurveConfig | ConnectorStraightConfig
}

export interface DiagramSourceConfig {
  length?: number;
  width?: number;
  foldback?: number;
  location?: number;
  shape?: PointShape;
  direction?: number;
}
