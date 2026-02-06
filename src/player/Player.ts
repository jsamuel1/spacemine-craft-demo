import * as THREE from 'three';

export class Player {
  position = new THREE.Vector3(8, 20, 30);
  velocity = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  jetpackActive = true;
  magneticBoots = false;
}
