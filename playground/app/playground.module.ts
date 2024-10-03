import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

import { FsDiagramModule } from '@firestitch/diagram';
import { FsExampleModule } from '@firestitch/example';
import { FsMenuModule } from '@firestitch/menu';
import { FsMessageModule } from '@firestitch/message';
import { FsZoomPanModule } from '@firestitch/zoom-pan';

import { AppComponent } from './app.component';
import { ExampleComponent, ExamplesComponent } from './components';
import { AppMaterialModule } from './material.module';

const routes: Routes = [
  { path: '', component: ExamplesComponent },
];

@NgModule({
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        FsDiagramModule,
        BrowserAnimationsModule,
        AppMaterialModule,
        FormsModule,
        FsZoomPanModule,
        FsExampleModule.forRoot(),
        FsMessageModule.forRoot(),
        FsMenuModule.forRoot(),
        RouterModule.forRoot(routes, {}),
    ],
    declarations: [
        AppComponent,
        ExamplesComponent,
        ExampleComponent,
    ],
    providers: []
})
export class PlaygroundModule {
}
