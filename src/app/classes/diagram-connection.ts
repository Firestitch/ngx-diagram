
import {
  Connection, EVENT_CONNECTION_CLICK, EVENT_CONNECTION_MOUSEOUT,
  EVENT_CONNECTION_MOUSEOVER, LabelOverlay,
} from '@jsplumb/browser-ui';

import { FsDiagramDirective } from '../directives/diagram';
import { ConnectionOverlayType } from '../helpers/enums';
import {
  ConnectionConfig, ConnectionEvent, ConnectionLabelConfig,
} from '../interfaces/connection-config';

import {
  ConnectorArchConfig, ConnectorCurveConfig, ConnectorElbowConfig, ConnectorStraightConfig,
} from './../interfaces/connector-config';

export class DiagramConnection {

  public connection: Connection;

  private _diagram: FsDiagramDirective;
  private _config: ConnectionConfig = {};

  constructor( 
    diagram: FsDiagramDirective,
    connection,
  ) {
    this.connection = connection;
    this._config = connection.getData()['connection-config'] || {};
    this._diagram = diagram;
  }

  public get label(): ConnectionLabelConfig {
    return this._config.label || {};
  }

  public setLabel(label: string) {
    const overlay: LabelOverlay = this.connection.getOverlay(this.labelId);
    if(overlay) {
      overlay.setLabel(label);
    } else{
      let cssClass = 'fs-diagram-connection-label';
      if (this._config.click) {
        cssClass += ' fs-diagram-clickable';
      }

      this.connection
        .addOverlay({
          type: ConnectionOverlayType.Label,
          options: {
            label,
            cssClass: cssClass,
            id: this.labelId,
          },
        });
    }
  }
  

  public setTooltip(label: string) {
    const overlay: LabelOverlay = this.connection.getOverlay(this.tooltipId);
    if(overlay) {
      overlay.setLabel(label);
    } else{
      this.connection
        .addOverlay({
          type: ConnectionOverlayType.Label,
          options: {
            label,
            cssClass: 'fs-diagram-connection-tooltip-overlay',
            id: this.tooltipId,
          },
        });
    }
  }

  public setConnector(
    connector:  ConnectorArchConfig | ConnectorElbowConfig | ConnectorCurveConfig | ConnectorStraightConfig,
  ) {
    connector = { ...this._diagram.config.connector, ...connector };
    this.connection.connector.type = connector.type;
  }

  public disconnect() {
    if (this.connection.endpoints) {
      this.connection.instance.deleteConnection(this.connection);
    }

    this.connection.removeAllOverlays();
    this.connection.unbind();
  }

  public get labelId() {
    return `label-${this.connection.id}`;
  }

  public get tooltipId() {
    return `tooltip-${this.connection.id}`;
  }

  // eslint-disable-next-line max-statements
  public render() {
    if (this._config.connector) {
      this.setConnector(this._config.connector);
    }

    // if (this._config.data) {
    //   forOwn(this._config.data, (value, name) => {
    //     this.connection.setData({
    //       [name]: value,
    //     });
    //   });
    // }

    this.connection.addClass('fs-diagram-connection');
    this.connection.scope = this._config.name;

    this._bindClickEvent();
    this._bindTooltipEvent();

    if (this._config.click) {
      this.connection.addClass('fs-diagram-clickable');
    }

    if (this._config.label) {
      this.setLabel(this._config.label.content);
    }
  }

  private _bindTooltipEvent() {
    if (!this._config.tooltip) {
      return;
    }

    this.connection.instance
      .bind(EVENT_CONNECTION_MOUSEOVER, (connection: Connection) => {
        if (connection === this.connection) {
          Object.values(connection.getOverlays())
            .forEach((overlay) => {
              const el = document.querySelector(`.jtk-overlay[jtk-overlay-id="${overlay.id}"]`);
              el?.classList.add('show');
            });
        }
      });

    this.connection.instance
      .bind(EVENT_CONNECTION_MOUSEOUT, (connection: Connection) => {
        if (connection === this.connection) {
          Object.values(connection.getOverlays())
            .forEach((overlay) => {
              const el = document.querySelector(`.jtk-overlay[jtk-overlay-id="${overlay.id}"]`);
            
              el?.classList.remove('show');
            });
        }
      });
 
    this.setTooltip(this._config.tooltip.content);
  }

  private _bindClickEvent() {
    this.connection.instance
      .bind(EVENT_CONNECTION_CLICK, (connection: Connection, event: PointerEvent) => {
        if(connection === this.connection) {
          const connectonEvent: ConnectionEvent = {
            data: connection.getData(),
            event,
            connection: this,
          };

          if (this._config.click) {
            this._config.click(connectonEvent);
          }
        }
      });
  }
}
