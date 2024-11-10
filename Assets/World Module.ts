// import required modules
const WorldQueryModule = require('LensStudio:WorldQueryModule');
const SIK = require('SpectaclesInteractionKit/SIK').SIK;
const InteractorTriggerType =
  require('SpectaclesInteractionKit/Core/Interactor/Interactor').InteractorTriggerType;
const InteractorInputType =
  require('SpectaclesInteractionKit/Core/Interactor/Interactor').InteractorInputType;
const EPSILON = 0.01;

@component
export class NewScript extends BaseScriptComponent {
  private primaryInteractor;
  private hitTestSession;
  private transform: Transform;
  private tick;
  private targetObject: SceneObject;

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
  filterEnabled: boolean;
    
  @input
  audio: AudioComponent;


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


  onAwake() {

    this.targetObject = this.getRandomSplatObject();

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
      this.targetObject.getTransform().setWorldScale(new vec3(50, 50, 50));

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
        
        this.sceneObject.copyWholeHierarchy(this.targetObject);
        this.targetObject = this.getRandomSplatObject();
      }
    }
  }

  onUpdate() {

    this.tick++;

    //@input SceneObject targetObject

    var renderMeshVisual = this.targetObject.getComponent("Component.RenderMeshVisual");
    if (renderMeshVisual) {
        var newMaterial = renderMeshVisual.mainMaterial.clone();
        newMaterial.mainPass.baseColor = new vec4(Math.sin(this.tick / 100), 1.0, 1.0, 1.0);
        renderMeshVisual.mainMaterial = newMaterial;
    }

    this.primaryInteractor =
      SIK.InteractionManager.getTargetingInteractors().shift();
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