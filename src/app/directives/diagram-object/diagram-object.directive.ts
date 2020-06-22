import {
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  OnDestroy,
  NgZone,
  AfterViewInit,
  HostListener,
  OnInit
} from '@angular/core';
import { uniq } from 'lodash-es';
import { DiagramConnection } from '../../classes/diagram-connection';
import { DiagramService } from './../../services/diagram.service';
import { BehaviorSubject } from 'rxjs';

@Directive({
  selector: '[fsDiagramObject]'
})
export class FsDiagramObjectDirective implements OnDestroy, OnInit, AfterViewInit {

  @HostBinding('class.fs-diagram-object') classDiagramObject = true;

  @HostListener('click', ['$event'])
  onClick(e) {
    const xDelta = Math.abs(this._mouseDownEvent.screenX - this._mouseUpEvent.screenX);
    const yDelta = Math.abs(this._mouseDownEvent.screenY - this._mouseUpEvent.screenY);

    if (xDelta > 1 || yDelta > 1) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e) {
    this._mouseDownEvent = e;
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(e) {
    this._mouseUpEvent = e;
  }


  @Input() data;
  @Input() scale = 1;
  @Input() maxTargetConnections = 0;
  @Input() maxSourceConnections = 0;
  @Input() selfTargetable = true;
  @Input() targetable = true;

  @Input()
  @HostBinding('style.top.px') y1: number;

  @Input()
  @HostBinding('style.left.px') x1: number;

  @Input()
  @HostBinding('class.draggable') draggable = true;

  @Output() dragStop = new EventEmitter<any>();
  @Output() dragStart = new EventEmitter<any>();

  public initalized$ = new BehaviorSubject(false);

  private _mouseDownEvent;
  private _mouseUpEvent;

  constructor(private _element: ElementRef,
              private _ngZone: NgZone,
              private _diagramService: DiagramService) {}

  get element(): ElementRef {
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
            stop: e => {
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
      }

      const downListener = this.element.nativeElement._katavorioDrag.downListener;
      this.element.nativeElement._katavorioDrag.downListener = (e) => {
        this._ngZone.runOutsideAngular(() => {
          downListener(e);
        });
      }
    }

    if (this.element.nativeElement.querySelector('[fsDiagramSource]')) {
      this._diagramService.jsPlumb.makeSource(this.element.nativeElement, {
        filter: '.fs-diagram-source'
      });
    }

    if (this.targetable || this.selfTargetable) {
      this._diagramService.jsPlumb.makeTarget(this.element.nativeElement, {
        allowLoopback: this.selfTargetable
      });

      this._diagramService.jsPlumb.bind('connection', (info: any, e: Event) => {

        if (e) {

          if (info.target === this.element.nativeElement) {

            if (this.maxTargetConnections) {
              const connections = this._diagramService.jsPlumb.getConnections({
                target: info.target
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
                source: info.source
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

    this.initalized$.next(true);
    this.initalized$.complete();
  }

  public repaint() {
    this._diagramService.jsPlumb.revalidate(this.element.nativeElement);
  }

  public ngOnDestroy() {

    uniq(
        this._diagramService.getConnections(null, this.data)
        .concat(this._diagramService.getConnections(this.data))
    )
    .forEach((conn: DiagramConnection) => {
      conn.disconnect();
    });

    this._diagramService.diagramObjects.delete(this.data);
    this._diagramService.jsPlumb.unmakeTarget(this.element.nativeElement);
  }
}
