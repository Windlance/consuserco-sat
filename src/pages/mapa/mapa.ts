import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, ToastController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';

import { IncidenciaPage } from './../incidencia/incidencia';

declare var google;

@IonicPage()
@Component({
  selector: 'page-mapa',
  templateUrl: 'mapa.html',
})
export class MapaPage {

  debug: boolean = false;       // Debug flag

  @ViewChild('map') mapElement: ElementRef;
  map: any;

  firstLoad: boolean = true;

  iconBase = 'assets/imgs/map-markers/';

  geocoder        = new google.maps.Geocoder;
  posicionActual  = new google.maps.Marker;
  infoWindow      = new google.maps.InfoWindow;
  mapBounds       = new google.maps.LatLngBounds;

  incidencias = []; 
  idsAbiertasGrouped            = {"urgentes":[], "altas":[], "normales":[], "bajas":[]};    // ids groups by priority
  idsAbiertasAll: Array<number> = [];           // ids (all)  ["1", "23", "44" ...]
  markers = [];               // Array de objetos tipo:  { marker (google.maps.Marker), listenerClick (google.maps.event listener) }

  withChanges: boolean = false;   // determines if map has changed (markers) and if so, center again

  constructor(public navCtrl: NavController, public toastCtrl: ToastController, private geolocation: Geolocation, 
              public storage: Storage, public launchNavigator: LaunchNavigator) {

    this.consola('MAPA CONSTRUCTOR');
  }

  ionViewDidLoad() {
    this.consola('MAPA LOAD');
    this.initMap();             // Initialize map
  }

  ionViewDidEnter() {
    let scope = this;
    scope.consola('MAPA ENTER: firstLoad = '+this.firstLoad);

    // If infoWindow exist (opened), close it
    if (scope.infoWindow) {
      scope.infoWindow.close();
    }

    if (scope.firstLoad) {
      scope.loadLocales().then(() => {
        Promise.all([scope.addMarcadores(), scope.setPosicionActual()]).then(() => {
          //this.showToast('Mostrando '+this.incidencias.length+' incidencias','info');
          scope.centrarMapa();
        });
      });   // Load from Storage
    }
    else {
      scope.updateLocales().then(() => {
        if (scope.withChanges) {
          Promise.all([scope.updateMarcadores(), scope.setPosicionActual()]).then(() => {
            //this.showToast('Mostrando '+this.incidencias.length+' incidencias','info');
              scope.centrarMapa();
              scope.withChanges = false;
          });
        }
      });
    }
  }

  initMap() {
    let scope = this;

    // Initialize the map
    scope.map = new google.maps.Map(this.mapElement.nativeElement, {
      zoom: 11, 
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true
    });

    // Init infoWindow object
    scope.infoWindow = new google.maps.InfoWindow();

    // Close infoWindow if click on map
    google.maps.event.addListener(this.map, 'click', function() {
      if (scope.infoWindow)
        scope.infoWindow.close();
    });
    
  }

  loadLocales() {
    let scope = this;

    return new Promise ((resolve, reject) => {
      scope.consola('    LOADING locales ... ');
      scope.storage.ready().then(() => {
        // Load _abiertas from Storage 
        scope.storage.get('_abiertas').then((arraysIds)=>{
          scope.idsAbiertasGrouped = JSON.parse(arraysIds);
          scope.idsAbiertasAll =  scope.idsAbiertasGrouped.urgentes.concat(scope.idsAbiertasGrouped.altas, scope.idsAbiertasGrouped.normales, scope.idsAbiertasGrouped.bajas);
        
          // load each record from Storage
          let promises = [];
          scope.idsAbiertasAll.forEach( (value, key, index) => {
            promises.push(
              scope.storage.get('incidencia-'+value).then((data)=> {
                let dataParsed = JSON.parse(data);
                // update arrays
                scope.incidencias.push(dataParsed); 
                scope.consola('        Loaded '+dataParsed.id);
              })
            );
          });
          Promise.all(promises).then(() => {
            scope.firstLoad = false;
            scope.consola('    LOADED locales!');
            resolve();
          });
        });
      });
    });
  }

  addMarcadores() {
    let scope = this;

    return new Promise ((resolve, reject) => {
      scope.consola('    ADDING markers ... ');

      let promises = [];
      scope.incidencias.forEach(incidencia => {
        promises.push(
          new Promise((resolve, reject) => {
            let position = new google.maps.LatLng({lat: incidencia.geo.latitud, lng: incidencia.geo.longitud}); 
            scope.addMarker(position, incidencia.prioridad.marker, incidencia.establecimiento, incidencia.id);  
            scope.consola('        Added '+incidencia.id);
            resolve();
          })
        );
      });
      Promise.all(promises).then(() => {
        scope.firstLoad = false;
        scope.consola('    ADDED markers!');
        resolve();
      });
    });
  }

