

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

    this.loadIncidenciasFromServer().then(() => {
      
    });
    
  }

  ionViewDidEnter () {
    this.consola('INCIDENCIAS ENTER: firstLoad = '+this.firstLoad);
    if (!this.firstLoad) {
      this.updateLocales();
    }
  }

  loadIncidenciasFromServer() {
    let scope = this;

    return new Promise ((resolve, reject) => {
      scope.consola('    LOADING FROM SERVER ... ');

      scope.storage.ready().then(() => {
        // Load sesion data from local storage
        scope.storage.get('_1_sesionData').then((data) => {
          if (data != null) {
            scope.sesionData = JSON.parse(data);
            scope.consola('        Loaded Sesion Data loaded');

            scope.consola('        LOADING Abiertas from server');
            // Retrieve abiertas from server
            scope.authService.postData(scope.sesionData, 'abiertas').then((result) => {
              scope.responseData = result;
              let status = scope.responseData.status;
              if (status == 'ok') {
                scope.consola('        ... Abiertas loaded');

                scope.consola('        SAVING EACH to local Storage');
                let promisesEach = [];
                // For each incidencia recevied from server ...
                scope.responseData.incidencias.forEach(incidencia => {
                  // ... save each incidencia in the Storage
                  promisesEach.push(
                    scope.storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia)).then(() => {
                      scope.consola('            incidencia-'+incidencia.id+' saved');
                    })
                  )
                });
                // When each saved... continue
                Promise.all(promisesEach).then(() => {
                  scope.consola('        SAVED EACH!');
                  scope.consola('        SAVING ARRAY _abiertas to local Storage');
                  // Save in Storage the array built with the incidencias ids grouped by preference
                  let _abiertas = { 'urgentes': scope.responseData.urgentes, 'altas': scope.responseData.altas, 'normales': scope.responseData.normales, 'bajas': scope.responseData.bajas };
                  let promiseAbiertas = scope.storage.set('_abiertas', JSON.stringify(_abiertas)).then(() => {
                    scope.consola('        SAVED _abiertas!');
                  });
  
                  scope.consola('        SAVING ARRAY _cerradas to local Storage (in paralell)');
                  let _cerradas = [];
                  let promiseCerradas = scope.storage.set('_cerradas', JSON.stringify(_cerradas)).then(() => {
                    scope.consola('        SAVED _cerradas!');
                  });

                  // When _abiertas and _cerradas saved--- continue
                  Promise.all([promiseAbiertas, promiseCerradas]).then(() => {
                    scope.consola('    LOADED SERVER!');
                    scope.loadLocales().then(() => {
                      scope.firstLoad = false;
                    });
                  });
                });
              }
              else {
                scope.showToast(scope.responseData.error.text, "error");
                scope.consola('        ... Abiertas NOT loaded --> ERROR: '+scope.responseData.error);
              }

            }, (err) => {
              scope.showToast("Error de conexion", "error");
              scope.consola('        CONEXION FAILED!');     // Connection failed message
            });
          }
          else {
            scope.consola('        No Sesion Data');
            // redirect to login
          }
        });
      });

    })
  }

  loadLocales(){
    let scope = this;

    return new Promise ((resolve, reject) => {
      scope.consola('    LOADING FROM STORAGE ... ');

      scope.storage.ready().then(() => {
        // Load _abiertas from Storage 
        scope.storage.get('_abiertas').then((arraysIds)=>{
          scope.idsAbiertasGrouped = JSON.parse(arraysIds);
          scope.idsAbiertasAll =  scope.idsAbiertasGrouped.urgentes.concat(scope.idsAbiertasGrouped.altas, scope.idsAbiertasGrouped.normales, scope.idsAbiertasGrouped.bajas);
        
          let promises = [];
          // load each record from Storage
          scope.idsAbiertasAll.forEach( (value, key, index) => {
            promises.push(
                scope.storage.get('incidencia-'+value).then((data)=> {
                  let dataParsed = JSON.parse(data);
                  // update arrays
                  scope.prioridades[dataParsed.prioridad.val].incidencias.push(dataParsed); 
                  scope.consola('        incidencia-'+value+' loaded');
                })
            )
          });
          // update booleans
          scope.conAbiertas = (scope.idsAbiertasAll.length > 0);
          scope.sinAbiertas = !(scope.conAbiertas);

          Promise.all(promises).then(() => {
            scope.consola('    LOADED!');
            resolve();
          })
        });
      });

    })
  }

  updateLocales() {
    let scope = this;

    return new Promise ((resolve, reject) => {
      scope.consola('    UPDATING FROM STORAGE ...');

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
            valids[key] = [];
            grupo.incidencias.forEach((incidencia, clave, index) => {
              let flecha = '';
              // update arrays removing already closed incidencias (not in array idsAbiertasAll)
              if (scope.idsAbiertasAll.indexOf(incidencia.id) === -1) {  
                scope.consola('            '+incidencia.id+' --> not valid! ↴');
              }
              else {
                valids[key].push(incidencia);    
              }
            });
            scope.consola("        ["+key+"] VALIDOS: "+valids[key].length+"/"+scope.prioridades[key].incidencias.length);
            scope.prioridades[key].incidencias = valids[key];
          });
          scope.consola('    UPDATED!');
          resolve();
        });
      });

    })
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
