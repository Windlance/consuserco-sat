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

  @ViewChild('map') mapElement: ElementRef;
  map: any;

  firstLoad: boolean = true;

  iconBase = 'assets/imgs/map-markers/';

  geocoder = new google.maps.Geocoder;
  posicionActual = new google.maps.Marker;
  infoWindow = new google.maps.InfoWindow;
  mapBounds = new google.maps.LatLngBounds;

  incidencias = []; 
  idsAbiertasGrouped            = {"urgentes":[], "altas":[], "normales":[], "bajas":[]};    // ids groups by priority
  idsAbiertasAll: Array<number> = [];           // ids (all)  ["1", "23", "44" ...]

  markers = [];               // Array de objetos tipo:  { marker (google.maps.Marker), listenerClick (google.maps.event listener) }

  withChanges: boolean = false;   // determines if map has changed (markers) and if so, center again

  constructor(public navCtrl: NavController, public toastCtrl: ToastController, private geolocation: Geolocation, 
              public storage: Storage, public launchNavigator: LaunchNavigator) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MapaPage');
    this.initMap();       // Initialize map
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter MapaPage: firstLoad = '+this.firstLoad);
    let scope = this;

    // If infoWindow exist (opened), close it
    if (scope.infoWindow) {
      scope.infoWindow.close();
    }

    if (this.firstLoad) {
      this.loadLocales().then(() => {
        Promise.all([this.addMarcadores(), this.setPosicionActual()]).then(() => {
          //this.showToast('Mostrando '+this.incidencias.length+' incidencias','info');
          this.centrarMapa();
        });
      });   // Load from Storage
    }
    else {
      this.updateLocales().then(() => {
        Promise.all([this.updateMarcadores(), this.setPosicionActual()]).then(() => {
          //this.showToast('Mostrando '+this.incidencias.length+' incidencias','info');
          if (scope.withChanges) {
            this.centrarMapa();
            scope.withChanges = false;
          }
        });
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
    return new Promise ((resolve, reject) => {
      console.log('loading locales ... ');
      this.storage.ready().then(() => {
        // Load _abiertas from Storage 
        this.storage.get('_abiertas').then((arraysIds)=>{
          this.idsAbiertasGrouped = JSON.parse(arraysIds);
          this.idsAbiertasAll =  this.idsAbiertasGrouped.urgentes.concat(this.idsAbiertasGrouped.altas, this.idsAbiertasGrouped.normales, this.idsAbiertasGrouped.bajas);
        
          // load each record from Storage
          let promises = [];
          this.idsAbiertasAll.forEach( (value, key, index) => {
            promises.push(
              this.storage.get('incidencia-'+value).then((data)=> {
                let dataParsed = JSON.parse(data);
                // update arrays
                this.incidencias.push(dataParsed); 
                console.log('cargada incidencia '+dataParsed.id);
              })
            );
          });
          Promise.all(promises).then(() => {
            this.firstLoad = false;
            console.log('TODAS cargadas...');
            resolve();
          });
        });
      });
    });
  }

  /*
   *  Remove incidencias already closed
   */
  updateLocales() {
    let scope = this;
    return new Promise ((resolve, reject) => {
      console.log('updating locales...');
      scope.storage.ready().then(() => {
        // Load _abiertas from Storage 
        scope.storage.get('_abiertas').then((data)=>{
          scope.idsAbiertasGrouped = JSON.parse(data);
          scope.idsAbiertasAll =  scope.idsAbiertasGrouped.urgentes.concat(scope.idsAbiertasGrouped.altas, scope.idsAbiertasGrouped.normales, scope.idsAbiertasGrouped.bajas);
  
        }).then(() => {
          // Remove incidencias if not in idsAbiertasAll anymore 
          scope.incidencias.forEach((incidencia, key, index) => {
            // update array incidencias removing already closed ones (not in array idsAbiertasAll)
            console.log('removing '+incidencia.id+'...?');
            if (scope.idsAbiertasAll.indexOf(incidencia.id) === -1) {  
              scope.withChanges = true;
              console.log('removed incidencia '+incidencia.id+'!');
              scope.incidencias.splice(key, 1);
            }
          });
          console.log('TODAS las incidencias limpias...');
          resolve();
        });
      });
    });
  }

  updateMarcadores() {
    let scope = this;
    return new Promise ((resolve, reject) => {
      // Remove markers from incidencias removed
      this.markers.forEach((element, key, index) => {
        let id =  element.marker.id;
        // update array markers removing those attached to closed incidencias (marker.id = incidencia.id not in array idsAbiertasAll)
        if (this.idsAbiertasAll.indexOf(id) === -1) { 
          // Hide marker from map
          element.marker.setMap(null);
          // remove marker Listener
          google.maps.event.removeListener(element.listenerClick);
          // remove marker from array
          scope.markers.splice(key, 1);
          console.log('removed marker '+element.marker.id+'...');
        }
      });
      resolve();
    });
  }

  addMarcadores() {
    return new Promise ((resolve, reject) => {
      let scope = this;
      console.log('adding markers ... ');

      let promises = [];
      this.incidencias.forEach(incidencia => {
        promises.push(
          new Promise((resolve, reject) => {
            let position = new google.maps.LatLng({lat: incidencia.geo.latitud, lng: incidencia.geo.longitud}); 
            scope.addMarker(position, incidencia.prioridad.marker, incidencia.establecimiento, incidencia.id);  
            console.log('marker '+incidencia.id+' añadido...');
            resolve();
          })
        );
      });
      Promise.all(promises).then(() => {
        this.firstLoad = false;
        console.log('TODOS los markers añadidos...');
        resolve();
      });
    });
  }

  // Adds a marker to the map and push to the array.
  addMarker(posicion, icon, info, id) {
    let scope = this;

    // Add marker
    let marker = new google.maps.Marker({
      map: this.map,
      position: posicion,
      icon: this.iconBase + icon,
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
    this.markers.push({ marker: marker, listenerClick: listenerClick });
    // Ej: google.maps.event.removeListener(listenerClick)
  }

  addMarcadoresWithGeocoding() {
    let scope = this;
    console.log('adding markers ... ');

    // chunk requests in groups to avoid Google OVER_QUERY_LIMIT error
    var chunk_size = 10;          
    var arr = scope.incidencias;
    var groups = arr.map( function(e,i){ 
        return i%chunk_size===0 ? arr.slice(i,i+chunk_size) : null; 
    })
    .filter(function(e){ return e; });

    for(let i=0;i<groups.length;i++) {
      setTimeout(function() {
        console.log('llamando al grupo '+i);
        groups[i].forEach(incidencia => {
          if (1 || incidencia.geo.latitud === null) {       // Needs geocoding...
            //console.log(incidencia.id+" needs geocoding...");
            let direccion = incidencia.direccion+", "+incidencia.cp+" "+incidencia.poblacion+", "+incidencia.provincia;
            scope.geocoder.geocode({'address': direccion}, function(results, status) {
              if (status === google.maps.GeocoderStatus.OK) {
                scope.addMarker(results[0].geometry.location, incidencia.prioridad.marker, incidencia.establecimiento, incidencia.id);  
                console.log('marker for '+incidencia.id+' added');
                // Update local registry with geocode info
                incidencia.geo.latitud = results[0].geometry.location.lat;
                incidencia.geo.logitud = results[0].geometry.location.lng;
                scope.storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia));
    
              } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) { 
                console.log('Geocode error: ' + status);
              } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
                scope.showToast("Dirección no encontrada","warning");
                console.log('Geocode sin resultado: ' + status);
              } else {
                console.log('Geocode error: ' + status);
              }
            });
          }
          else {    // Geocoding done previously...
            let position = new google.maps.LatLng({lat: incidencia.geo.latitud, lng: incidencia.geo.longitud}); 
            scope.addMarker(position, incidencia.prioridad.marker, incidencia.establecimiento, incidencia.id);  
            console.log('marker for '+incidencia.id+' added');
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
    for (var i = 0; i < this.markers.length; i++) {
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
    return new Promise((resolve, reject) => {
      this.clearPosicionActual().then(() => {
        this.showPosicionActual().then(() => {
          resolve();
        });
      });
    });
  }

  clearPosicionActual() {
    return new Promise((resolve, reject) => {
      console.log('cleaning posicion actual');
      // hacemos lo que queramos y cuando estemos listos llamamos a resolve() si todo fue ok. Si hubo un error llamamos a reject();
      if (this.posicionActual) {
        // Hide actual location marker from map
        this.posicionActual.setMap(null);
        this.posicionActual = null;
        resolve();
      }  else { 
        resolve();
      }
      //reject(err); // Si se produjo un error
    });
  }

  showPosicionActual() {
    return new Promise((resolve, reject) => {
      console.log('showing posicion actual');
      let scope = this;
      this.geolocation.getCurrentPosition().then((position) => {
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
    console.log('settting bounds and centering map');
    this.mapBounds = new google.maps.LatLngBounds();     // Initialize map bounds

    this.markers.forEach(element => {                   // Add markers to map bounds
      this.mapBounds.extend(element.marker.position);
    });

    this.mapBounds.extend(this.posicionActual.position);     // Add actual position to map bounds

    this.map.fitBounds(this.mapBounds);                      // Set map bounds
  }

  fitbounds() {
    this.map.fitBounds(this.mapBounds);                      // Set map bounds
  }
  abrirIncidencia(id) {
    this.navCtrl.push(IncidenciaPage, {id: id});        // jump to incidenciaPage
  }

  showToast(mensaje, tipo){
    let toast = this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      cssClass: tipo
    });
    toast.present();
  }

  comoLlegar(latitud, longitud){
    //let obj = e.currentTarget;
    let scope = this;
    console.log('dentro de comoLlegar:');
    let app;
    if (scope.launchNavigator.isAppAvailable(scope.launchNavigator.APP.GOOGLE_MAPS)) {
      app = scope.launchNavigator.APP.GOOGLE_MAPS;
    } else {
      app = scope.launchNavigator.APP.USER_SELECT;
    }

    let options: LaunchNavigatorOptions = {
      app: app
    };
    this.launchNavigator.navigate([latitud, longitud], options);
  };
}