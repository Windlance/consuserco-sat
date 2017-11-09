import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

import { ConnectivityServiceProvider } from './../../providers/connectivity-service/connectivity-service';
import { Geolocation } from '@ionic-native/geolocation';

import { Storage } from '@ionic/storage';

declare var google;

@IonicPage()
@Component({
  selector: 'page-mapa',
  templateUrl: 'mapa.html',
})
export class MapaPage {

  incidencias = []; 

  @ViewChild('map') mapElement: ElementRef;

  map: any;
  mapInitialised: boolean = false;
  apiKey: string = 'AIzaSyDD_5is8bfWjLDzgHxqGCiy-1vrJWyOleY';   
  iconBase = 'assets/imgs/map-markers/';

  infoWindow: any;

  constructor(public navCtrl: NavController, public connectivityService: ConnectivityServiceProvider, 
              private geolocation: Geolocation, public storage: Storage) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad mapaPage');
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter mapaPage');
    
    // load incidencias del storage
    this.loadIncidenciasFromStorage();
    
   }

  loadIncidenciasFromStorage() {
    this.incidencias = [];

    this.storage.ready().then(() => {
      this.storage.get('_abiertas').then((data) => {
        if (data != null) {
          let _abiertas = JSON.parse(data);
          console.log(_abiertas);
          _abiertas.urgentes.forEach(id => {
            //console.log('urgente: '+id);
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });

          _abiertas.altas.forEach(id => {
            //console.log('alta: '+id);
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });

          _abiertas.normales.forEach(id => {
            //console.log('normal: '+id);
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });

          _abiertas.bajas.forEach(id => {
            //console.log('baja: '+id);
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });
        }
      });
    }).then(() => {
      this.loadGoogleMaps();
    });
  }

  loadGoogleMaps(){
    this.addConnectivityListeners();

    if(typeof google == "undefined" || typeof google.maps == "undefined"){
      console.log("Google maps JavaScript needs to be loaded.");
      this.disableMap();

      if(this.connectivityService.isOnline()){
        console.log("online, loading map");

        //Load the SDK
        window['mapInit'] = () => {
          this.initMap();
          this.enableMap();
        }

        let script = document.createElement("script");
        script.id = "googleMaps";

        if(this.apiKey){
          script.src = 'http://maps.google.com/maps/api/js?key=' + this.apiKey + '&callback=mapInit';
        } else {
          script.src = 'http://maps.google.com/maps/api/js?callback=mapInit';      
        }
        document.body.appendChild(script); 
      }
    }
    else {
      if(this.connectivityService.isOnline()){
        console.log("showing map");
        this.initMap();
        this.enableMap();
      }
      else {
        console.log("disabling map");
        this.disableMap();
      }
    }

  }

  initMap() {
    this.mapInitialised = false;

    // Definimos un centro para el mapa, el zoom, y lo creamos
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: new google.maps.LatLng(40.409313, -3.7010192), 		// Madrid
      zoom: 17, 
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    });

    // Definimos limites del mapa
    let mapBounds = new google.maps.LatLngBounds();

    // Defino una ventana de info 
    this.infoWindow = new google.maps.InfoWindow();

    //console.log('incidencias en initMap');
    let incidencias = this.incidencias;
    //console.log(incidencias);
    // Posiciono las incidencias abiertas
    incidencias.forEach(incidencia => {
      let posicion = new google.maps.LatLng(incidencia.geo.latitud, incidencia.geo.longitud);
      let icon = this.iconBase+""+incidencia.prioridad.marker;
      let marker = new google.maps.Marker({
        map: this.map,
        position: posicion,
				icon: icon,
        id: incidencia.id,
        info: incidencia.establecimiento
			});

      this.addInfoWindow(marker);
      
			// Delimitamos los limites del mapa en funcion de los markers añadidos, para conseguir el zoom out automatico para que muestre TODOS los markers
			mapBounds.extend(posicion);
    });

    this.geolocation.getCurrentPosition().then((position) => {
      //console.log('Latitud: '+position.coords.latitude+' Longitud: '+position.coords.longitude);
      let posicion = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      let marker = new google.maps.Marker({
        map: this.map,
        position: posicion,
        info: 'Mi posición'
			});
      
			google.maps.event.addListener(marker, 'click', function() {
				//console.log('marker clicked', this.id);
				//console.log('self', self);
				console.log('marker', marker);
				//self.createSheet();
				//self.infoMarker();
			});
			
			// Delimitamos los limites del mapa en funcion de los markers añadidos, para conseguir el zoom out automatico para que muestre TODOS los markers
			mapBounds.extend(posicion);
    }, (error) => {
      console.log('Error getting location', error);
    }).then(() => {
      // Centramos el mapa para que entren todos los marcadores
      this.map.fitBounds(mapBounds);
    });
    
    //let casa = {latitude: 40.456938, longitude: -3.658878};
  }

  disableMap(){
    console.log("disable map");
  }

  enableMap(){
    console.log("enable map");
  }

  addConnectivityListeners(){
    let onOnline = () => {
      setTimeout(() => {
        if(typeof google == "undefined" || typeof google.maps == "undefined"){
          this.loadGoogleMaps();
        } else {
          if (!this.mapInitialised) {
            this.initMap();
          }
          this.enableMap();
        }
      }, 2000);
    };

    let onOffline = () => {
      this.disableMap();
    };

    document.addEventListener('online', onOnline, false);
    document.addEventListener('offline', onOffline, false);
  }

  addInfoWindow(marker){
    google.maps.event.addListener(marker, 'mouseover', () => {
      if (this.infoWindow) {
        this.infoWindow.close();
      }
      this.infoWindow.setContent('<span class="infoWindow">'+marker.info+'</span>');
      this.infoWindow.open(this.map, marker);
    });

    google.maps.event.addListener(marker, 'mouseout', () => {
      if (this.infoWindow) {
        this.infoWindow.close();
      }
    });
  }
}