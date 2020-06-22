import { DiagramService } from './../services/diagram.service';
import { DiagramConfig } from './../interfaces/diagram-config';
import { ConnectorArchConfig, ConnectorElbowConfig, ConnectorCurveConfig, ConnectorStraightConfig } from './../interfaces/connector-config';
import { forOwn } from 'lodash-es';
import { ConnectionEvent, ConnectionLabelConfig, ConnectionConfig } from '../interfaces/connection-config';
import { ConnectionOverlayType } from '../helpers/enums';
import { NgZone } from '@angular/core';

export class DiagramConnection {

  public connection;
  private _jsPlumb;
  private _diagramConfig: DiagramConfig;
  private _config: ConnectionConfig = {};
  private _ngZone: NgZone;
  private _diagramService: DiagramService;

  public constructor( diagramService: DiagramService,
                      connection,
                      config?: ConnectionConfig) {

    this._jsPlumb = diagramService.jsPlumb;
    this._diagramService = diagramService;
    this._diagramConfig = diagramService.diagramConfig;
    this.connection = connection;
    this._ngZone = diagramService.ngZone;

    if (config) {
      this.config = config || {};
    }
  }

  public set config(value) {
    this._config = value;
    this.setData('connection-config', value);
  }

  public get config() {
    return this._config;
  }

  public setLabelContent(content) {
    if (!this.config.label) {
      this.config.label = {};
    }
    this.config.label.content = content;
    this.render();
  }

  public setLabel(label: ConnectionLabelConfig) {
    this.config.label = label;
    this.render();
  }

  public setConnector(connector:  ConnectorArchConfig | ConnectorElbowConfig |
                                  ConnectorCurveConfig | ConnectorStraightConfig) {
    connector = Object.assign({}, this._diagramConfig.connector, connector);
    this.connection.setConnector([connector.type, connector ]);
  }

  public setData(name, value?) {
    const data = this.connection.getData() || {};
    data[name] = value;
    this.connection.setData(data);
  }

  public disconnect() {
    if (this.connection.endpoints) {
      this._jsPlumb.deleteConnection(this.connection);
    }
  }

  public render() {

    this.connection.removeAllOverlays();

    if (this.config.connector) {
      this.setConnector(this.config.connector);
    }

    if (this.config.data) {
      forOwn(this.config.data, (value, name) => {
        this.setData(name, value);
      });
    }

    this.connection.addClass('fs-diagram-connection');
    this.connection.scope = this.config.name;

    const tooltipId = 'tooltip_' + this.connection.id;
    const labelId = 'label_' + this.connection.id;

    this.connection.unbind('click');
    this.connection.unbind('mouseover');
    this.connection.unbind('mouseout');

    this.connection.addClass('fs-diagram-clickable');
    if (this.config.tooltip) {
      this.connection.bind('mouseover', (conn, event) => {

        if (this._diagramService.dragging) {
          return false;
        }

        this._ngZone.runOutsideAngular(() => {
          const tip = document.querySelector(`.fs-diagram-connection-tooltip_${conn.id}`);
          if (tip) {

            if (conn.tooltipTimer) {
              clearInterval(conn.tooltipTimer);
            }

            tip.classList.add('show');
          }
        });
      });

      this.connection.bind('mouseout', (conn, event) => {

        if (this._diagramService.dragging) {
          return false;
        }

        this._ngZone.runOutsideAngular(() => {
          const tip = document.querySelector(`.fs-diagram-connection-tooltip_${conn.id}`);

          if (tip) {
            conn.tooltipTimer = setTimeout(() => {
              tip.classList.remove('show');
            }, 100);
          }
        });
      });

      const label = `<div class="fs-diagram-connection-tooltip fs-diagram-connection-tooltip_` +
                    `${this.connection.id}">${this.config.tooltip.content}</div>`;

      this.connection.addOverlay([ConnectionOverlayType.Label,
        {
          label: label,
          id: tooltipId,
          cssClass: 'fs-diagram-connection-tooltip-overlay'
        }]);
    }

    this.connection.bind('click', (e, originalEvent) => {
      const event: ConnectionEvent = {
        data: this.connection.getData(),
        event: originalEvent,
        connection: this
      };

      if (e.type) {

        if (tooltipId === e.id) {
          // If the connection is clicked
          if (this.config.click) {
            this._ngZone.run(() => {
              this.config.click(event);
            });
          }

        } else if (labelId === e.id) {
          // If the label is clicked
          if (this.config.label.click) {
            this._ngZone.run(() => {
              this.config.label.click(event);
            });
          }
        }
      } else {
        // If the connection clicked
        if (this.config.click) {
          this._ngZone.run(() => {
            this.config.click(event);
          });
        }
      }
    });

    if (this.config.label) {

      let cssClass = 'fs-diagram-connection-label';
      if (this.config.label.click) {
        cssClass += ' fs-diagram-clickable';
      }

      this.connection.addOverlay([ConnectionOverlayType.Label,
        {
          label: this._renderLabelContent(),
          cssClass: cssClass,
          id: labelId
        }]);
    }

    if (this._diagramConfig.Point.shape) {
      this._addPoint(this._diagramConfig.Point, this.config.Point, 'source');
    }

    if (this._diagramConfig.targetPoint.shape) {
      this._addPoint(this._diagramConfig.targetPoint, this.config.targetPoint, 'target');
    }
  }

  private _addPoint(defaultConfig, config, name) {
    const overlay = Object.assign(
      {},
      defaultConfig,
      {
        id: `${name}_${this.connection.id}`
      },
      config);

      this.connection.addOverlay([overlay.shape, overlay]);
  }

  private _renderLabelContent() {
    let label = this.config.label.content;

    if (this.config.label.tooltip) {
      label += '<div class="fs-diagram-connection-label-tooltip">' + this.config.label.tooltip.content + '</div>';
    }

    return label;
  }
}
