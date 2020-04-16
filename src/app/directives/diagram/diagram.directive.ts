import { ConnectionActor, PointShape } from '../../helpers/enums';
import { ConnectionCreated } from '../../interfaces/connection-created';
import { DiagramConnection } from '../../classes/diagram-connection';
import {
  AfterViewInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  IterableDiffers,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  Input,
  HostBinding
} from '@angular/core';

import { Subject, zip, Observable, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FsDiagramObjectDirective } from '../diagram-object/diagram-object.directive';
import { ConnectionConfig } from '../../interfaces';
import { ConnectorType } from '../../helpers';
import { DiagramConfig } from '../../interfaces/diagram-config';
import { jsPlumb } from 'jsplumb';


@Directive({
  selector: '[fsDiagram]'
})
export class FsDiagramDirective implements AfterViewInit, OnInit, OnDestroy {

  @HostBinding('class.fs-diagram') classFsDiagram = true;

  @Output() initialized = new EventEmitter();

  @Input() config: DiagramConfig = {};

  @Output() connectionCreated = new EventEmitter<ConnectionCreated>();
  @ContentChildren(FsDiagramObjectDirective) fsDiagramObjects: QueryList<FsDiagramObjectDirective>;

  private _connects = [];
  private _differ;
  private _jsPlumb = null;
  private _diagramObjects = new Map<any, FsDiagramObjectDirective>();
  private _destroy$ = new Subject<void>();

  constructor(private _element: ElementRef, private differs: IterableDiffers) {
    this._differ = this.differs.find([]).create(null);
  }

  public ngOnInit() {

    this._initConfig();

    this._jsPlumb = jsPlumb.getInstance();
    this._jsPlumb.bind('connection', (info: any, e: Event) => {

      if (e && e.defaultPrevented) {
        return;
      }

      if (info.connection.target && info.connection.source) {
        setTimeout(() => {

          const connection = new DiagramConnection(this, info.connection, info.connection.config);
          connection.render();

          const event: ConnectionCreated = {
            connection: connection,
            target: info.connection.target.fsDiagramObjectDirective,
            source: info.connection.source.fsDiagramObjectDirective,
            actor: e ? ConnectionActor.User : ConnectionActor.Api
          }

          this.connectionCreated.emit(event);
        });
      }
    });

    const config = {
      ConnectionsDetachable: false,
      Anchor: 'Continuous',
      EndpointStyle: {
        fill: 'transparent',
        stroke: 'transparent'
      },
      PaintStyle: {
        stroke: this.config.paintStyle.stroke,
        strokeWidth: this.config.paintStyle.strokeWidth,
        outlineStroke: 'transparent',
        outlineWidth: 5
      },
      HoverPaintStyle: {
        stroke: this.config.hoverPaintStyle.stroke,
        strokeWidth: this.config.hoverPaintStyle.strokeWidth
      },
      Connector: [
        this.config.connector.type,
        this.config.connector
      ]
    };

    this._jsPlumb.importDefaults(config);
  }

  get element(): ElementRef {
    return this._element;
  }

  get jsPlumb() {
    return this._jsPlumb;
  }

  public ngOnDestroy() {
    this._jsPlumb.reset();
    this._destroy$.next();
    this._destroy$.complete();
  }

  public ngAfterViewInit() {

    const changeDiff = this._differ.diff(this.fsDiagramObjects);
    if (changeDiff) {

      const initalizedDirectives$: Observable<any>[] = [];

      changeDiff.forEachAddedItem(change => {
        this._addDiagramObject(change.item);
        initalizedDirectives$.push(change.item.initalized$);
      });

      this._processObjectDirectives(initalizedDirectives$, this._connects.slice());
    }

    this.fsDiagramObjects.changes
      .pipe(
        takeUntil(this._destroy$),
      )
      .subscribe(fsDiagramObjects => {

        const changeDiff = this._differ.diff(fsDiagramObjects);

        if (changeDiff) {
          const initalizedDirectives$: Observable<any>[] = [];
          changeDiff.forEachAddedItem((change) => {
            this._addDiagramObject(change.item);
            initalizedDirectives$.push(change.item.initalized$);
          });
          this._processObjectDirectives(initalizedDirectives$, this._connects.slice());

          changeDiff.forEachRemovedItem((change) => {
            this._removeDiagramObject(change.item);
          });
        }
      });
  }

