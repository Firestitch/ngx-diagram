import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';


import { BehaviorSubject, Observable } from 'rxjs';

import { uniq } from 'lodash-es';

import { DiagramConnection } from '../../classes/diagram-connection';

import { DiagramService } from './../../services/diagram.service';

@Directive({
  selector: '[fsDiagramObject]',
})
export class FsDiagramObjectDirective implements OnDestroy, OnInit, AfterViewInit {

  @Input() public data;
  @Input() public scale = 1;
  @Input() public maxTargetConnections = 0;
  @Input() public maxSourceConnections = 0;
  @Input() public selfTargetable = true;
  @Input() public targetable = true;

  @Input()
  @HostBinding('style.top.px') public y1: number;

  @Input()
  @HostBinding('style.left.px') public x1: number;

  @Input()
  @HostBinding('class.draggable') public draggable = true;

  @Output() public dragStop = new EventEmitter<any>();
  @Output() public dragStart = new EventEmitter<any>();

  @HostBinding('class.fs-diagram-object') 
  public classDiagramObject = true;

  private _mouseDownEvent;
  private _mouseUpEvent;
  private _initalized$ = new BehaviorSubject<boolean>(false);

  constructor(
    private _element: ElementRef,
    private _ngZone: NgZone,
    private _diagramService: DiagramService,
  ) {}

  @HostListener('click', ['$event'])
  public onClick(e) {
    const xDelta = Math.abs(this._mouseDownEvent.screenX - this._mouseUpEvent.screenX);
    const yDelta = Math.abs(this._mouseDownEvent.screenY - this._mouseUpEvent.screenY);

    if (xDelta > 1 || yDelta > 1) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(e) {
    this._mouseDownEvent = e;
  }

  @HostListener('mouseup', ['$event'])
  public onMouseUp(e) {
    this._mouseUpEvent = e;
  }

  public get initalized$(): Observable<boolean> {
    return this._initalized$.asObservable();
  }

  public get initalized(): boolean {
    return this._initalized$.getValue();
  }

  public get element(): ElementRef {
    return this._element;
  }

  public ngOnInit() {
    this._diagramService.diagramObjects.set(this.data, this);
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this._init();
    });
  }
  
  public repaint() {
    this._diagramService.jsPlumb.revalidate(this.element.nativeElement);
  }

  public ngOnDestroy() {
    uniq(
      this._diagramService.getConnections(null, this.data)
        .concat(this._diagramService.getConnections(this.data)),
    )
      .forEach((conn: DiagramConnection) => {
        conn.disconnect();
      });

    this._diagramService.diagramObjects.delete(this.data);
    this._diagramService.jsPlumb.unmakeTarget(this.element.nativeElement);
  }

  private _init() {

    this.element.nativeElement.fsDiagramObjectDirective = this;

    if (this.draggable) {

      this._ngZone.runOutsideAngular(() => {

        this._diagramService.jsPlumb.draggable([this.element.nativeElement],
          {
            start: (e) => {
              this.dragStart.emit(e);
              this._diagramService.jsPlumb.setZoom(this.scale);
              this._diagramService.dragging = true;
            },
            stop: (e) => {
              const x1 = e.pos[0];
              const y1 = e.pos[1];
              this.dragStop.emit({ event: e, data: this.data, x1: x1, y1: y1 });
              this._diagramService.dragging = false;
            },
          });
      });

      // Hack: Override movelistener to wrap run outside Angular
      const moveListener = this.element.nativeElement._katavorioDrag.moveListener;
      this.element.nativeElement._katavorioDrag.moveListener = (e) => {
        this._ngZone.runOutsideAngular(() => {
          moveListener(e);
        });
      };

      const downListener = this.element.nativeElement._katavorioDrag.downListener;
      this.element.nativeElement._katavorioDrag.downListener = (e) => {
        this._ngZone.runOutsideAngular(() => {
          downListener(e);
        });
      };
    }

    if (this.element.nativeElement.querySelector('[fsDiagramSource]')) {
      this._diagramService.jsPlumb.makeSource(this.element.nativeElement, {
        filter: '.fs-diagram-source',
      });
    }

    if (this.targetable || this.selfTargetable) {
      this._diagramService.jsPlumb.makeTarget(this.element.nativeElement, {
        allowLoopback: this.selfTargetable,
      });

      this._diagramService.jsPlumb.bind('connection', (info: any, e: Event) => {

        if (e) {

          if (info.target === this.element.nativeElement) {

            if (this.maxTargetConnections) {
              const connections = this._diagramService.jsPlumb.getConnections({
                target: info.target,
              });

              if (this.maxTargetConnections < connections.length) {
                setTimeout(() => {
                  this._diagramService.jsPlumb.deleteConnection(info.connection);
                });
                e.preventDefault();
              }
            }

            if (this.maxSourceConnections) {
              const connections = this._diagramService.jsPlumb.getConnections({
                source: info.source,
              });

              if (this.maxSourceConnections < connections.length) {
                setTimeout(() => {
                  this._diagramService.jsPlumb.deleteConnection(info.connection);
                });
                e.preventDefault();
              }
            }
          }
        }
      }, true);
    }

    this._initalized$.next(true);
    this._initalized$.complete();
  }
}
