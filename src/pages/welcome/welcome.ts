import { Component } from '@angular/core';
import { IonicPage, NavController, ToastController } from 'ionic-angular';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';
import { Storage } from '@ionic/storage';

import { TabsPage } from './../tabs/tabs';

@IonicPage()
@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {

  responseData: any;
  userData = { "email": "", "password": "" };

  constructor(public navCtrl: NavController, public authService: AuthServiceProvider, public toastCtrl: ToastController, public storage: Storage) {

  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad WelcomePage');
  }

  login() {
    this.authService.postData(this.userData, 'login').then((result) => {
      this.responseData = result;
      //console.log(this.responseData);
      let status = this.responseData.status;
      if (status == 'ok') {
        this.storage.set('_1_sesionData', JSON.stringify(this.responseData.sesionData));
        this.storage.set('_2_userData', JSON.stringify(this.responseData.userData));
        this.userData = { "email": "", "password": "" };  // limpio los inputs
        this.navCtrl.push(TabsPage, {}, {animate:false});
      }
      else {
        this.showToast(this.responseData.error.text, "error");
        //console.log(this.responseData.error);
      }
    }, (err) => {
      // Connection failed message
      this.showToast("Error de conexion", "error");
    });
  }

  showToast(mensaje, tipo){
    let toast = this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      //showCloseButton: true,
      //closeButtonText: 'cerrar',
      cssClass: tipo
    });
    toast.present();
  }
}
