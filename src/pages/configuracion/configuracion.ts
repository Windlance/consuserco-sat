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

  userDetails = { "foto": '', "nombre": '', "apellidos": '', "ocupacion": ''};

  constructor(public navCtrl: NavController, public app: App, 
              //public authService: AuthServiceProvider, 
              public actionSheetCtrl: ActionSheetController, public storage: Storage) {
  }

  ionViewDidLoad() {
    this.storage.get('_2_userData').then((data) => {
      if (data != null) {
        let campos =  JSON.parse(data);
        this.userDetails = campos;
      }
    });
    console.log('ionViewDidLoad ConfiguracionPage');
  }
 
  confirmLogout(){
    this.presentActionSheet();
  }

  presentActionSheet() {
    let actionSheet = this.actionSheetCtrl.create({
      title: '¿Seguro que quieres salir?',
      buttons: [
        {
          text: 'Salir',
          role: 'destructive',
          handler: () => {    // Hacemos logout
            this.storage.clear();
            this.app.getRootNav().setRoot(WelcomePage, '', { animate: false });
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
}
