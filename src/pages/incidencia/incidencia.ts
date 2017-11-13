
import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';

import { IncidenciaCerrarPage } from './../incidencia-cerrar/incidencia-cerrar';

declare var google;

@IonicPage()
@Component({
  selector: 'page-incidencia',
  templateUrl: 'incidencia.html',
})
export class IncidenciaPage {

  @ViewChild('map') mapElement: ElementRef;
  map: any;
  marker = new google.maps.Marker;
  iconBase = 'assets/imgs/map-markers/';
  geocoder = new google.maps.Geocoder;

  id: any;
  incidencia = {'id':'', 
    'numeracion':'', 'establecimiento':'', 'maquina':{'modelo':'','fabricante':''}, 'direccion':'', 'poblacion':'', 'provincia':'', 'cp':'', 
    'horario':'', 'telefono':'', 'geo':{'longitud':'', 'latitud':''}, 'tipos':[], 'descripcion':'', 'prioridad':{'desc':'','val':'','marker':''}, 'estado':''
  };
  full_direccion: string;
  estaCerrada: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public toastCtrl: ToastController, 
              public storage: Storage, public launchNavigator: LaunchNavigator ) {
    this.id = navParams.get('id');
  }
 
  ionViewDidLoad() {
    //console.log('ionViewDidLoad IncidenciaPage');
  }

  ionViewDidEnter() {
    //console.log('ionViewDidEnter IncidenciaPage');
    this.initMap();

    this.loadIncidencia();    // load incidencia in map
  }

  initMap() {
    // Initialize the map
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 15, 
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    });
  }

  loadIncidencia() {
    // Reset incidencia Object
    this.incidencia = {'id':'', 
      'numeracion':'', 'establecimiento':'', 'maquina':{'modelo':'','fabricante':''}, 'direccion':'', 'poblacion':'', 'provincia':'', 'cp':'', 
      'horario':'', 'telefono':'', 'geo':{'longitud':'', 'latitud':''}, 'tipos':[], 'descripcion':'', 'prioridad':{'desc':'','val':'','marker':''}, 'estado': ''
    };

    let scope = this;
    this.storage.ready().then(() => {
      this.storage.get('incidencia-'+this.id).then((data) => {
        if (data != null) {
          scope.incidencia = JSON.parse(data);
          scope.estaCerrada = (scope.incidencia.estado == '4');
          scope.full_direccion = scope.incidencia.direccion+', '+scope.incidencia.cp+' '+scope.incidencia.poblacion+', '+scope.incidencia.provincia;

          if (scope.incidencia.geo.latitud == null) {       // Needs geocoding...
            //console.log ('geocoding...');
            this.geocoder.geocode({'address': scope.full_direccion}, function(results, status) {
              if (status === google.maps.GeocoderStatus.OK) {
                let marker = new google.maps.Marker({
                  map: scope.map,
                  position: results[0].geometry.location,
                  icon: scope.iconBase + scope.incidencia.prioridad.marker,
                  id: scope.id
                });
                scope.marker = marker;

                // Center map in marker
                scope.map.panTo(results[0].geometry.location); 

                // Update local registry with geocode info
                scope.incidencia.geo.latitud = results[0].geometry.location.lat();
                scope.incidencia.geo.longitud = results[0].geometry.location.lng();
                scope.storage.set('incidencia-'+scope.incidencia.id, JSON.stringify(scope.incidencia));

              } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
                console.log('Geocode error: ' + status);
                scope.showToast("Dirección no encontrada","warning");
              } else {
                console.log('Geocode error: ' + status);
              }

            });
          }
          else {    // Geocoding done previously...
            let position = new google.maps.LatLng({lat: scope.incidencia.geo.latitud, lng: scope.incidencia.geo.longitud}); 
            let marker = new google.maps.Marker({
              map: scope.map,
              position: position,
              icon: scope.iconBase + scope.incidencia.prioridad.marker,
              info: scope.incidencia.establecimiento,
              id: scope.id
            });
            this.marker = marker;

            // Center map in marker
            scope.map.panTo(position); 
          }
        }
      });
    });
  }
  
  cerrarIncidencia(){
    if (!this.estaCerrada) {
      this.navCtrl.push(IncidenciaCerrarPage, {id: this.id});
    }
  }

  llamarTelefono(n:string){
    setTimeout(() => {
      let tel = n;
      window.open(`tel:${tel}`, '_system');
    }, 50);
  }

  comoLlegar(){
    let app;
    if (this.launchNavigator.isAppAvailable(this.launchNavigator.APP.GOOGLE_MAPS)) {
      app = this.launchNavigator.APP.GOOGLE_MAPS;
    } else {
      app = this.launchNavigator.APP.USER_SELECT;
    }

    let options: LaunchNavigatorOptions = {
      app: app
    };
    this.launchNavigator.navigate(this.full_direccion, options);
  };

  showToast(mensaje, tipo){
    let toast = this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      cssClass: tipo
    });
    toast.present();
  }
}
