import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the ReverseArrayPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'reverseArray',
  pure: false
})
export class ReverseArrayPipe implements PipeTransform {

  transform(items: Array<any>) {
    if (items) {
      return items.reverse();
    }
  }
}