  private _processObjectDirectives(initalizedDirectives$, connects) {

    this.suspendRendering(() => {

      forkJoin(...initalizedDirectives$)
        .pipe(
          takeUntil(this._destroy$)
        )
        .subscribe(() => {
          connects.forEach(item => {
            this._connect(item.source, item.target, item.config);
          });
          this.initialized.emit();
        });
    });
  }

  public suspendRendering(func) {
    this._jsPlumb.setSuspendDrawing(true);
    func();
    this._jsPlumb.setSuspendDrawing(false, true);
  }

  public connect(source: any, target: any, config: ConnectionConfig = {}) {

    const sourceDiagram: FsDiagramObjectDirective = this._diagramObjects.get(source);
    const targetDiagram: FsDiagramObjectDirective = this._diagramObjects.get(target);

    if (!sourceDiagram || !sourceDiagram.initalized$.getValue() ||
        !targetDiagram || !targetDiagram.initalized$.getValue()) {
      this._connects.push({ source: source, target: target, config: config });
      return;
    }

    const connection = this._jsPlumb.connect({
      source: sourceDiagram.element.nativeElement,
      target: targetDiagram.element.nativeElement
    });

    connection.config = config;
  }

  private _connect(source: any, target: any, config: ConnectionConfig = {}) {

    const sourceDiagram: FsDiagramObjectDirective = this._diagramObjects.get(source);
    const targetDiagram: FsDiagramObjectDirective = this._diagramObjects.get(target);

    const connection = this._jsPlumb.connect({
      source: sourceDiagram.element.nativeElement,
      target: targetDiagram.element.nativeElement
    });

    connection.config = config;
  }

  public getConnection(source?: object, target?: object, name?: string): DiagramConnection {
    return this.getConnections(source, target, name)[0];
  }

  public getConnections(source?: object, target?: object, name?: string): DiagramConnection[] {

    let connections = []
    if (target || source) {

      name = name || '*';

      const sourceDiagram = source ? this._diagramObjects.get(source) : null;
      const targetDiagram = target ? this._diagramObjects.get(target) : null;

      if (targetDiagram && sourceDiagram) {
        connections = this._jsPlumb.getConnections({
          source: sourceDiagram.element.nativeElement,
          target: targetDiagram.element.nativeElement,
          scope: name
        });

        } else if (sourceDiagram) {
          connections = this._jsPlumb.getConnections({
            source: sourceDiagram.element.nativeElement,
            scope: name
          });

        } else if (targetDiagram) {
          connections = this._jsPlumb.getConnections({
            target: targetDiagram.element.nativeElement,
            scope: name
          });
        }

    } else if (name) {
      connections = this._jsPlumb.getConnections({
        scope: name
      });
    } else {
      connections = this._jsPlumb.getAllConnections();
    }

    return connections.map(connection => {
      const config = (connection.getData() || {})['connection-config'];
      return new DiagramConnection(this, connection, config);
    });
  }

  public repaint() {
    this.jsPlumb.repaintEverything();
  }

  public getDiagramObjectDirective(data: any): FsDiagramObjectDirective {
    return this._diagramObjects.get(data);
  }

  private _addDiagramObject(directive: FsDiagramObjectDirective) {
    directive.init(this._jsPlumb, this);
    this._diagramObjects.set(directive.data, directive);
  }

  private _removeDiagramObject(diagramObject: FsDiagramObjectDirective) {

    this._jsPlumb.getConnections({
      source: diagramObject.element.nativeElement
    }).concat(this._jsPlumb.getConnections({
      target: diagramObject.element.nativeElement
    }))
      .forEach(connection => {
        this._jsPlumb.deleteConnection(connection);
      });

    this._diagramObjects.delete(diagramObject.data);
  }

  private _initConfig() {

    this.config.paintStyle = Object.assign({
      stroke: '#2196f3',
      strokeWidth: 2
    }, this.config.paintStyle);

    this.config.hoverPaintStyle = Object.assign({
      stroke: '#ccc',
      strokeWidth: 2
    }, this.config.hoverPaintStyle);

    this.config.Point = Object.assign({
      length: 10,
      direction: 0,
      location: 0,
      width: 10,
      foldback: 1,
    }, this.config.Point);

    this.config.targetPoint = Object.assign({
      length: 10,
      direction: 1,
      location: 1,
      width: 10,
      foldback: 1,
      shape: PointShape.Arrow
    }, this.config.targetPoint);

    this.config.connector = Object.assign({
      type: ConnectorType.Elbow,
      stub: [60, 60],
      gap: 1,
      cornerRadius: 5,
      alwaysRespectStubs: true
    }, this.config.connector);
  }
}
