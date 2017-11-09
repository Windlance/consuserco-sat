
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Platform, IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { ConnectivityServiceProvider } from './../../providers/connectivity-service/connectivity-service';

import { IncidenciaCerrarPage } from './../incidencia-cerrar/incidencia-cerrar';

import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
//import { Geolocation } from '@ionic-native/geolocation';
import { GoogleMaps, GoogleMap } from '@ionic-native/google-maps';
//import { GoogleMapsEvent, Marker, Geocoder, GeocoderResult } from  '@ionic-native/google-maps'
//import { BaseArrayClass, GoogleMapsAnimation } from '@ionic-native/google-maps';
//import { MyLocation } from '@ionic-native/google-maps';

declare var google;

@IonicPage()
@Component({
  selector: 'page-incidencia',
  templateUrl: 'incidencia.html',
})
export class IncidenciaPage {

  id: number = null;
  incidencia = {
    'numeracion':'', 'establecimiento':'', 'maquina':{'modelo':'','fabricante':''}, 'direccion':'', 'poblacion':'', 'provincia':'', 'cp':'', 
    'horario':'', 'telefono':'', 'geo':{'longitud':'', 'latitud':''}, 'tipos':[], 'descripcion':'', 'prioridad':{'desc':'','val':'','marker':''}, 'estado':''
  };
  
  map: GoogleMap;
  mapReady: boolean = false;

  @ViewChild('map') mapElement: ElementRef;

  mapInitialised: boolean = false;
  apiKey: string = 'AIzaSyDD_5is8bfWjLDzgHxqGCiy-1vrJWyOleY';  

  apiKey_android = 'AIzaSyAIsp-5ESBUL8cjf_txJsxa3zq9qgUarTI'; // Proyecto sat-Android
  iconBase = 'assets/imgs/map-markers/';
  infoWindow: any;

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
  prioridad = { 'desc':'', 'val':'', 'marker':'' };

  full_direccion: string;

  public geocoded               : boolean;
  public results                : string;

  resultado: any;

  constructor(public navCtrl: NavController, public connectivityService: ConnectivityServiceProvider, 
              public launchNavigator: LaunchNavigator,
              public platform: Platform, private googleMaps: GoogleMaps, 
              //private geocoder: Geocoder, 
              public navParams: NavParams, public toastCtrl: ToastController, public storage: Storage) {
    this.id = navParams.get('id');
  }
 
  ionViewDidLoad() {
    console.log('ionViewDidLoad IncidenciaPage');
    //this.addConnectivityListeners();    // Atiendo a escuchas
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter IncidenciaPage');
    
      //if (this.mapReady)
        //this.map.clear();     // limpio el mapa
      this.loadIncidencia();    // cargo la incidencia

      this.loadGoogleMap();
    
    
  }

  loadIncidencia() {
    this.incidencia = {
      'numeracion':'', 'establecimiento':'', 'maquina':{'modelo':'','fabricante':''}, 'direccion':'', 'poblacion':'', 'provincia':'', 'cp':'', 
      'horario':'', 'telefono':'', 'geo':{'longitud':'', 'latitud':''}, 'tipos':[], 'descripcion':'', 'prioridad':{'desc':'','val':'','marker':''}, 'estado': ''
    };

    this.storage.ready().then(() => {
      this.storage.get('incidencia-'+this.id).then((data) => {
        if (data != null) {
          this.incidencia = JSON.parse(data);

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
          this.prioridad = this.incidencia.prioridad;

          this.estaCerrada = (this.incidencia.estado == '4');

          this.full_direccion = this.direccion+', '+this.cp+' '+this.poblacion+', '+this.provincia;
        }
      });
    });
  }

  loadGoogleMap(){
    console.log('hola 1');
    this.platform.ready().then(()=>{
      let mapDiv = document.getElementById('map_canvas');
      console.log(mapDiv);
      this.map = this.googleMaps.create(mapDiv);
      console.log('hola 4');
    });
    
    console.log('hola 2');
    // Wait the MAP_READY before using any methods.
    /*
    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      this.mapReady = true;
      this.map.refreshLayout();
      console.log("map ready");
      this.showToast('map ready', "success"); 
    }, (error) => {
      this.showToast('error '+error, "success"); 
      console.log('Error ready map', error);
    });

   */
    console.log('hola 3');
    /*
    // Address -> latitude,longitude
    this.geocoder.geocode({"address": this.full_direccion})
    .then((results: GeocoderResult[]) => {
      console.log(results);

      let icon = this.iconBase+""+this.prioridad.marker;
      return this.map.addMarker({
        'position': results[0].position,
        'title':  JSON.stringify(results[0].position),
        'icon': icon
      })
    })
    .then((marker: Marker) => {
      this.map.animateCamera({
        'target': marker.getPosition(),
        'zoom': 17
      }).then(() => {
        marker.showInfoWindow();
      })
    });
    */
  }

  /*
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
    this.mapInitialised = true;

    // geocodificamos la direccion de la incidencia
    //let direccion = this.full_direccion;
    let direccion = "Camino Ventas del Escorial 12, 28400 villalba";
    direccion = 'Berlin';
    //let icon = this.iconBase + "" + this.prioridad.marker;
    

    // Create a map after the view is loaded.
    // (platform is already ready in app.component.ts)
    this.map = this.googleMaps.create(this.mapElement.nativeElement, {
      camera: {
        target: {
          lat: 43.0741704,
          lng: -89.3809802
        },
        zoom: 18,
        tilt: 30
      }
    });

    // Wait the maps plugin is ready until the MAP_READY event
    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      this.mapReady = true;
    });

    

    

    
        if (results[0]) {
          // Definimos un centro para el mapa, el zoom, y lo creamos
          let temp = this.mapElement.nativeElement;
          let mapa = new google.maps.Map(temp, {
            center: results[0].geometry.location, 		
            zoom: 17, 
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
          });
          this.map = mapa;

          //let posicion = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
          //console.log(posicion);
          let marker = new google.maps.Marker({
            map: this.map,
            animation: google.maps.Animation.DROP, // tipos animacion: DROP / BOUNCE
            position: results[0].geometry.location,
            icon: icon,
            id: this.id
          });
        
          this.infoWindow = new google.maps.InfoWindow({
            content: "<p no-margin>"+results[0].formatted_address+"</p>"
          });
          google.maps.event.addListener(marker, 'mouseover', () => {
            this.infoWindow.open(this.map, marker);
          });
          google.maps.event.addListener(marker, 'mouseout', () => {
            if (this.infoWindow) {
              this.infoWindow.close();
            }
          });
        }
        else {
          this.showToast("Dirección no encontrada", "error");
        }
      } else if (status === 'ZERO_RESULTS') {
        this.showToast("Dirección no encontrada", "error");
      } else if (status === 'OVER_QUERY_LIMIT') {
        this.showToast('Geocodificación fallida: cuota diaria excedida', "error"); 
      } else if (status === 'REQUEST_DENIED') {
        this.showToast('Geocodificación fallida: rechazada', "error"); 
      } else if (status === 'INVALID_REQUEST') {
        this.showToast('Geocodificación fallida: consulta invalida', "error"); 
      } else if (status === 'UNKNOWN_ERROR') {
        this.showToast('Geocodificación fallida: error del servidor', "error"); 
      }
    });
    
  }

  */
  disableMap(){
    console.log("disable map");
  }

  enableMap(){
    console.log("enable map");
  }

  initMap(){

  }

  addConnectivityListeners(){
    let onOnline = () => {
      setTimeout(() => {
        if(typeof google == "undefined" || typeof google.maps == "undefined"){
          this.loadGoogleMap();
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
