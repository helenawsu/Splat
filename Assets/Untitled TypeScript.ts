// import { NewScript2 } from "World Module";

// @component
// export class ExampleHandVisualizationScript extends BaseScriptComponent {
//   @input()
//   world_module : ScriptComponent;
//   @input()
//   visualSceneObject: SceneObject;

//   @input()
//   rightHand: HandTracking3DAsset;

//   private objectTracking3DComponent: ObjectTracking3D;

//   onAwake() {

//     print(this.world_module.isGun);
//     this.objectTracking3DComponent = this.sceneObject.createComponent(
//       'Component.ObjectTracking3D'
//     );
//     this.objectTracking3DComponent.trackingAsset = this.rightHand;
//     this.objectTracking3DComponent.addAttachmentPoint(
//       'index-3',
//       this.visualSceneObject
//     );
//   }
//   enterGun() {
//     this.visualSceneObject.enabled = true;
//     print(
//       `making a gun.`
//     );

     
//   }
//   exitGun() {
//     print("exiting gun");
 
//   // Hide the cube explicitly
//   this.visualSceneObject.enabled = false;
//   }
// }