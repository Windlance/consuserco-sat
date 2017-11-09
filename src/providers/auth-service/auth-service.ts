import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { App } from 'ionic-angular';
import 'rxjs/add/operator/map';

@Injectable()
export class AuthServiceProvider {

  private apiUrl: string = 'http://consuserco.cora3.es/recursos/apis/sat/';
  //private apiUrl: string = 'http://localhost:8080/recursos/apis/sat/';

  constructor(public http: Http, public app: App) {
    //console.log('Hello AuthServiceProvider Provider');
  }

  postData(credentials, type) {
    return new Promise((resolve, reject) => {
      let headers = new Headers();

      this.http.post(this.apiUrl + type, JSON.stringify(credentials), {headers: headers})
        .subscribe(res => {
          resolve(res.json());
        }, (err) => {
          reject(err);
        });
    });
  }
}
