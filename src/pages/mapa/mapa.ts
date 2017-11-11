//import { Geocoder } from '@ionic-native/google-maps';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';

//import { ConnectivityServiceProvider } from './../../providers/connectivity-service/connectivity-service';

import { IncidenciaPage } from './../incidencia/incidencia';

declare var google;

@IonicPage()
@Component({
  selector: 'page-mapa',
  templateUrl: 'mapa.html',
})
export class MapaPage {

  @ViewChild('map') mapElement: ElementRef;
  map: any;
  mapInitialised: boolean = false;

  markers = [ new google.maps.Marker ];
  iconBase = 'assets/imgs/map-markers/';
  markerListeners = [];
  geocoder = new google.maps.Geocoder;
  posicionActual = new google.maps.Marker;

  incidencias = []; 

  constructor(public navCtrl: NavController, private geolocation: Geolocation, 
              //public connectivityService: ConnectivityServiceProvider,
              public storage: Storage) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MapaPage');
    this.initMap();
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter mapaPage');
    this.deleteMarkers();                 // Borramos los markers que existiesen previamente

    this.loadIncidenciasFromStorage();    // load incidencias del storage
    setTimeout(function() {
      console.log ('hola');
      console.log(this.incidencias.length);
      this.incidencias.forEach(incidencia => {
        console.log(incidencia.id+":"+incidencia.geo.latitud);
        if (incidencia.geo.latitud == null) {       // sin geocodificacion previa
          let direccion = incidencia.direccion+", "+incidencia.cp+" "+incidencia.poblacion+", "+incidencia.provincia;
          this.geocoder.geocode({'address': direccion}, function(results, status) {
            if (status === 'OK') {
              this.addMarker(results[0].geometry.location, incidencia.prioridad.marker, incidencia.id);  
              incidencia.geo.latitud = results[0].geometry.location.lat;
              incidencia.geo.logitud = results[0].geometry.location.lng;
              this.storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia));
            } else {
              console.log('Geocode error: ' + status);
            }
          });
        }
      });
      this.showMarkers();

      this.clearPosicionActual();
      this.showPosicionActual();
    }, 4000);
    
  }

  initMap() {
    this.mapInitialised = true;
    
    // Definimos un centro para el mapa, el zoom, y lo creamos
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: new google.maps.LatLng(40.409313, -3.7010192), 		// Madrid
      zoom: 12, 
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    });
  }

  loadIncidenciasFromStorage() {
    this.incidencias = [];

    this.storage.ready().then(() => {
      this.storage.get('_abiertas').then((data) => {
        if (data != null) {
          let _abiertas = JSON.parse(data);
          _abiertas.urgentes.forEach(id => {
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });

          _abiertas.altas.forEach(id => {
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });

          _abiertas.normales.forEach(id => {
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });

          _abiertas.bajas.forEach(id => {
            this.storage.get('incidencia-'+id).then((incidencia) => {
              if (incidencia != null) {
                this.incidencias.push(JSON.parse(incidencia));
              }
            });
          });
        }
      });
    });
  }

  addMarkerListener(marker) {
    let listener = google.maps.event.addListener(marker, 'click', () => {
      this.abrirIncidencia(marker.id);      
    });
    this.markerListeners.push(listener);
  }
  removeMarkersListeners() {
    this.markerListeners.forEach(element => {
      this.removeMarkerListener(element);
    });
  }
  removeMarkerListener(listenerHandle) {
    listenerHandle.removeListener()
  }

  // Adds a marker to the map and push to the array.
  addMarker(posicion, icon, id) {
    let marker = new google.maps.Marker({
      map: this.map,
      position: posicion,
      icon: icon,
      id: id
    });
    this.markers.push(marker);
  }

  // Sets the map on all markers in the array.
  setMapOnAll(map) {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  clearMarkers() {
    this.setMapOnAll(null);
  }

  // Shows any markers currently in the array.
  showMarkers() {
    this.setMapOnAll(this.map);
  }

  // Deletes all markers in the array by removing references to them.
  deleteMarkers() {
    this.clearMarkers();
    this.markers = [];
  }
  
  clearPosicionActual() {
    this.posicionActual.setMap(null);
    this.posicionActual = null;
  }
  showPosicionActual() {
    this.geolocation.getCurrentPosition().then((position) => {
      let posicion = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      this.posicionActual = new google.maps.Marker({
        map: this.map,
        position: posicion,
        info: 'Mi posición'
      });
    });
  }

  abrirIncidencia(id) {
    this.navCtrl.push(IncidenciaPage, {id: id});        // jump to incidenciaPage
  }

  /*
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
  */


  /*
  initMap2() {
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
  */
}