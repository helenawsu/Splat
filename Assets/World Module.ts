// import required modules
const WorldQueryModule = require('LensStudio:WorldQueryModule');
// const SIK = require('SpectaclesInteractionKit/SIK').SIK;
const InteractorTriggerType =
  require('SpectaclesInteractionKit/Core/Interactor/Interactor').InteractorTriggerType;
const InteractorInputType =
  require('SpectaclesInteractionKit/Core/Interactor/Interactor').InteractorInputType;
const EPSILON = 0.01;
import { HandInteractor } from "SpectaclesInteractionKit/Core/HandInteractor/HandInteractor";
import { SIK } from './SpectaclesInteractionKit/SIK';


@component
export class NewScript extends BaseScriptComponent {
  private primaryInteractor;
  private hitTestSession;
  private transform: Transform;
  private tick;
  private soundCooldown;
  private targetObject: SceneObject;
  private splatSFX: AudioComponent;
  private lastPitches: number[] = [];
  private lastStrengths: number[] = [];
  private MAX_LENGTH = 20;

  @input
  splatObject1: SceneObject;
  @input
  splatObject2: SceneObject;
  @input
  splatObject3: SceneObject;
  @input
  splatObject4: SceneObject;
  @input
  splatObject5: SceneObject;
  @input
  splatObject6: SceneObject;

  @input
  splatSFX1: AudioComponent;
  @input
  splatSFX2: AudioComponent;
  @input
  splatSFX3: AudioComponent;
  @input
  splatSFX4: AudioComponent;
  private prevSFXIndex: number;

  @input
  filterEnabled: boolean;
    
  @input
  audioAnalyzer: ScriptComponent;
  
  @input
  handTracking: ScriptComponent;


  insertAtFront(value: number, arr: number[]) {
    // Insert the new element at the front
    arr.unshift(value);

    // If the array exceeds the max length, remove the last element
    if (arr.length > this.MAX_LENGTH) {
        arr.pop();
    }
  }


  getRandomSplatObject() {
    // Generate a random integer between 1 and 6
    const randomIndex = Math.floor(Math.random() * 6) + 1;

    // Return the corresponding splat object based on the random number
    switch (randomIndex) {
        case 1:
            return this.splatObject1;
        case 2:
            return this.splatObject2;
        case 3:
            return this.splatObject3;
        case 4:
            return this.splatObject4;
        case 5:
            return this.splatObject5;
        case 6:
            return this.splatObject6;
        default:
            return this.splatObject1; // Fallback in case of any issues
    }
  }

  getRandomSplatSFX() {
    // Generate a random integer between 1 and 4
    var randomIndex = Math.floor(Math.random() * 4) + 1;
    
    if (randomIndex === this.prevSFXIndex) {
      randomIndex = (randomIndex + 1) % 4;

    this.prevSFXIndex = randomIndex;

    // Return the corresponding splat sound effect based on the random number
    switch (randomIndex) {
        case 0:
            return this.splatSFX1;
        case 1:
            return this.splatSFX2;
        case 2:
            return this.splatSFX3;
        case 3:
            return this.splatSFX4;
        default:
            return this.splatSFX1; // Fallback in case of any issues
      }
    }
  }

  onAwake() {

    this.soundCooldown = 0;
    this.targetObject = this.getRandomSplatObject();
    this.splatSFX = this.getRandomSplatSFX();

    this.tick = 0;

    // create new hit session
    this.hitTestSession = this.createHitTestSession(this.filterEnabled);
    if (!this.sceneObject) {
      print('Please set Target Object input');
      return;
    }
    this.transform = this.targetObject.getTransform();
    // disable target object when surface is not detected
    this.targetObject.enabled = false;

    // init sound effects
    
    this.splatSFX1.playbackMode = Audio.PlaybackMode.LowLatency;
    this.splatSFX2.playbackMode = Audio.PlaybackMode.LowLatency;
    this.splatSFX3.playbackMode = Audio.PlaybackMode.LowLatency;
    this.splatSFX4.playbackMode = Audio.PlaybackMode.LowLatency;
    this.splatSFX1.spatialAudio.enabled = true;
    this.splatSFX2.spatialAudio.enabled = true;
    this.splatSFX3.spatialAudio.enabled = true;
    this.splatSFX4.spatialAudio.enabled = true;
    this.splatSFX1.spatialAudio.positionEffect.enabled = true;
    this.splatSFX2.spatialAudio.positionEffect.enabled = true;
    this.splatSFX3.spatialAudio.positionEffect.enabled = true;
    this.splatSFX4.spatialAudio.positionEffect.enabled = true;
    this.splatSFX1.spatialAudio.directivityEffect.enabled = true;
    this.splatSFX2.spatialAudio.directivityEffect.enabled = true;
    this.splatSFX3.spatialAudio.directivityEffect.enabled = true;
    this.splatSFX4.spatialAudio.directivityEffect.enabled = true;
    
    //this.audio.playbackMode = Audio.PlaybackMode.LowPower;

    // create update event
    this.createEvent('UpdateEvent').bind(this.onUpdate.bind(this));
  }

  createHitTestSession(filterEnabled) {
    // create hit test session with options
    var options = HitTestSessionOptions.create();
    options.filter = filterEnabled;

    var session = WorldQueryModule.createHitTestSessionWithOptions(options);
    return session;
  }

