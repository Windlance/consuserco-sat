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

  id: any;
  incidencia: any;
  numeracion: any;
  establecimiento: any;
  fabricante: any;
  modelo:any;
  prioridad: any;

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

  constructor(public navCtrl: NavController, public navParams: NavParams, public formBuilder: FormBuilder, public toastCtrl: ToastController, 
              public storage: Storage) {
    this.id = navParams.get('id');
    
    storage.get('incidencia-'+this.id).then(data => {
      if (data != null)  {
        this.incidencia = JSON.parse(data);
        this.numeracion = this.incidencia.numeracion;
        this.establecimiento = this.incidencia.establecimiento;
        this.fabricante = this.incidencia.maquina.fabricante;
        this.modelo = this.incidencia.maquina.modelo;
        this.prioridad = this.incidencia.prioridad.val;
      }
    });

    storage.get('_1_sesionData').then(data => {
      if (data != null)  {
        this.sesionData = JSON.parse(data);
      }
    });

    storage.get('_abiertas').then(data => {
      if (data != null)  {
        this._abiertas = JSON.parse(data);
      }
    });

    storage.get('_cerradas').then(data => {
      if (data != null)  {
        this._cerradas = JSON.parse(data);
      }
    });

    /* Ejemplo
    this.myForm = formBuilder.group({
      firstName: ['value'],
      lastName: ['value', *validation function goes here*],
      age: ['value', *validation function goes here*, *asynchronous validation function goes here*]
    });
    */

    this.slideOneForm = formBuilder.group({
      observaciones: [''],
      revision: ['false'],
      email: ['', Validators.compose([Validators.minLength(5), Validators.pattern('[a-zA-Z0-9_\.\+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+')])]
      //email: ['', Validators.compose([Validators.minLength(5), Validators.pattern('[a-zA-Z0-9_\.\+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+'), Validators.required])]
    });

    this.slideTwoForm = formBuilder.group({
      firma: ['', Validators.required]
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IncidenciaCerrarPage');
    this.signupSlider.enableKeyboardControl(false);
    this.signupSlider.lockSwipes(true);
  }

  ionViewDidEnter() {
    this.signaturePad.clear();
  }

  aFirmar(){
    this.aFirmarAttempt = true;

    if(this.slideOneForm.valid){
      this.signupSlider.lockSwipes(false);   // unblock
      this.signupSlider.slideNext();         // move
      this.signupSlider.lockSwipes(true);    // block
    }
  }
  
  drawComplete() {
    this.isDrawing = false;
    this.signatureImage = this.signaturePad.toDataURL();  // Guardamos la imagen en nuesra variable local
  }
 
  drawStart() {
    this.isDrawing = true;
  }
  
  drawClear() {
    this.signaturePad.clear();
    this.signatureImage = '';
  }

  cerrarIncidencia(){
    this.aCerrarIncidenciaAttempt = true;
    
      if(!this.slideOneForm.valid){
        this.signupSlider.lockSwipes(false);   // unblock
        this.signupSlider.slideTo(0);               // move
        this.signupSlider.lockSwipes(true);    // block
      }
      else if(!this.signatureImage){  // como estamos en el slide2, no hacemos nada
        //this.signupSlider.lockSwipeToNext(false);  // unblock
        //this.signupSlider.slideTo(0);              // move
        //this.signupSlider.lockSwipeToNext(true);   // block
      }
      else {
        console.log("success!");
        console.log(this.signatureImage);
        console.log(this.slideOneForm.value);
        console.log(this.slideTwoForm.value);

        let promises = [];

        // save data in server


        // update local storage
        this.incidencia.estado = 4;                     // Cerrada
        let data = JSON.stringify(this.incidencia);
        this.storage.set('incidencia-'+this.id, data);

        let arrayIndices;
        switch (this.prioridad) {
          case 0: arrayIndices = this._abiertas.bajas; break;         // baja
          case 1: arrayIndices = this._abiertas.normales; break;      // normal
          case 2: arrayIndices = this._abiertas.altas; break;         // alta
          case 3: arrayIndices = this._abiertas.urgentes; break;      // urgente

        }
        if (this._cerradas.indexOf(this.id) === -1) {    // la añado a cerradas
          this._cerradas.push(this.id);
          this.storage.set('_cerradas', JSON.stringify(this._cerradas));
        }
        let index = arrayIndices.indexOf(this.id);
        if (index !== -1) {                              // la quito de abiertas
          arrayIndices.splice(index, 1);
          this.storage.set('_abiertas', JSON.stringify(this._abiertas));
        }

        Promise.all(promises).then(() => {
          this.showToast("Incidencia Cerrada", "success");
          this.navCtrl.popToRoot();          // al listado de incidencias
        });
      }
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
