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

  @input
  targetObject: SceneObject;

  @input
  filterEnabled: boolean;
    
  @input
  audio: AudioComponent;

  onAwake() {
    // create new hit session
    this.hitTestSession = this.createHitTestSession(this.filterEnabled);
    if (!this.sceneObject) {
      print('Please set Target Object input');
      return;
    }
    this.transform = this.targetObject.getTransform();
    // disable target object when surface is not detected
    this.targetObject.enabled = false;

    //this.audio.playbackMode = Audio.PlaybackMode.LowLatency;
    this.audio.playbackMode = Audio.PlaybackMode.LowPower;

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

      if (
        this.primaryInteractor.previousTrigger !== InteractorTriggerType.None &&
        this.primaryInteractor.currentTrigger === InteractorTriggerType.None
      ) {

        print("blah");

        // Called when a trigger ends
        // Copy the plane/axis object
        this.audio.spatialAudio.enabled = true;
        this.audio.spatialAudio.positionEffect.enabled = true;
        //this.audio.spatialAudio.positionEffect.effectType = Audio.PositionEffectType.Directional;
        //this.audio.spatialAudio. = this.targetObject.getTransform().getWorldPosition();
        this.audio.play(1); // Play the sound once

        //this.audio.fadeOutTime = 1;
        //this.audio.stop(true);  // true for fade out
        print("cube created");
        //                      print(
        //        `The left hand has pinched. The tip of the left index finger is: ${this.hi.hand.indexTip.position}.`
        //      );
        this.sceneObject.copyWholeHierarchy(this.targetObject);
      }
    }
  }
  calculateDistance(vecA, vecB) {
    const dx = vecB.x - vecA.x;
    const dy = vecB.y - vecA.y;
    const dz = vecB.z - vecA.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
  onUpdate() {
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
      const rayStartOffset = new vec3(
        this.primaryInteractor.startPoint.x,
        this.primaryInteractor.startPoint.y,
        this.primaryInteractor.startPoint.z + 30
      );
      const rayStart = rayStartOffset;
      const rayEnd = this.primaryInteractor.endPoint;

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