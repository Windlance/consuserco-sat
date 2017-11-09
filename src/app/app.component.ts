
import { Component, ViewChild } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { WelcomePage } from '../pages/welcome/welcome';
import { TabsPage } from './../pages/tabs/tabs';

import { Storage } from '@ionic/storage';
import { Nav } from 'ionic-angular';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage: any = null;  // <<< Do not set the root page until the platform.ready()
  
  pages: Array<{ title: string, component: any}>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, 
              public storage: Storage) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // Assign the right page after checking the status
      this.storage.get('_2_userData').then((data) => {
        if (data != null) {
          this.rootPage = TabsPage;
        }
        else {
          this.storage.clear(); // Borramos la base de datos local
          this.rootPage = WelcomePage;
        }
      });
    });
  }

  openPage(page) {
    this.nav.setRoot(page.component);
  }
}
