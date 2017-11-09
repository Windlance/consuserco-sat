import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';

import { TabsPage } from './../tabs/tabs';

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  responseData: any;
  userData = { "email": "", "password": "" };

  constructor(public navCtrl: NavController, public authService: AuthServiceProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  login() {
    this.authService.postData(this.userData, 'login').then((result) => {
      this.responseData = result;
      console.log(this.responseData);
      localStorage.setItem('userData', JSON.stringify(this.responseData));
      this.navCtrl.push(TabsPage, {}, {animate:false});
    }, (err) => {
      // Connection failed message
      console.log("Error de conexion");
    });
  }
}