  // Adds a marker to the map and push to the array.
  addMarker(posicion, icon, info, id) {
    let scope = this;

    // Add marker
    let marker = new google.maps.Marker({
      map: scope.map,
      position: posicion,
      icon: scope.iconBase + icon,
      info: info,
      id: id
    });
    
    // Add Listener for click (open infoWindow & listen button)
    let listenerClick = google.maps.event.addListener(marker, 'click', () => {
      // If infoWindow already exists, close it
      if (scope.infoWindow) {
        scope.infoWindow.close();
      }

      let html =  '<div class="iw-container">'+
                    '<div class="iw-title">'+marker.info+'</div>'+
                    '<div class="iw-content">'+
                        '<button id="button-map-'+marker.id+'" block="" ion-button="" outline="" ng-reflect-outline="" ng-reflect-block="" class="button button-md button-outline button-outline-md button-block button-block-md">'+
                          '<span class="button-inner">CÓMO LLEGAR</span>'+
                          '<div class="button-effect"></div>'+
                        '</button>'+
                    '</div>'+
                  '</div>';
      scope.infoWindow = new google.maps.InfoWindow({ 
        content: html,
        maxWidth: 250
      });
      
      // When new infoWindow is ready...
      google.maps.event.addListener(scope.infoWindow, 'domready', function() {
        // Add Listener to button "Cómo llegar"  
        // Note: no need to track this listener. Will be automatically removed when infoWindow closes
        document.getElementById('button-map-'+marker.id).addEventListener('click', function() { scope.comoLlegar(marker.position.lat(), marker.position.lng()); });
      });
      
      // Show infoWindow
      scope.infoWindow.open(scope.map, marker);
    });

    // Save marker in local array, to be able to clean it if we remove the incidencia
    scope.markers.push({ marker: marker, listenerClick: listenerClick });
  }

  /*
   *  Remove incidencias already closed
   */
  updateLocales() {
    let scope = this;

    return new Promise ((resolve, reject) => {
      scope.consola('    UPDATING locales...');
      scope.storage.ready().then(() => {
        // Load _abiertas from Storage 
        scope.storage.get('_abiertas').then((data)=>{
          scope.idsAbiertasGrouped = JSON.parse(data);
          scope.idsAbiertasAll =  scope.idsAbiertasGrouped.urgentes.concat(scope.idsAbiertasGrouped.altas, scope.idsAbiertasGrouped.normales, scope.idsAbiertasGrouped.bajas);
        }).then(() => {
          let valids = [];
          // Remove incidencias if not in idsAbiertasAll anymore => don't push deleted to valids
          scope.incidencias.forEach((incidencia, key, index) => {
            // ...not in array idsAbiertasAll? -> not valid anymore
            if (scope.idsAbiertasAll.indexOf(incidencia.id) === -1) {  
              scope.withChanges = true;
              scope.consola('        '+incidencia.id+' --> not valid!');
            }
            else {
              valids.push(incidencia);
            }
          });
          scope.consola("        VALIDOS: "+valids.length+"/"+scope.incidencias.length);
          // update array incidencias just with valids
          scope.incidencias = valids;
          scope.consola('    UPDATED locales!');
          resolve();
        });
      });
    });
  }

  updateMarcadores() {
    let scope = this;

    return new Promise ((resolve, reject) => {
      scope.consola('    REMOVING markers...');
      let valids = [];
      // Remove markers from incidencias removed
      scope.markers.forEach((element, key, index) => {
        let id =  element.marker.id;
        // update array markers removing those attached to closed incidencias (marker.id = incidencia.id not in array idsAbiertasAll) => don't push deleted to valids
        if (scope.idsAbiertasAll.indexOf(id) === -1) { 
          // Hide marker from map
          element.marker.setMap(null);
          // remove marker Listener
          google.maps.event.removeListener(element.listenerClick);
          // remove marker from array
          scope.consola('        '+element.marker.id+' --> not valid!');
        }
        else {
          valids.push(element);
        }
      });
      // update array markers just with valids
      scope.markers = valids;
      scope.consola('    REMOVED markers!');
      resolve();
    });
  }

  

