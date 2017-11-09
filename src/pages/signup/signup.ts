import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { AuthServiceProvider } from './../../providers/auth-service/auth-service';

import { TabsPage } from '../tabs/tabs';
import { LoginPage } from './../login/login';

/**
 * Generated class for the SignupPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage {
  responseData: any;
  userData = { "username": "", "password": "", "name": "", "email": "" };

  constructor(public navCtrl: NavController, public authService: AuthServiceProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SignupPage');
  }

  signup() {
    this.authService.postData(this.userData, 'signup').then((result) => {
      this.responseData = result;
      console.log(this.responseData);
      localStorage.setItem('userData', JSON.stringify(this.responseData));
      this.navCtrl.push(TabsPage);
    }, (err) => {
      // Connection failed message
    });
  }

  login() {
    //Login page link
    this.navCtrl.push(LoginPage);
  }
}
