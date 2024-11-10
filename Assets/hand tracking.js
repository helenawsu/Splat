// @input SceneObject visualSceneObject
// @input Component.HandTracking3DAsset rightHand
const SIK = require('SpectaclesInteractionKit/SIK').SIK;
const handInputData = SIK.HandInputData;
var isGun = false;
var visualSceneObject = script.visualSceneObject;

function onAwake() {
  // Wait for other components to initialize by deferring to OnStartEvent.
  script.createEvent('OnStartEvent').bind(() => {
    onStart();
  });
  script.createEvent('UpdateEvent').bind(() => {
    onUpdate();
  });
}

function onStart() {
  // Fetch the TrackedHand for left and right hands.
  var leftHand = handInputData.getHand('left');
  var rightHand = handInputData.getHand('right');
  const objectTracking3DComponent = script.sceneObject.createComponent(
    'Component.ObjectTracking3D'
  );
  objectTracking3DComponent.trackingAsset = script.rightHand;
  objectTracking3DComponent.addAttachmentPoint(
    'index-3_end_end_end',
    script.visualSceneObject
  );
  // Add print callbacks for whenever these hands pinch.
  // leftHand.onPinchDown.add(() => {
  //   print(
  //     `The left hand has pinched. The tip of the left index finger is: ${leftHand.indexTip.position}.`
  //   );
  // });
  // rightHand.onPinchDown.add(() => {
  //   print(
  //     `The right hand has pinched. The tip of the right index finger is: ${rightHand.indexTip.position}.`
  //   );
  // });
}
function onUpdate() {
  print("updating");

  this.primaryInteractor =
     SIK.InteractionManager.getTargetingInteractors().shift();
     let handInputData = SIK.HandInputData;


     // Fetch the TrackedHand for left and right hands.
     let leftHand = handInputData.getHand('left');
     let rightHand = handInputData.getHand('right');
     const index_tip_pos = rightHand.indexTip.position;
     // const index_tip_rot = rightHand.indexTip.rotation;
     const thumb_tip_pos = rightHand.thumbTip.position;
     // const thumb_tip_rot = rightHand.thumbTip.rotation;
     const palm_pos = rightHand.getPalmCenter();
     const mid_pos = rightHand.middleTip.position;
     if (palm_pos != null)


     {
       // print("all distance registered")
       const dist = calculateDistance(index_tip_pos, thumb_tip_pos);
     const dist2 = calculateDistance(palm_pos, mid_pos);
     // print(
     //   `palm mid fing distance. The distance between thumb and index pos is: ${dist2}.`
     // );
       if (dist > 6.5 && dist2 < 4) {
         if (!isGun) {
           isGun = true;
           enterGun();
         }
           // register as a hand gun gesture
           // print(
           //     `making a gun. The distance between thumb and index pos is: ${dist}.`
           //   );
           //     this.objectTracking3DComponent = this.sceneObject.createComponent(
           //       'Component.ObjectTracking3D'
           //     );
           //     this.objectTracking3DComponent.trackingAsset = this.rightHand;
           //     this.objectTracking3DComponent.addAttachmentPoint(
           //       'index-0',
           //       this.visualSceneObject
           //     );
       } else {
         if( isGun){
         isGun = false;
         exitGun();
         }
        }
}}
script.getIsGun = function() {
  return isGun;
}
script.getIndexPos = function() {
  SIK.InteractionManager.getTargetingInteractors().shift();
  let handInputData = SIK.HandInputData;
  let rightHand = handInputData.getHand('right');
  return  rightHand.indexTip.position;
}
onAwake();
function enterGun() {
  visualSceneObject.enabled = true;
  print(
    `making a gun.`
  );


   
}
function exitGun() {
  print("exiting gun");


// Hide the cube explicitly
visualSceneObject.enabled = false;
}
function   calculateDistance(vecA, vecB) {
  const dx = vecB.x - vecA.x;
  const dy = vecB.y - vecA.y;
  const dz = vecB.z - vecA.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}