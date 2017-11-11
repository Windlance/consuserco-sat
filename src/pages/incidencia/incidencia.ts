
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

  id: any;
  incidencia = {'id':'', 
    'numeracion':'', 'establecimiento':'', 'maquina':{'modelo':'','fabricante':''}, 'direccion':'', 'poblacion':'', 'provincia':'', 'cp':'', 
    'horario':'', 'telefono':'', 'geo':{'longitud':'', 'latitud':''}, 'tipos':[], 'descripcion':'', 'prioridad':{'desc':'','val':'','marker':''}, 'estado':''
  };
  
  @ViewChild('map') mapElement: ElementRef;
  map: any;

  marker = new google.maps.Marker;
  iconBase = 'assets/imgs/map-markers/';
  geocoder = new google.maps.Geocoder;

  estaCerrada: boolean = false;

  numeracion: any;
  establecimiento: any;
  direccion: any;
  cp: any;
  poblacion: any;
  provincia: any;
  horario: any;
  telefono: any;
  tipos: any;
  descripcion: any;
  icon: any;
  position: any;
  
  full_direccion: string;

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
      zoom: 14, 
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

    //console.log ("Loading incidencia... "+this.id);

    let storage = this.storage;

    this.storage.ready().then(() => {
      this.storage.get('incidencia-'+this.id).then((data) => {
        if (data != null) {
          let incidencia = JSON.parse(data);
          this.incidencia = incidencia;

          this.id = this.incidencia.id;
          this.numeracion = this.incidencia.numeracion;
          this.establecimiento = this.incidencia.establecimiento;
          this.direccion = this.incidencia.direccion;
          this.cp = this.incidencia.cp;
          this.poblacion = this.incidencia.poblacion;
          this.provincia = this.incidencia.provincia;
          this.horario = this.incidencia.horario;
          this.telefono = this.incidencia.telefono;
          this.tipos = this.incidencia.tipos;
          this.descripcion = this.incidencia.descripcion;

          this.estaCerrada = (this.incidencia.estado == '4');

          let id = this.id;
          let icono = this.incidencia.prioridad.marker;
          let map = this.map;
          let iconBase = this.iconBase;

          this.full_direccion = this.direccion+', '+this.cp+' '+this.poblacion+', '+this.provincia;

          if (incidencia.geo.latitud == null) {       // Needs geocoding...
            //console.log ('geocoding...');
            let direccion = this.full_direccion;
            this.geocoder.geocode({'address': direccion}, function(results, status) {
              if (status === 'OK') {
                let marker = new google.maps.Marker({
                  map: map,
                  position: results[0].geometry.location,
                  icon: iconBase + "" +  icono,
                  id: id
                });
                this.marker = marker;

                // Center map in marker
                map.panTo(results[0].geometry.location); 

                // Update local registry with geocode info
                incidencia.geo.latitud = results[0].geometry.location.lat();
                incidencia.geo.longitud = results[0].geometry.location.lng();
                storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia));

              } else {
                this.showToast("Imposible localizar la incidencia en el mapa","warning");
                console.log('Geocode error: ' + status);
              }
            });
          }
          else {    // Geocoding done previously...
            let position = new google.maps.LatLng({lat: incidencia.geo.latitud, lng: incidencia.geo.longitud}); 
            let marker = new google.maps.Marker({
              map: map,
              position: position,
              icon: iconBase + "" +  icono,
              id: id
            });
            this.marker = marker;

            // Center map in marker
            map.panTo(position); 
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

  showToast(mensaje, tipo){
    let toast = this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      cssClass: tipo
    });
    toast.present();
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
}
