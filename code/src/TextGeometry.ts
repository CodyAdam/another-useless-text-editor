import * as THREE from 'three';

export class TextGeometry extends THREE.ExtrudeGeometry {

  constructor( text: string, parameters : any= {} ) {

    const font = parameters.font;

    if ( font === undefined ) {

      super(); // generate default extrude geometry

    } else {

      const shapes = font.generateShapes( text, parameters.size ); // translate parameters to THREE.ExtrudeGeometry API

      parameters.depth = parameters.height !== undefined ? parameters.height : 50; // defaults

      if ( parameters.bevelThickness === undefined ) parameters.bevelThickness = 10;
      if ( parameters.bevelSize === undefined ) parameters.bevelSize = 8;
      if ( parameters.bevelEnabled === undefined ) parameters.bevelEnabled = false;
      super( shapes, parameters );

    }

    this.type = 'TextGeometry';

  }

}