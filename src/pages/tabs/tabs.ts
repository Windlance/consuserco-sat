import { Component } from '@angular/core';

import { IncidenciasPage } from './../incidencias/incidencias';
import { MapaPage } from './../mapa/mapa';
import { RutasPage } from './../rutas/rutas';
import { ConfiguracionPage } from './../configuracion/configuracion';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = IncidenciasPage;
  tab2Root = MapaPage;
  tab3Root = RutasPage;
  tab4Root = ConfiguracionPage;

  constructor() {

  }
}
