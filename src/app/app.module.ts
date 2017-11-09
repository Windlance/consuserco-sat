
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { IonicStorageModule } from '@ionic/storage';

import { AuthServiceProvider } from '../providers/auth-service/auth-service';
import { ConnectivityServiceProvider } from './../providers/connectivity-service/connectivity-service';
//import { GeocoderProvider } from '../providers/geocoder/geocoder';

import { WelcomePage } from '../pages/welcome/welcome';
import { TabsPage } from '../pages/tabs/tabs';
import { IncidenciasPage } from '../pages/incidencias/incidencias';
import { IncidenciaPage } from './../pages/incidencia/incidencia';
import { IncidenciaCerrarPage } from './../pages/incidencia-cerrar/incidencia-cerrar';
import { MapaPage } from "../pages/mapa/mapa";
import { RutasPage } from "../pages/rutas/rutas";
import { ConfiguracionPage } from "../pages/configuracion/configuracion";
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Geolocation } from '@ionic-native/geolocation';
import { Network } from '@ionic-native/network';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { GoogleMaps } from '@ionic-native/google-maps';
//import { GoogleMap, GoogleMapsEvent, Geocoder, BaseArrayClass, GeocoderResult, Marker } from '@ionic-native/google-maps';

import { SignaturePadModule } from 'angular2-signaturepad';

@NgModule({
  declarations: [
    MyApp,
    WelcomePage,
    TabsPage,
    IncidenciasPage,
    IncidenciaPage,
    IncidenciaCerrarPage,
    MapaPage,
    RutasPage,
    ConfiguracionPage,
    AboutPage,
    ContactPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    SignaturePadModule,
    IonicStorageModule.forRoot({
      name: '__Sat_mydb',
         driverOrder: ['indexeddb', 'sqlite', 'websql']
    }),
    //IonicModule.forRoot(MyApp, {mode: 'ios', backButtonText: 'Atrás'})
    IonicModule.forRoot(MyApp, {
      platforms: {
        ios: {
          backButtonText: 'Atrás'
        }
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    WelcomePage,
    TabsPage,
    IncidenciasPage,
    IncidenciaPage,
    IncidenciaCerrarPage,
    MapaPage,
    RutasPage,
    ConfiguracionPage,
    AboutPage,
    ContactPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Network,
    Geolocation,
    GoogleMaps,
    //Geocoder,
    LaunchNavigator,
    AuthServiceProvider,
    ConnectivityServiceProvider,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
