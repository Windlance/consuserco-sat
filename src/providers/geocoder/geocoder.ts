import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

import { NativeGeocoder, NativeGeocoderReverseResult, NativeGeocoderForwardResult } from '@ionic-native/native-geocoder';

@Injectable()
export class GeocoderProvider {

  constructor(public http: Http, private nativeGeocoder  : NativeGeocoder) {
    console.log('Hello GeocoderProvider Provider');
  }


  /**
   *
   * Perform reverseGeocoding operation and return address details
   *
   * @public
   * @method reverseGeocode
   * @return {Promise}
   *
   */ 
  reverseGeocode(lat : number, lng : number) : Promise<any>  {
    return new Promise((resolve, reject) => {
      this.nativeGeocoder.reverseGeocode(lat, lng)
      .then((result : NativeGeocoderReverseResult) => {
          let str : string   = `The reverseGeocode address is ${JSON.stringify(result)}`;
          resolve(str);
      }).catch((error: any) => {
          console.log(error);
          reject(error);
      });
    });
  }
 
  /**
    *
    * Perform forwardGeocode operation and return latitude/longitude details
    *
    * @public
    * @method forwardGeocode
    * @return {Promise}
    *
    */ 
  forwardGeocode(keyword : string) : Promise<any>  {
    return new Promise((resolve, reject) => {
      this.nativeGeocoder.forwardGeocode(keyword)
      .then((coordinates : NativeGeocoderForwardResult) => {
          let str : string   = `The coordinates are latitude=${coordinates.latitude} and longitude=${coordinates.longitude}`;
          resolve(str);
      }).catch((error: any) => {
          console.log(error);
          reject(error);
      });
    });
  }
}
