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
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
} from '@angular/core';

import { Observable, Subject, forkJoin, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { DiagramConnection } from '../../classes/diagram-connection';
import { ConnectionActor, ConnectorType, PointShape } from '../../helpers/enums';
import { ConnectionConfig } from '../../interfaces/connection-config';
import { ConnectionCreated } from '../../interfaces/connection-created';
import { DiagramConfig } from '../../interfaces/diagram-config';
import { FsDiagramObjectDirective } from '../diagram-object/diagram-object.directive';

import { DiagramService } from './../../services/diagram.service';


@Directive({
  selector: '[fsDiagram]',
  providers: [DiagramService],
})
export class FsDiagramDirective implements AfterViewInit, OnInit, OnDestroy {

  @HostBinding('class.fs-diagram') public classFsDiagram = true;

  @Output() public initialized = new EventEmitter();

  @Input() public config: DiagramConfig = {};

  @Output() public connectionCreated = new EventEmitter<ConnectionCreated>();
  
  @ContentChildren(FsDiagramObjectDirective) 
  public fsDiagramObjects: QueryList<FsDiagramObjectDirective>;

  private _connects = [];
  private _differ: IterableDiffer<FsDiagramObjectDirective>;
  private _destroy$ = new Subject<void>();

  constructor(
    private _element: ElementRef,
    private _differs: IterableDiffers,
    private _ngZone: NgZone,
    private _diagramService: DiagramService,
  ) {
    this._differ = this._differs.find([]).create(null);
  }

  public ngOnInit() {
    this._initConfig();

    this._diagramService.diagramConfig = this.config;
    this.jsPlumb.bind('connection', (info: any, e: Event) => {

      if (e && e.defaultPrevented) {
        return;
      }

      if (info.connection.target && info.connection.source) {

        setTimeout(() => {

          const connection = new DiagramConnection(
            this._diagramService, 
            info.connection, 
            info.connection.config,
          );
          connection.render();

          const event: ConnectionCreated = {
            connection: connection,
            target: info.connection.target.fsDiagramObjectDirective,
            source: info.connection.source.fsDiagramObjectDirective,
            actor: e ? ConnectionActor.User : ConnectionActor.Api,
          };

          this._ngZone.run(() => {
            this.connectionCreated.emit(event);
          });
        });
      }
    });

    const config = {
      ConnectionsDetachable: false,
      Anchor: 'Continuous',
      EndpointStyle: {
        fill: 'transparent',
        stroke: 'transparent',
      },
      PaintStyle: {
        stroke: this.config.paintStyle.stroke,
        strokeWidth: this.config.paintStyle.strokeWidth,
        outlineStroke: 'transparent',
        outlineWidth: 5,
      },
      HoverPaintStyle: {
        stroke: this.config.hoverPaintStyle.stroke,
        strokeWidth: this.config.hoverPaintStyle.strokeWidth,
      },
      Connector: [
        this.config.connector.type,
        this.config.connector,
      ],
    };

    this.jsPlumb.importDefaults(config);
  }

  public get element(): ElementRef {
    return this._element;
  }

  public get jsPlumb() {
    return this._diagramService.jsPlumb;
  }

  public ngOnDestroy() {
    this.jsPlumb.reset();
    this._destroy$.next(null);
    this._destroy$.complete();
  }

  public ngAfterViewInit(): void {
    const diff = this._differ.diff(this.fsDiagramObjects);
    if (diff) {
      const initalizedDirectives$: Observable<any>[] = [];

      diff.forEachAddedItem((change) => {
        initalizedDirectives$.push(change.item.initalized$);
      });

      this._processObjectDirectives(initalizedDirectives$, this._connects.splice(0))
        .subscribe(() => {
          this.initialized.emit();
        });
    }

    this.fsDiagramObjects.changes
      .pipe(
        switchMap((fsDiagramObjects) => {

          const changeDiff = this._differ.diff(fsDiagramObjects);

          if (changeDiff) {
            const initalizedDirectives$: Observable<any>[] = [];
            changeDiff.forEachAddedItem((change) => {
              initalizedDirectives$.push(change.item.initalized$);
            });
  
            return this._processObjectDirectives(initalizedDirectives$, this._connects.splice(0));
          }

          return of(null);
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
    const sourceDiagram: FsDiagramObjectDirective = this._diagramService.diagramObjects.get(source);
    const targetDiagram: FsDiagramObjectDirective = this._diagramService.diagramObjects.get(target);

    if (!sourceDiagram || !sourceDiagram.initalized ||
        !targetDiagram || !targetDiagram.initalized) {
      this._connects.push({ source: source, target: target, config: config });

      return;
    }

    const connection = this.jsPlumb.connect({
      source: sourceDiagram.element.nativeElement,
      target: targetDiagram.element.nativeElement,
    });

    connection.config = config;
  }

  public getConnection(source?: object, target?: object, name?: string): DiagramConnection {
    return this._diagramService.getConnection(source, target, name);
  }

  public getConnections(source?: object, target?: object, name?: string): DiagramConnection[] {
    return this._diagramService.getConnections(source, target, name);
  }

  public repaint() {
    this.jsPlumb.repaintEverything();
  }

  public getDiagramObject(data: any): FsDiagramObjectDirective {
    return this._diagramService.diagramObjects.get(data);
  }

  public findDiagramObject(
    find: (data: FsDiagramObjectDirective) => boolean,
  ): FsDiagramObjectDirective {
    return Array.from(this._diagramService.diagramObjects.values())
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

  private _connect(source: any, target: any, config: ConnectionConfig = {}) {
    const sourceDiagram: FsDiagramObjectDirective = this._diagramService.diagramObjects.get(source);
    const targetDiagram: FsDiagramObjectDirective = this._diagramService.diagramObjects.get(target);

    const connection = this.jsPlumb.connect({
      source: sourceDiagram.element.nativeElement,
      target: targetDiagram.element.nativeElement,
    });

    connection.config = config;
  }

  private _initConfig() {

    this.config.paintStyle = { stroke: '#2196f3',
      strokeWidth: 2, ...this.config.paintStyle };

    this.config.hoverPaintStyle = { stroke: '#ccc',
      strokeWidth: 2, ...this.config.hoverPaintStyle };

    this.config.Point = { length: 10,
      direction: 0,
      location: 0,
      width: 10,
      foldback: 1, ...this.config.Point };

    this.config.targetPoint = { length: 10,
      direction: 1,
      location: 1,
      width: 10,
      foldback: 1,
      shape: PointShape.Arrow, ...this.config.targetPoint };

    this.config.connector = { type: ConnectorType.Elbow,
      stub: [60, 60],
      gap: 1,
      cornerRadius: 5,
      alwaysRespectStubs: true, ...this.config.connector };
  }
}
