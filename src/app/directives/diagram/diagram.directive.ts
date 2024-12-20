import {
  AfterViewInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  IterableDiffer,
  IterableDiffers,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
} from '@angular/core';

import { forkJoin, Observable, of, Subject } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';

import {
  BrowserJsPlumbInstance, Connection, ConnectionEstablishedParams,
  EndpointOptions, EVENT_CONNECTION, newInstance,
} from '@jsplumb/browser-ui';

import { DiagramConnection } from '../../classes/diagram-connection';
import { ConnectionActor, ConnectorType, PointShape } from '../../helpers/enums';
import { ConnectionConfig } from '../../interfaces/connection-config';
import { ConnectionCreated } from '../../interfaces/connection-created';
import { DiagramConfig } from '../../interfaces/diagram-config';
import { FsDiagramObjectDirective } from '../diagram-object';


@Directive({
  selector: '[fsDiagram]',
})
export class FsDiagramDirective implements AfterViewInit, OnInit, OnDestroy {

  @HostBinding('class.fs-diagram') public classFsDiagram = true;

  @Output() public diagramObjectsAdded = new EventEmitter<FsDiagramObjectDirective[]>();
  @Output() public initialized = new EventEmitter<void>();

  @Output() public connectionCreated = new EventEmitter<ConnectionCreated>();
  
  @Input() public config: DiagramConfig = {};

  @ContentChildren(FsDiagramObjectDirective) 
  public fsDiagramObjects: QueryList<FsDiagramObjectDirective>;

  public dragging = false;
  public diagramObjects = new Map<any, FsDiagramObjectDirective>();

  private _differ: IterableDiffer<FsDiagramObjectDirective>;
  private _destroy$ = new Subject<void>();
  private _jsPlumb: BrowserJsPlumbInstance;

  constructor(
    private _element: ElementRef,
    private _differs: IterableDiffers,
  ) {
    this._jsPlumb = newInstance({ container: this._element.nativeElement });
    this._differ = this._differs.find([]).create(null);
  }

  public ngOnInit() {
    this._initConfig();

    this.jsPlumb.bind(EVENT_CONNECTION, 
      (connectionEvent: ConnectionEstablishedParams, event: Event) => {
        if (event?.defaultPrevented) {
          return;
        }

        if (connectionEvent.connection.target && connectionEvent.connection.source) {
          const diagramConnection = new DiagramConnection(
            this,
            connectionEvent.connection, 
          );

          diagramConnection.render();

          const targetDirective = Array.from(this.diagramObjects.values())
            .find((fsDiagramObject) => fsDiagramObject.el.isEqualNode(connectionEvent.connection.target));

          const sourceDirective = Array.from(this.diagramObjects.values())
            .find((fsDiagramObject) => fsDiagramObject.el.isEqualNode(connectionEvent.connection.source));

          const connectionCreated: ConnectionCreated = {
            connection: diagramConnection,
            target: targetDirective?.data,
            source: sourceDirective?.data,
            actor: event ? ConnectionActor.User : ConnectionActor.Api,
          };

          this.connectionCreated.emit(connectionCreated);
        }
      });

    this.jsPlumb.importDefaults(this.defaultConfig);
  }

  public get defaultConfig(): EndpointOptions {
    return {
      connectionsDetachable: false,
      anchor: 'Continuous',
      endpoint: {
        type: 'Blank',
        options: {
          paintStyle: {
            fill: 'transparent',
            stroke: 'transparent',
          },
        },
      },
      paintStyle: {
        stroke: this.config.paintStyle.stroke,
        strokeWidth: this.config.paintStyle.strokeWidth,
        outlineStroke: 'transparent',
        outlineWidth: 5,
      },
      hoverPaintStyle: {
        stroke: this.config.hoverPaintStyle.stroke,
        strokeWidth: this.config.hoverPaintStyle.strokeWidth,
      },
      connector: {
        type: this.config.connector.type,
        options: this.config.connector,
      },
    };
  }

  public get element(): ElementRef {
    return this._element;
  }

  public get jsPlumb(): BrowserJsPlumbInstance {
    return this._jsPlumb;
  }

