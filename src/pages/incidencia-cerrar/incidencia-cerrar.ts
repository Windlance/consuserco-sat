import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
//import { FormControl } from '@angular/forms';

import { Storage } from '@ionic/storage';

import { SignaturePad } from 'angular2-signaturepad/signature-pad';

//import { IncidenciasPage } from './../incidencias/incidencias';

@IonicPage()
@Component({
  selector: 'page-incidencia-cerrar',
  templateUrl: 'incidencia-cerrar.html'
})
export class IncidenciaCerrarPage {

  debug: boolean = true;       // Debug flag

  id: any;
  incidencia = {'id':'', 
    'numeracion':'', 'establecimiento':'', 'maquina':{'modelo':'','fabricante':''}, 'direccion':'', 'poblacion':'', 'provincia':'', 'cp':'', 
    'horario':'', 'telefono':'', 'geo':{'longitud':null, 'latitud':null}, 'tipos':[], 'descripcion':'', 'prioridad':{'desc':'','val':null,'marker':''}, 'estado':null
  };

  _abiertas = {'urgentes':[], 'altas':[], 'normales':[], 'bajas':[]};
  _cerradas = [];

  sesionData = { "key1": "", "key2": "" };
  
  @ViewChild('signupSlider') signupSlider: any;

  slideOneForm: FormGroup;
  slideTwoForm: FormGroup;

  aFirmarAttempt: boolean = false;
  aCerrarIncidenciaAttempt: boolean = false;

  @ViewChild(SignaturePad) public signaturePad : SignaturePad;
  public signaturePadOptions : Object = {       // https://github.com/szimek/signature_pad
  };
  public signatureImage : string;
  isDrawing = false;

  /**
    * Constructor
    * 
    */
  constructor(public navCtrl: NavController, public navParams: NavParams, public formBuilder: FormBuilder, public toastCtrl: ToastController, 
              public storage: Storage) {
    this.id = navParams.get('id');
    let scope = this;
    
    scope.consola('CERRAR CONSTRUCTOR');

    scope.consola('    LOADING ... ');
    // Slide 1
    scope.slideOneForm = scope.formBuilder.group({
      observaciones: [''],
      revision: ['false'],
      email: ['', Validators.compose([Validators.minLength(5), Validators.pattern('[a-zA-Z0-9_\.\+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+')])]
    });
    scope.consola('        Slide1 created ...');

    // Slide 2
    scope.slideTwoForm = scope.formBuilder.group({
      firma: ['', Validators.required]
    });
    scope.consola('        Slide2 created ...');

    let promises = [];

    promises.push(
      scope.storage.get('incidencia-'+scope.id)
      .then(data => {
        scope.consola('        Incidencia '+scope.id+' loaded ...');
        if (data != null)  {
          scope.incidencia = JSON.parse(data);
        }
      })
    );

    promises.push(
      scope.storage.get('_1_sesionData')
      .then(data => {
        scope.consola('        Sesion data loaded ...');
        if (data != null)  {
          scope.sesionData = JSON.parse(data);
        }
      })
    );

    promises.push(
      scope.storage.get('_abiertas')
      .then(data => {
        scope.consola('        _abiertas loaded ...');
        if (data != null)  {
          scope._abiertas = JSON.parse(data);
        }
      })
    );

    promises.push(
      scope.storage.get('_cerradas')
      .then(data => {
        scope.consola('        _cerradas loaded ...');
        if (data != null)  {
          scope._cerradas = JSON.parse(data);
        }
      })
    );

    Promise.all(promises).then(() => {
      scope.consola('    LOADED!');
    });
  }

  ionViewDidLoad() {
    this.consola('CERRAR LOAD');
    this.signupSlider.enableKeyboardControl(false);   // Disable slider with keyboard 
    this.signupSlider.lockSwipes(true);               // Block slides by default
  }

  ionViewDidEnter() {
    this.consola('CERRAR ENTER');
    this.signaturePad.clear();
  }

  aFirmar(){
    this.aFirmarAttempt = true;

    if(this.slideOneForm.valid){
      this.signupSlider.lockSwipes(false);   // unblock slides
      this.signupSlider.slideNext();         // move to next
      this.signupSlider.lockSwipes(true);    // block slides
    }
  }
  
  drawComplete() {
    this.isDrawing = false;
    this.signatureImage = this.signaturePad.toDataURL();  // Save image in local variable
  }
 
  drawStart() {
    this.isDrawing = true;
  }
  
  drawClear() {
    this.signaturePad.clear();
    this.signatureImage = '';
  }

  cerrarIncidencia(){
    let scope = this;

    scope.aCerrarIncidenciaAttempt = true;
    
    if (!scope.slideOneForm.valid) {
      scope.signupSlider.lockSwipes(false);   // unblock
      scope.signupSlider.slideTo(0);           // move
      scope.signupSlider.lockSwipes(true);    // block
    }
    else if (!scope.signatureImage) {  // como estamos en el slide2, no hacemos nada
      //scope.signupSlider.lockSwipeToNext(false);  // unblock
      //scope.signupSlider.slideTo(0);              // move
      //scope.signupSlider.lockSwipeToNext(true);   // block
    }
    else {
      scope.consola('---- CIERRE INICIADO');

      let promises = [];

      // save data in server
      //scope.consola(scope.signatureImage);
      //scope.consola(scope.slideOneForm.value);
      //scope.consola(scope.slideTwoForm.value);

      // update local storage
      scope.incidencia.estado = 4;                     // Cerrada
      let data = JSON.stringify(scope.incidencia);
      promises.push(
        scope.storage.set('incidencia-'+scope.id, data)
        .then(() => {
          //scope.consola('incidencia updated and saved in storage');
          //scope.consola(scope.incidencia);
        })
      );

      // Select priority array (one of the four) depending on incidencia's priority
      let arrayIndices = [];
      switch (scope.incidencia.prioridad.val) {
        case 0: arrayIndices = scope._abiertas.bajas; break;         // baja
        case 1: arrayIndices = scope._abiertas.normales; break;      // normal
        case 2: arrayIndices = scope._abiertas.altas; break;         // alta
        case 3: arrayIndices = scope._abiertas.urgentes; break;      // urgente
      }

      // Add incidencia to array _cerradas, and save it in local storage
      if (scope._cerradas.indexOf(scope.id) === -1) {    // if is not already in _cerradas... add it
        scope._cerradas.push(scope.id);
        promises.push(
          scope.storage.set('_cerradas', JSON.stringify(this._cerradas))
          .then(() => {
            scope.consola('         _cerradas updated and saved in storage');
          })
        );
      }

      // Remove incidencia from array _abiertas, and save it in local storage
      let index = arrayIndices.indexOf(this.id);
      if (index !== -1) {                     // if exists in _abiertas... remove it
        arrayIndices.splice(index, 1);        // As we do this once only, no problem with indexes using splice 
        promises.push(
          scope.storage.set('_abiertas', JSON.stringify(this._abiertas))
          .then(() => {
            scope.consola('         _abiertas updated and saved in storage');
          })
        );
      }

      Promise.all(promises).then(() => {
        scope.consola('         '+this.id+' cerrada');
        scope.consola('---- CIERRE COMPLETO');
        scope.showToast("Incidencia cerrada", "success");
        scope.navCtrl.popToRoot();          // back to root (incidencias page list)
      });
    }
  }

  /**
    * Constructor
    * @param mensaje A String value that contains the message to show in toast
    * @param tipo A String value that contains the type: 'error', 'info', 'success' or 'warning'.
    */
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
