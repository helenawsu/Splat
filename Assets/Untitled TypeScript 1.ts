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

  @input
  targetObject: SceneObject;

  @input
  filterEnabled: boolean;
    
  @input
  audio: AudioComponent;

  onAwake() {

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

      if (
        this.primaryInteractor.previousTrigger !== InteractorTriggerType.None &&
        this.primaryInteractor.currentTrigger === InteractorTriggerType.None
      ) {

        print("spawned bug");

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
      }
    }
  }

  onUpdate() {

    this.tick++;
    if (this.tick % 100)
        return;
    
    print(this.tick)

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

    // Assuming vec3 is a class with x, y, z properties
    function subtractVectors(v1, v2) {
        return new vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    function normalizeVector(v) {
        var length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return new vec3(v.x / length, v.y / length, v.z / length);
    }

    // Usage
    const rayStart = rayStartOffset;
    const rayEnd = this.primaryInteractor.endPoint;
    const playerDir = normalizeVector(subtractVectors(rayEnd, rayStart));

    // Generate a random direction vector and normalize it
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;
    const randomDir = new vec3(x, y, z).normalize();

    const dotProduct = playerDir.dot(randomDir);
    const isOppositeDirection = dotProduct < 0;

    var bugSpawnDir = randomDir;

    // try to spawn bug behind player
    const bugSpawnEnd = rayEnd.add(bugSpawnDir);

      this.hitTestSession.hitTest(
        rayStart,
        bugSpawnEnd,
        this.onHitTestResult.bind(this)
      );
      
    } else {
      this.targetObject.enabled = false;
    }
  }
}