import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ItemSliding, ToastController } from 'ionic-angular';

import { AuthServiceProvider } from './../../providers/auth-service/auth-service';

import { IncidenciaPage } from './../incidencia/incidencia';
import { IncidenciaCerrarPage } from './../incidencia-cerrar/incidencia-cerrar';

import { Storage } from '@ionic/storage';


@IonicPage()
@Component({
  selector: 'page-incidencias',
  templateUrl: 'incidencias.html',
})
export class IncidenciasPage {

  sesionData = { "key1": "", "key2": "" };

  responseData: any;
  prioridades: any;

  firstLoad = true;

  incidenciasAbiertas = {"urgentes":[], "altas":[], "normales":[], "bajas":[]};
  incidenciasCerradas: any;

  showPendientes = true;
  
  sinAbiertas: boolean = false
  conAbiertas: boolean = false;
  sinCerradas: boolean = false;
  conCerradas: boolean = false;

  constructor(public navCtrl: NavController, public authService: AuthServiceProvider, 
              public navParams: NavParams, public toastCtrl: ToastController, 
              public storage: Storage) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IncidenciasPage');
  }

  ionViewDidEnter () {
    console.log('ionViewDidEnter IncidenciasPage: firstLoad = '+this.firstLoad);
    if (this.firstLoad) {
      this.loadIncidenciasFromServer();
    }
    else {
      this.actualizarLocales();
      //this.showToast("refresh!!", "warning");
    }
  }

  loadIncidenciasFromServer() {
    //console.log("LOAD FROM SERVER");
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
              // Para cada incidencia abierta recibida del servidor...
              this.responseData.incidencias.forEach(incidencia => {
                // Guardo cada incidencia en Storage por separado
                this.storage.set('incidencia-'+incidencia.id, JSON.stringify(incidencia));
              });
              // Guardo el array de ids de incidencias (ids) agrupados segun prioridad en el Storage
              let ids = { 'urgentes': this.responseData.urgentes, 'altas': this.responseData.altas, 'normales': this.responseData.normales, 'bajas': this.responseData.bajas };
              this.storage.set('_abiertas', JSON.stringify(ids));

              let _cerradas = [];
              this.storage.set('_cerradas', JSON.stringify(_cerradas));

              this.actualizarLocales();

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

  actualizarLocales(){
    this.incidenciasAbiertas = {"urgentes":[], "altas":[], "normales":[], "bajas":[]};
    this.conAbiertas = false;

    this.storage.ready().then(() => {
      this.storage.get('_abiertas').then((arraysIds)=>{
        let _abiertas = JSON.parse(arraysIds);
        
        let iUrgentes = _abiertas.urgentes;
        if (iUrgentes.length > 0) {
          iUrgentes.forEach( (value, key, index) => {
            this.storage.get('incidencia-'+value).then((data)=> {
              this.incidenciasAbiertas.urgentes.push(JSON.parse(data)); 
              this.conAbiertas = true;
              this.sinAbiertas = false;
              });
          });
        }
    
        let iAltas = _abiertas.altas;
        if (iAltas.length > 0) {
          iAltas.forEach( (value, key, index) => {
            this.storage.get('incidencia-'+value).then((data)=> {
              this.incidenciasAbiertas.altas.push(JSON.parse(data)); 
              this.conAbiertas = true;
              this.sinAbiertas = false;
            });
          });
        }
        
        let iNormales = _abiertas.normales;
        if (iNormales.length > 0) {
          iNormales.forEach( (value, key, index) => {
            this.storage.get('incidencia-'+value).then((data)=> {
              this.incidenciasAbiertas.normales.push(JSON.parse(data)); 
              this.conAbiertas = true;
              this.sinAbiertas = false;
            });
          });
        }
    
        let iBajas = _abiertas.bajas;
        if (iBajas.length > 0) {
          iBajas.forEach( (value, key, index) => {
            this.storage.get('incidencia-'+value).then((data)=> {
              this.incidenciasAbiertas.bajas.push(JSON.parse(data)); 
              this.conAbiertas = true;
              this.sinAbiertas = false;
            });
          });
        }

      }).then(() => {
        this.prioridades = [];

        this.prioridades = [
          { desc: 'urgente',  value: 3, color: 'danger', icon: { ios: 'ios-flash', md: 'md-flash' }, incidencias: this.incidenciasAbiertas.urgentes },
          { desc: 'alta',     value: 2, color: 'warning', icon: { ios: 'md-arrow-dropup', md: 'md-arrow-dropup' }, incidencias: this.incidenciasAbiertas.altas },
          { desc: 'normal',   value: 1, color: 'success', icon: { ios: 'ios-more', md: 'ios-more' }, incidencias: this.incidenciasAbiertas.normales },
          { desc: 'baja',     value: 0, color: 'info', icon: { ios: 'md-arrow-dropdown', md: 'md-arrow-dropdown' }, incidencias: this.incidenciasAbiertas.bajas }
        ];

      });
    });
  }
  
  mostrarPendientes() {
    this.showPendientes = true;
  }

  mostrarCerradas() {
    this.showPendientes = false;
    this.incidenciasCerradas = this.incidenciasAbiertas.urgentes;
    this.conCerradas = (this.incidenciasCerradas.length)?true:false;
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
