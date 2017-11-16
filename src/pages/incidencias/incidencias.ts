

import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ItemSliding, ToastController } from 'ionic-angular';

import { AuthServiceProvider } from './../../providers/auth-service/auth-service';

import { IncidenciaPage } from './../incidencia/incidencia';
import { IncidenciaCerrarPage } from './../incidencia-cerrar/incidencia-cerrar';

import { Storage } from '@ionic/storage';

@IonicPage()
@Component({
  selector: 'page-incidencias',
  templateUrl: 'incidencias.html'
})
export class IncidenciasPage {

  debug: boolean = false;       // Debug flag

  sesionData = { "key1": "", "key2": "" };
  responseData: any;

  firstLoad: boolean = true;

  prioridades: Array<any> = [];
  idsAbiertasGrouped            = {"urgentes":[], "altas":[], "normales":[], "bajas":[]};    // ids groups by priority
  idsAbiertasAll: Array<number> = [];           // ids (all)  ["1", "23", "44" ...]
  sinAbiertas: boolean = false
  conAbiertas: boolean = false;
  
  constructor(public navCtrl: NavController, public authService: AuthServiceProvider, 
              public navParams: NavParams, public toastCtrl: ToastController, 
              public storage: Storage) {

    this.consola('INCIDENCIAS CONSTRUCTOR');
  }

  ionViewDidLoad() {
    //scope.consola('ionViewDidLoad IncidenciasPage');
    this.prioridades[3] = { desc: 'urgente',  value: 3, color: 'danger',    icon: { ios: 'ios-flash',         md: 'md-flash' },           incidencias: [] };
    this.prioridades[2] = { desc: 'alta',     value: 2, color: 'warning',   icon: { ios: 'md-arrow-dropup',   md: 'md-arrow-dropup' },    incidencias: [] };
    this.prioridades[1] = { desc: 'normal',   value: 1, color: 'success',   icon: { ios: 'ios-more',          md: 'ios-more' },           incidencias: [] };
    this.prioridades[0] = { desc: 'baja',     value: 0, color: 'info',      icon: { ios: 'md-arrow-dropdown', md: 'md-arrow-dropdown' },  incidencias: [] };

    this.consola('INCIDENCIAS LOAD');

    this.loadIncidenciasFromServer();
  }

  ionViewDidEnter () {
    this.consola('INCIDENCIAS ENTER: firstLoad = '+this.firstLoad);
    if (!this.firstLoad) {
      this.updateLocales();
    }
  }

  loadIncidenciasFromServer() {
    let scope = this;

    scope.storage.ready().then(() => {
      scope.storage.get('_1_sesionData').then((data) => {
        if (data != null) {
          scope.sesionData = JSON.parse(data);
          //scope.consola(this.sesionData);
          scope.authService.postData(scope.sesionData, 'abiertas').then((result) => {
            scope.responseData = result;
            //scope.consola(this.responseData);
            let status = scope.responseData.status;
            if (status == 'ok') {
              // For each incidencia recevied from server ...
              scope.responseData.incidencias.forEach(incidencia => {
                // ... save each incidencia in the Storage
                scope.storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia));
              });
              // Save in Storage the array built with the incidencias ids grouped by preference
              let _abiertas = { 'urgentes': scope.responseData.urgentes, 'altas': scope.responseData.altas, 'normales': scope.responseData.normales, 'bajas': scope.responseData.bajas };
              scope.storage.set('_abiertas', JSON.stringify(_abiertas));

              let _cerradas = [];
              scope.storage.set('_cerradas', JSON.stringify(_cerradas));

              scope.loadLocales();

              scope.firstLoad = false;
            }
            else {
              scope.showToast(scope.responseData.error.text, "error");
              scope.consola(scope.responseData.error);
            }
          }, (err) => {
            scope.showToast("Error de conexion", "error");
            scope.consola("Error de conexion");   // Connection failed message
          });
        }
      });
    });
  }

  loadLocales(){
    let scope = this;

    scope.storage.ready().then(() => {
      // Load _abiertas from Storage 
      scope.storage.get('_abiertas').then((arraysIds)=>{
        scope.idsAbiertasGrouped = JSON.parse(arraysIds);
        scope.idsAbiertasAll =  scope.idsAbiertasGrouped.urgentes.concat(scope.idsAbiertasGrouped.altas, scope.idsAbiertasGrouped.normales, scope.idsAbiertasGrouped.bajas);
       
        // load each record from Storage
        scope.idsAbiertasAll.forEach( (value, key, index) => {
          scope.storage.get('incidencia-'+value).then((data)=> {
            let dataParsed = JSON.parse(data);
            // update arrays
            scope.prioridades[dataParsed.prioridad.val].incidencias.push(dataParsed); 
          });
        });
        // update booleans
        scope.conAbiertas = (scope.idsAbiertasAll.length > 0);
        scope.sinAbiertas = !(scope.conAbiertas);
      });
    });
  }

  updateLocales() {
    let scope = this;

    scope.storage.ready().then(() => {
      scope.storage.get('_abiertas').then((data)=>{
        scope.idsAbiertasGrouped = JSON.parse(data);
        scope.idsAbiertasAll =  scope.idsAbiertasGrouped.urgentes.concat(scope.idsAbiertasGrouped.altas, scope.idsAbiertasGrouped.normales, scope.idsAbiertasGrouped.bajas);

        scope.conAbiertas = (scope.idsAbiertasAll.length > 0);
        scope.sinAbiertas = !(scope.conAbiertas);
      }).then(() => {
        let valids = [];
        // Remove incidencias from its grouped array if not in idsAbiertasAll anymore => don't push deleted to valids
        scope.prioridades.forEach((grupo, key, index) => {
          grupo.incidencias.forEach((incidencia, clave, index) => {
            // update arrays removing already closed incidencias (not in array idsAbiertasAll)
            if (scope.idsAbiertasAll.indexOf(incidencia.id) === -1) {  
              //scope.consola(this.prioridades[key].incidencias[clave]);
              scope.prioridades[key].incidencias.splice(clave, 1);
            }
            else {
              valids.push();    // CHEMAAAAAAAAAAAAAAAA
            }
          });
        });
      });
    });
  }
  
  isAbierta(id) {
    return (this.idsAbiertasAll.indexOf(id) !== -1);
  }

  cerrarIncidencia(slidingItem: ItemSliding, id) {
    slidingItem.close();                                // Close sliding item
    this.navCtrl.push(IncidenciaCerrarPage, {id: id});  // jump to incidenciaCerrarPage
  }

  mostrarIncidencia(id) {
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

  consola(param){
    if (this.debug)
      console.log(param);
  }
}
