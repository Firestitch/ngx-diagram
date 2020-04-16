import { ConnectionOverlayType } from '../helpers';


export interface ConnectionOverlayConfig {
  id?: string;
  type: ConnectionOverlayType;
  label?: string;
  click?: Function,
  location?: number,
  direction?: number,
  tooltip?: string
}