  addMarcadoresWithGeocoding() {
    let scope = this;

    scope.consola('adding markers ... ');

    // chunk requests in groups to avoid Google OVER_QUERY_LIMIT error
    let chunk_size = 10;          
    let arr = scope.incidencias;
    let groups = arr.map( function(e,i){ 
        return i%chunk_size===0 ? arr.slice(i,i+chunk_size) : null; 
    })
    .filter(function(e){ return e; });

    for(let i=0;i<groups.length;i++) {
      setTimeout(function() {
        scope.consola('llamando al grupo '+i);
        groups[i].forEach(incidencia => {
          if (1 || incidencia.geo.latitud === null) {       // Needs geocoding...
            //scope.consola(incidencia.id+" needs geocoding...");
            let direccion = incidencia.direccion+", "+incidencia.cp+" "+incidencia.poblacion+", "+incidencia.provincia;
            scope.geocoder.geocode({'address': direccion}, function(results, status) {
              if (status === google.maps.GeocoderStatus.OK) {
                scope.addMarker(results[0].geometry.location, incidencia.prioridad.marker, incidencia.establecimiento, incidencia.id);  
                scope.consola('marker for '+incidencia.id+' added');
                // Update local registry with geocode info
                incidencia.geo.latitud = results[0].geometry.location.lat;
                incidencia.geo.logitud = results[0].geometry.location.lng;
                scope.storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia));
    
              } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) { 
                scope.consola('Geocode error: ' + status);
              } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
                scope.showToast("Dirección no encontrada","warning");
                scope.consola('Geocode sin resultado: ' + status);
              } else {
                scope.consola('Geocode error: ' + status);
              }
            });
          }
          else {    // Geocoding done previously...
            let position = new google.maps.LatLng({lat: incidencia.geo.latitud, lng: incidencia.geo.longitud}); 
            scope.addMarker(position, incidencia.prioridad.marker, incidencia.establecimiento, incidencia.id);  
            scope.consola('marker for '+incidencia.id+' added');
          }
        });
      }, 5100*i);
    }

  }

  removeMarkersListeners() {
    this.markers.forEach(item => {
      google.maps.event.removeListener(item.listenerClick);
    });
  }


  // Sets the map on all markers in the array.
  setMapOnAll(map) {
    for (let i = 0; i < this.markers.length; i++) {
      this.markers[i].marker.setMap(map);
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
    this.removeMarkersListeners();
    this.markers = [];
  }
 
  setMarcadores() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  setPosicionActual() {
    let scope = this;

    return new Promise((resolve, reject) => {
      scope.clearPosicionActual().then(() => {
        scope.showPosicionActual().then(() => {
          resolve();
        });
      });
    });
  }

  clearPosicionActual() {
    let scope = this;

    return new Promise((resolve, reject) => {
      scope.consola('    CLEANING posicion actual');
      // hacemos lo que queramos y cuando estemos listos llamamos a resolve() si todo fue ok. Si hubo un error llamamos a reject();
      if (scope.posicionActual) {
        // Hide actual location marker from map
        scope.posicionActual.setMap(null);
        scope.posicionActual = null;
        resolve();
      }  else { 
        resolve();
      }
      //reject(err); // Si se produjo un error
    });
  }

  showPosicionActual() {
    let scope = this;

    return new Promise((resolve, reject) => {
      scope.consola('    SHOWING posicion actual');
      scope.geolocation.getCurrentPosition().then((position) => {
        let posicion = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        scope.posicionActual = new google.maps.Marker({
          map: scope.map,
          position: posicion,
          clickable: false,
          info: 'Mi posición'
        });
      }).then(() => {
        resolve();
      });
    });
  }

  centrarMapa() {
    let scope = this;

    scope.consola('    BOUNDS & CENTERING!');
    scope.mapBounds = new google.maps.LatLngBounds();     // Initialize map bounds
    // Add markers to map bounds
    scope.markers.forEach(element => {                  
      scope.mapBounds.extend(element.marker.position);
    });
    // Add actual position to map bounds
    scope.mapBounds.extend(this.posicionActual.position);     
    // Set map bounds
    scope.map.fitBounds(this.mapBounds);                      
  }

  fitboundsMap() {
     // Set map bounds
    this.map.fitBounds(this.mapBounds);                     
  }

  abrirIncidencia(id) {
    // jump to incidenciaPage
    this.navCtrl.push(IncidenciaPage, {id: id});        
  }

  comoLlegar(latitud, longitud){
    let scope = this;

    let app;
    if (scope.launchNavigator.isAppAvailable(scope.launchNavigator.APP.GOOGLE_MAPS)) {
      app = scope.launchNavigator.APP.GOOGLE_MAPS;
    } else {
      app = scope.launchNavigator.APP.USER_SELECT;
    }

    let options: LaunchNavigatorOptions = { app: app };
    this.launchNavigator.navigate([latitud, longitud], options);
  };

  showToast(mensaje, tipo){
    let toast = this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      cssClass: tipo
    });
    toast.present();
  }

  consola(param){
    if (this.debug)
      console.log(param);
  }
}