  onHitTestResult(results) {

    if (results === null) {
      this.targetObject.enabled = false;
    } else {
            
      this.targetObject.enabled = true;
      // get hit information
      const hitPosition = results.position;
      const hitNormal = results.normal;

      //identifying the direction the object should look at based on the normal of the hit location.

      var lookDirection;
      if (1 - Math.abs(hitNormal.normalize().dot(vec3.up())) < EPSILON) {
        lookDirection = vec3.forward();
      } else {
        lookDirection = hitNormal.cross(vec3.up());
      }

      const toRotation = quat.lookAt(lookDirection, hitNormal);
      //set position and rotation
      this.targetObject.getTransform().setWorldPosition(hitPosition);
      this.targetObject.getTransform().setWorldRotation(toRotation);
      var SCALE = 30;
      this.targetObject.getTransform().setWorldScale(new vec3(SCALE, SCALE, SCALE));
      var strength = (this.audioAnalyzer as any).getStrength();
      print(this.soundCooldown);
      print("sssttrrreeennngtthhhh"+ strength);
      // if (
      //   strength > 0.6 && this.soundCooldown < 0
      // ) 
      if (
        this.primaryInteractor.previousTrigger !== InteractorTriggerType.None &&
        this.primaryInteractor.currentTrigger === InteractorTriggerType.None
      )
      {
        this.splatSFX = this.getRandomSplatSFX();


        // init sound effects
        this.splatSFX1.play(1); // Play the sound once
        this.soundCooldown = 20;
        
        // Called when a trigger ends
        // Copy the plane/axis object
        this.sceneObject.copyWholeHierarchy(this.targetObject);
        this.targetObject = this.getRandomSplatObject();
        this.splatSFX = this.getRandomSplatSFX();
      }
    }
  }

  calculateDistance(vecA, vecB) {
    const dx = vecB.x - vecA.x;
    const dy = vecB.y - vecA.y;
    const dz = vecB.z - vecA.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
  
  hueFloatToHsv(hue) {
    return {"h": hue, "s": 1, "v": 1}
    //return new vec4(, , , 1);
    // return new vec4(x % 255 / 255, x / 255 % 255 / 255, x / (255 * 255) % 255 / 255, 10);
  }
    
  hsvToRgb(hsv) { 
    var r, g, b, i, f, p, q, t, s, v, h;
    print(hsv)
    if (hsv) {
        s = hsv.s, v = hsv.v, h = hsv.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
        
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
        
    return new vec4(r, g, b, 1)
  }
  
  onUpdate() {

    this.tick++;
    this.soundCooldown--;

    this.primaryInteractor =
      SIK.InteractionManager.getTargetingInteractors().shift();
      // let handInputData = SIK.HandInputData;

      // // Fetch the TrackedHand for left and right hands.
      // let leftHand = handInputData.getHand('left');
      // let rightHand = handInputData.getHand('right');
      // const index_tip_pos = rightHand.indexTip.position;
      // const index_tip_rot = rightHand.indexTip.rotation;
      // const thumb_tip_pos = rightHand.thumbTip.position;
      // const thumb_tip_rot = rightHand.thumbTip.rotation;
      // const palm_pos = rightHand.getPalmCenter();
      // const mid_pos = rightHand.middleTip.position;
      // if (palm_pos != null)

      // {
      //   print("all distance registered")
      //   const dist = this.calculateDistance(index_tip_pos, thumb_tip_pos);
      // const dist2 = this.calculateDistance(palm_pos, mid_pos);
      // // print(
      // //   `palm mid fing distance. The distance between thumb and index pos is: ${dist2}.`
      // // );
      //   if (dist > 6.5 && dist2 < 4) {
      //       // register as a hand gun gesture
      //       print(
      //           `making a gun. The distance between thumb and index pos is: ${dist}.`
      //         );
      //   }
      // }
    if (
      this.primaryInteractor &&
      this.primaryInteractor.isActive() &&
      this.primaryInteractor.isTargeting()
    ) {
      const strength = (this.audioAnalyzer as any).getStrength();
      const hue_float = (this.audioAnalyzer as any).getHue();
            
      this.insertAtFront(strength, this.lastStrengths);
      this.insertAtFront(hue_float, this.lastPitches);

      var avgStrength = 0;
      var avgHue = 0;
      for (let i = 0; i < this.lastStrengths.length; i++) {
        avgStrength += this.lastStrengths[i];
        avgHue += this.lastPitches[i];
      }

      avgStrength /= this.lastStrengths.length;
      avgHue /= this.lastPitches.length;

      var hsv = this.hueFloatToHsv(avgHue);
      var color = this.hsvToRgb(hsv);

      // desaturate color if strength is low
      const THRESHOLD = 0.25;
      if (avgStrength < THRESHOLD) {
          var white = { r: 1, g: 1, b: 1, a: 1 };
          var t = avgStrength / THRESHOLD;

          // Interpolate each component of the color between white and the target color
          color = new vec4(
              white.r + (color.r - white.r) * t,
              white.g + (color.g - white.g) * t,
              white.b + (color.b - white.b) * t,
              white.a  // Keep alpha at 1
          );
      }


      
      //if (strength > 0)
      {
        //const hue = this.hsvToRgb(this.hueFloatToHsv(hue_float));
        var preVisual = this.targetObject.getComponent("Component.RenderMeshVisual");
        var newMat = preVisual.mainMaterial.clone(); 
        newMat.mainPass.baseColor = color; 
        preVisual.mainMaterial = newMat;
      }            
            
     const rayStartOffset = new vec3(
        this.primaryInteractor.startPoint.x,
        this.primaryInteractor.startPoint.y,
        this.primaryInteractor.startPoint.z + 30
      );
      const rayStart = rayStartOffset;
      const rayEnd = this.primaryInteractor.endPoint;
      // var indexpos = (this.handTracking as any).getIndexPos();
      this.hitTestSession.hitTest(
        rayStart,
        rayEnd,
        this.onHitTestResult.bind(this)
      );
        } else {
      this.targetObject.enabled = false;
    }
  }
}