

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
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad IncidenciasPage');
    this.prioridades[3] = { desc: 'urgente',  value: 3, color: 'danger',    icon: { ios: 'ios-flash',         md: 'md-flash' },           incidencias: [] };
    this.prioridades[2] = { desc: 'alta',     value: 2, color: 'warning',   icon: { ios: 'md-arrow-dropup',   md: 'md-arrow-dropup' },    incidencias: [] };
    this.prioridades[1] = { desc: 'normal',   value: 1, color: 'success',   icon: { ios: 'ios-more',          md: 'ios-more' },           incidencias: [] };
    this.prioridades[0] = { desc: 'baja',     value: 0, color: 'info',      icon: { ios: 'md-arrow-dropdown', md: 'md-arrow-dropdown' },  incidencias: [] };

    this.loadIncidenciasFromServer();
  }

  ionViewDidEnter () {
    console.log('ionViewDidEnter IncidenciasPage: firstLoad = '+this.firstLoad);
    if (!this.firstLoad) {
      this.updateLocales();
    }
  }

  loadIncidenciasFromServer() {
    this.storage.ready().then(() => {
      this.storage.get('_1_sesionData').then((data) => {
        if (data != null) {
          this.sesionData = JSON.parse(data);
          //console.log(this.sesionData);
          this.authService.postData(this.sesionData, 'abiertas').then((result) => {
            this.responseData = result;
            //console.log(this.responseData);
            let status = this.responseData.status;
            if (status == 'ok') {
              // For each incidencia recevied from server ...
              this.responseData.incidencias.forEach(incidencia => {
                // ... save each incidencia in the Storage
                this.storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia));
              });
              // Save in Storage the array built with the incidencias ids grouped by preference
              let _abiertas = { 'urgentes': this.responseData.urgentes, 'altas': this.responseData.altas, 'normales': this.responseData.normales, 'bajas': this.responseData.bajas };
              this.storage.set('_abiertas', JSON.stringify(_abiertas));

              let _cerradas = [];
              this.storage.set('_cerradas', JSON.stringify(_cerradas));

              this.loadLocales();

              this.firstLoad = false;
            }
            else {
              this.showToast(this.responseData.error.text, "error");
              console.log(this.responseData.error);
            }
          }, (err) => {
            this.showToast("Error de conexion", "error");
            console.log("Error de conexion");   // Connection failed message
          });
        }
      });
    });
  }

  loadLocales(){
    this.storage.ready().then(() => {
      // Load _abiertas from Storage 
      this.storage.get('_abiertas').then((arraysIds)=>{
        this.idsAbiertasGrouped = JSON.parse(arraysIds);
        this.idsAbiertasAll =  this.idsAbiertasGrouped.urgentes.concat(this.idsAbiertasGrouped.altas, this.idsAbiertasGrouped.normales, this.idsAbiertasGrouped.bajas);
       
        // load each record from Storage
        this.idsAbiertasAll.forEach( (value, key, index) => {
          this.storage.get('incidencia-'+value).then((data)=> {
            let dataParsed = JSON.parse(data);
            // update arrays
            this.prioridades[dataParsed.prioridad.val].incidencias.push(dataParsed); 
          });
        });
        // update booleans
        this.conAbiertas = (this.idsAbiertasAll.length > 0);
        this.sinAbiertas = !(this.conAbiertas);
      });
    });
  }

  updateLocales() {
    this.storage.ready().then(() => {
      this.storage.get('_abiertas').then((data)=>{
        this.idsAbiertasGrouped = JSON.parse(data);
        this.idsAbiertasAll =  this.idsAbiertasGrouped.urgentes.concat(this.idsAbiertasGrouped.altas, this.idsAbiertasGrouped.normales, this.idsAbiertasGrouped.bajas);

        this.conAbiertas = (this.idsAbiertasAll.length > 0);
        this.sinAbiertas = !(this.conAbiertas);
      }).then(() => {
        // Remove incidencias from its grouped array if not in idsAbiertasAll anymore 
        this.prioridades.forEach((grupo, key, index) => {
          grupo.incidencias.forEach((incidencia, clave, index) => {
            // update arrays removing already closed incidencias (not in array idsAbiertasAll)
            if (this.idsAbiertasAll.indexOf(incidencia.id) === -1) {  
              //console.log(this.prioridades[key].incidencias[clave]);
              this.prioridades[key].incidencias.splice(clave, 1);
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
}