  public ngOnDestroy() {
    this.jsPlumb.reset();
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  public processDiff(fsDiagramObjects: QueryList<FsDiagramObjectDirective>): Observable<any> {
    const diff = this._differ.diff(fsDiagramObjects);
    if (diff) {
      const diagramObjects = [];

      diff
        .forEachAddedItem((change) => {
          change.item.init();
          diagramObjects.push(change.item);
        });
        
      diff
        .forEachAddedItem((change) => {
          change.item.connections.forEach((connection) => {
            this.connect(change.item.data, connection.target, connection.config);
          });
        });

      return of(diagramObjects);
    }

    return of([]);
  }

  public ngAfterViewInit(): void {
    this.processDiff(this.fsDiagramObjects)
      .subscribe();

    this.initialized.emit();
    
    this.fsDiagramObjects.changes
      .pipe(
        switchMap((fsDiagramObjects: QueryList<FsDiagramObjectDirective>) => {
          return this.processDiff(fsDiagramObjects);
        }),
        tap((fsDiagramObjects) => {
          this.diagramObjectsAdded.emit(fsDiagramObjects);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe();
  }

  public suspendRendering(func) {
    this.jsPlumb.setSuspendDrawing(true);
    func();
    this.jsPlumb.setSuspendDrawing(false, true);
  }

  public connect(source: any, target: any, config: ConnectionConfig = {}) {
    const sourceDiagram: FsDiagramObjectDirective = this.diagramObjects.get(source);
    const targetDiagram: FsDiagramObjectDirective = this.diagramObjects.get(target);

    this._connect(sourceDiagram, targetDiagram, config);
  }

  public getObjectsConnections(object1: object, object2: object): DiagramConnection[] {
    const object1Diagram = this.diagramObjects.get(object1);
    const object2Diagram = this.diagramObjects.get(object2);

    if(!object1Diagram || !object2Diagram) {
      return [];
    }

    const connections = this.jsPlumb
      .getConnections({
        source: [object1Diagram.el],
        target: [object2Diagram.el],
      });

    return this._mapConnections(connections);
  }
  
  public getObjectConnections(object: object): DiagramConnection[] {
    const objectDiagram = this.diagramObjects.get(object);

    if(!objectDiagram) {
      return [];
    }

    const connections1 = Object.values(
      this.jsPlumb.getConnections({
        source: objectDiagram.el,
        scope: '*',
      }),
    );

    const connections2 = Object.values(
      this.jsPlumb.getConnections({
        target: objectDiagram.el,
        scope: '*',
      }),
    );  

    const connections: any[] = [
      ...connections1,
      ...connections2,
    ];

    return this._mapConnections(connections);
  }
  
  public getScopeConnections(scope: string[]): DiagramConnection[] {
    return this._mapConnections(this.jsPlumb.getConnections({ scope }));
  }

  public getConnections(): DiagramConnection[] {
    return this._mapConnections(this.jsPlumb.getConnections({ scope: '*' }));
  }

  public repaint() {
    this.jsPlumb.repaintEverything();
  }

  public getDiagramObject(data: any): FsDiagramObjectDirective {
    return this.diagramObjects.get(data);
  }

  public findDiagramObject(
    find: (data: FsDiagramObjectDirective) => boolean,
  ): FsDiagramObjectDirective {
    return Array.from(this.diagramObjects.values())
      .find(find);
  }

  private _processObjectDirectives(initalizedDirectives$, connects) {
    return new Observable((observer) => {
      this.suspendRendering(() => {

        forkJoin(...initalizedDirectives$)
          .pipe(
            takeUntil(this._destroy$),
          )
          .subscribe(() => {
            connects.forEach((item) => {
              this._connect(item.source, item.target, item.config);
            });

            observer.next(null);
            observer.complete();
          });
      });
    });
  }

  private _connect(sourceDiagram: any, targetDiagram: any, config: ConnectionConfig = {}) {
    const connection = this.jsPlumb.connect({
      source: sourceDiagram.el,
      target: targetDiagram.el,
      data: {
        'connection-config': config,
      },
    });

    return connection;
  }

  private _initConfig() {
    

    this.config.paintStyle = { 
      stroke: '#2196f3',
      strokeWidth: 2, 
      ...this.config.paintStyle, 
    };

    this.config.hoverPaintStyle = {
      stroke: '#ccc',
      strokeWidth: 2, 
      ...this.config.hoverPaintStyle, 
    };

    this.config.Point = { 
      length: 10,
      direction: 0,
      location: 0,
      width: 10,
      foldback: 1, 
      ...this.config.Point };

    this.config.targetPoint = { 
      length: 10,
      direction: 1,
      location: 1,
      width: 10,
      foldback: 1,
      shape: PointShape.Arrow,
      ...this.config.targetPoint, 
    };

    this.config.connector = { 
      type: ConnectorType.Elbow,
      stub: [60, 60],
      gap: 1,
      cornerRadius: 5,
      alwaysRespectStubs: true, 
      ...this.config.connector, 
    };
  }

  private _mapConnections(
    connections: Record<string, Connection> | Connection[],
  ): DiagramConnection[] {
    return Object.values(connections)
      .map((connection) => {
        return new DiagramConnection(this, connection);
      });
  }
}
