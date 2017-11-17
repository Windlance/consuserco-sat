import { Component } from '@angular/core';
import { IonicPage, NavController, App, ActionSheetController } from 'ionic-angular';
//import { AuthServiceProvider } from './../../providers/auth-service/auth-service';

import { WelcomePage } from './../welcome/welcome';

import { Storage } from '@ionic/storage';

@IonicPage()
@Component({
  selector: 'page-configuracion',
  templateUrl: 'configuracion.html',
})
export class ConfiguracionPage {

  debug: boolean = false;       // Debug flag

  userDetails = { "foto": '', "nombre": '', "apellidos": '', "ocupacion": ''};

  firstLoad: boolean = true;

  constructor(public navCtrl: NavController, public app: App, 
              //public authService: AuthServiceProvider, 
              public actionSheetCtrl: ActionSheetController, public storage: Storage) {
    this.consola('CONFIGURACION CONSTRUCTOR');
  }

  ionViewDidLoad() {
    let scope = this;

    scope.consola('CONFIGURACION LOAD');
    scope.storage.get('_2_userData').then((data) => {
      if (data != null) {
        let campos =  JSON.parse(data);
        scope.userDetails = campos;
      }
    });
  }

  ionViewDidEnter() {
    let scope = this;

    scope.consola('INCIDENCIAS ENTER: firstLoad = '+scope.firstLoad);
    if (!scope.firstLoad) {
      
    }
  }
 
  confirmLogout(){
    this.presentActionSheet();
  }

  presentActionSheet() {
    let scope = this;

    let actionSheet = scope.actionSheetCtrl.create({
      cssClass: 'actionLogout',
      title: '¿Seguro que quieres salir?',
      buttons: [
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {    // Hacemos logout
            scope.storage.clear();
            scope.app.getRootNav().setRoot(WelcomePage, '', { animate: false });
          }
        },{
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {    // Si cancela el logout, no hacemos nada
          }
        }
      ]
    });
    actionSheet.present();
  }

  consola(param){
    if (this.debug)
      console.log(param);
  }
}
