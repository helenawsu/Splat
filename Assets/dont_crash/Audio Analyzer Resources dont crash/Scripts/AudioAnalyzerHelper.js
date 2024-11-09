// AudioAnalyzerHelper.js
// Version 0.1.0
// Event: OnStart
// Allows to set up response to a band value change 

// @input Component.ScriptComponent audioAnalyzerScript {"label" : "Audio Analyzer"}
// @input int bandType = 0 {"label" : "Get Band Value", "widget" : "combobox", "values" : [{"value" : "0", "label" : "By Index"},{"value" : "1", "label" : "Average"}, {"value" : "2", "label" : "All"}]}
// @input int index {"showIf" : "bandType", "showIfValue" : "0", "min" : "0"}
// @ui {"widget" : "separator"}
// @input int smoothType = 0 {"label" : "Smooth Value", "widget" : "combobox", "values" : [{"value" : "0", "label" : "None"}, {"value" : "1", "label" : "Fixed Step"}, {"value" : "2", "label" : "Lerp"}]}
// @input float step = 0.5 {"widget" : "slider", "min" : "0", "max" : "1", "step" : "0.05", "showIf" : "smoothType", "showIfValue" : "1"}
// @input float lerpCoef = 0.5 {"widget" : "slider", "min" : "0.05", "max" : "1", "step" : "0.05", "showIf" : "smoothType", "showIfValue" : "2"}
// @ui {"widget" : "separator"}
// @input int responseType = 0 {"label" : "Response Action", "widget" : "combobox", "values" : [{"value" : "4", "label" : "Call Api Function"}, {"value" : "3", "label" : "Set Material/VFX Parameter"},  {"value" : "0", "label" : "Set Transform"}, {"value" : "2", "label" : "Set Blendshape Weight"}]}


// @ui {"widget":"group_start", "label":"Set Transform", "showIf" : "responseType", "showIfValue" : "0"}
// @input SceneObject transformObject {"label" : "SceneObject"}
// @input string transformType = "Position" {"label" : "Transform", "widget" : "combobox", "values" : [{"value" : "Position", "label" : "Position"},{"value" : "Rotation", "label" : "Rotation"}, {"value" : "Scale", "label" : "Scale"}], "showIf" : "responseType", "showIfValue" : "0"}
// @input bool local
// @ui {"widget" : "separator"}
// @input int transformMode = 0 {"label" : "Mode", "widget" : "combobox", "values" : [{"value" : "0", "label" : "Start/End"},{"value" : "1", "label" : "Offset"}]}
// @input vec3 startVec3Transform = {0, 0, 0} {"label" : "Start", "showIf" : "transformMode", "showIfValue" : "0"}
// @input vec3 endVec3Transform = {1, 1, 1} {"label" : "End", "showIf" : "transformMode", "showIfValue" : "0"}
// @input vec3 offset =  {1, 1, 1} {"label" : "Offset", "showIf" : "transformMode", "showIfValue" : "1"}
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"Set Blendshape", "showIf" : "responseType", "showIfValue" : "2"}
// @input Component.RenderMeshVisual meshWithBlendshapes {"label" : "Mesh Visual"}
// @input string blendshapeName 
// @input float startWeight = 0 {"label" : "Start", "widget" : "slider", "min" : "0", "max" : "1", "step" : "0.05"}
// @input float endWeight = 1 {"label" : "End", "widget" : "slider", "min" : "0", "max" : "1", "step" : "0.05"}
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"Settings", "showIf" : "responseType", "showIfValue" : "3"}
// @input Asset asset {"label" : "VFX or Material"}
// @input string parameter {"label" : "Parameter Name"}

// @ui {"widget" : "separator"}
// @input int assetValueType = 0 {"label" : "Value Type", "widget" : "combobox", "values" : [{"value" : "0", "label" : "Number"},{"value" : "1", "label" : "Vector2"}, {"value" : "2", "label" : "Vector3"}, {"value" : "3", "label" : "Vector4"}, {"value" : "4", "label" : "Color RGB"}, {"value" : "5", "label" : "Color RGBA"}]}
// @input float startAssetFloat = 0 {"showIf" : "valueType", "showIfValue" : "0", "label" : "Start"}
// @input float endAssetFloat = 1 {"showIf" : "valueType", "showIfValue" : "0", "label" : "End"}

// @input vec2 startAssetVec2 = {0, 0} {"showIf" : "valueType", "showIfValue" : "1", "label" : "Start"}
// @input vec2 endAssetVec2 = {1, 1} {"showIf" : "valueType", "showIfValue" : "1", "label" : "End"}

// @input vec3 startAssetVec3 = {0, 0, 0}{"showIf" : "valueType", "showIfValue" : "2", "label" : "Start"}
// @input vec3 endAssetVec3 = {1, 1, 1} {"showIf" : "valueType", "showIfValue" : "2", "label" : "End"}

// @input vec4 startAssetVec4 = {0, 0, 0, 0} {"showIf" : "valueType", "showIfValue" : "3", "label" : "Start"}
// @input vec4 endAssetVec4 = {1, 1, 1, 1} {"showIf" : "valueType", "showIfValue" : "3", "label" : "End"}

// @input vec3 startAssetRGB = {0, 0, 0}{"widget" : "color", "showIf" : "valueType", "showIfValue" : "4", "label" : "Start"}
// @input vec3 endAssetRGB = {1, 1, 1} {"widget" : "color", "showIf" : "valueType", "showIfValue" : "4", "label" : "End"}

// @input vec4 startAssetRGBA = {0, 0, 0, 1} {"widget" : "color", "showIf" : "valueType", "showIfValue" : "5", "label" : "Start"}
// @input vec4 endAssetRGBA = {1, 1, 1, 1} {"widget" : "color", "showIf" : "valueType", "showIfValue" : "5", "label" : "End"}

// @ui {"widget":"label", "label":"                                     Left     Right    Bottom    Top", "showIf" : "valueType", "showIfValue" : "6"}
// @input vec4 startAssetRect = {-1, 1, -1, 1} {"showIf" : "valueType", "showIfValue" : "6", "label" : "Start"}
// @input vec4 endAssetRect = {-1, 1, -1, 1} {"showIf" : "valueType", "showIfValue" : "6", "label" : "End"}
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"Settings", "showIf" : "responseType", "showIfValue" : "4"}
// @input Component.ScriptComponent scriptWithApi {"label" : "Script"}
// @input string functionName = "updateValueFunc" {"label" : "Function Name"}
// @ui {"widget" : "separator"}
// @input int valueType = 0 {"label" : "Value Type", "widget" : "combobox", "values" : [{"value" : "0", "label" : "Number"},{"value" : "1", "label" : "Vector2"}, {"value" : "2", "label" : "Vector3"}, {"value" : "3", "label" : "Vector4"}, {"value" : "4", "label" : "Color RGB"}, {"value" : "5", "label" : "Color RGBA"}]}
// @input float startFloat = 0 {"showIf" : "valueType", "showIfValue" : "0", "label" : "Start"}
// @input float endFloat = 1 {"showIf" : "valueType", "showIfValue" : "0", "label" : "End"}

// @input vec2 startVec2 = {0, 0} {"showIf" : "valueType", "showIfValue" : "1", "label" : "Start"}
// @input vec2 endVec2 = {1, 1} {"showIf" : "valueType", "showIfValue" : "1", "label" : "End"}

// @input vec3 startVec3 = {0, 0, 0}{"showIf" : "valueType", "showIfValue" : "2", "label" : "Start"}
// @input vec3 endVec3 = {1, 1, 1} {"showIf" : "valueType", "showIfValue" : "2", "label" : "End"}

// @input vec4 startVec4 = {0, 0, 0, 0} {"showIf" : "valueType", "showIfValue" : "3", "label" : "Start"}
// @input vec4 endVec4 = {1, 1, 1, 1} {"showIf" : "valueType", "showIfValue" : "3", "label" : "End"}

// @input vec3 startRGB = {0, 0, 0}{"widget" : "color", "showIf" : "valueType", "showIfValue" : "4", "label" : "Start"}
// @input vec3 endRGB = {1, 1, 1} {"widget" : "color", "showIf" : "valueType", "showIfValue" : "4", "label" : "End"}

// @input vec4 startRGBA = {0, 0, 0, 1} {"widget" : "color", "showIf" : "valueType", "showIfValue" : "5", "label" : "Start"}
// @input vec4 endRGBA = {1, 1, 1, 1} {"widget" : "color", "showIf" : "valueType", "showIfValue" : "5", "label" : "End"}

// @ui {"widget":"group_end"}


//helper functions
const DEG_TO_RAD = Math.PI / 180;
var prefix = ["Float", "Vec2", "Vec3", "Vec4", "RGB", "RGBA"];

var analyzer;
var asset;
var bands;

var numBands = 0;

var isArray = script.bandType == 2;
var bandValue;//band value/values
var value; //current value/values

var minValue;
var maxValue;

var transform;
var space;

var updateBand; //update raw band value
var updateValueFunc; // remap to the min value max value
var setResponse; // do something 

function initialize() {
    if (!script.audioAnalyzerScript) {
        print("Warning, Audio Analyzer script input is not set on " + script.getSceneObject().name);
        return false;
    }
    analyzer = script.audioAnalyzerScript.api;
    switch (script.responseType) {
        //set transform
        case 0:
            if (!script.transformObject) {
                print("Warning, Scene Object input is not set on " + script.getSceneObject().name);
                return;
            }
            if (script.bandType == 2) {
                print("Warning, All Bands option is not compatible with Set Transform response, switching to Average " + script.getSceneObject().name);
                script.bandType = 1;
            }
            transform = script.transformObject.getTransform();
            space = script.local ? "Local" : "World";
            if (script.transformType == "Rotation") {
                minValue = script.transformMode == 0 ? quat.fromEulerVec(script.startVec3Transform.uniformScale(DEG_TO_RAD)) : transform["get" + space + script.transformType]();
                maxValue = script.transformMode == 0 ? quat.fromEulerVec(script.endVec3Transform.uniformScale(DEG_TO_RAD)) : quat.fromEulerVec(script.offset.uniformScale(DEG_TO_RAD)).multiply(minValue);
            } else {
                minValue = script.transformMode == 0 ? script.startVec3Transform : transform["get" + space + script.transformType]();
                maxValue = script.transformMode == 0 ? script.endVec3Transform : minValue.add(script.offset);
            }

            setResponse = updateTransform;
            break;
        case 2:
            if (!script.meshWithBlendshapes) {
                print("Warning, Mesh With Blendshapes input is not set on " + script.getSceneObject().name);
                return;
            }
            if (!script.blendshapeName) {

                print("Warning, Please set blendshape name on " + script.meshWithBlendshapes.getSceneObject().name);
                print(script.blendshapeName);
                return;
            }
            if (script.bandType == 2) {
                print("Info, All Bands option is not compatible with Set Blendshape Weight response, switching to Average " + script.getSceneObject().name);
                script.bandType = 1;
            }
            minValue = script.startWeight;
            maxValue = script.endWeight;
            setResponse = setBlendshapeWeight;
            break;
        case 3: //material of vfx asset
            if (!script.asset) {
                print("Warning, Material or VFX asset is not set on " + script.getSceneObject().name);
                return false;
            }
            if (script.asset.isOfType("Asset.Material")) {
                asset = script.asset.mainPass;
            } else if (script.asset.isOfType("Asset.VFXAsset")) {
                asset = script.asset.properties;
            } else {
                print("Warning, unsupported asset type: " + script.asset.getTypeName() + ", please set VFX or Material asset input on " + script.getSceneObject().name);
                return false;
            }
            if (!script.parameter) {
                print("Warning, Parameter name is not set on " + script.getSceneObject().name);
                return false;
            }
            minValue = script["startAsset" + prefix[script.assetValueType]];
            maxValue = script["endAsset" + prefix[script.assetValueType]];
            setResponse = setAssetProperty;
            break;

        //api function
        case 4:
            if (!script.scriptWithApi) {
                print("Warning, Script with Api input is not set on " + script.getSceneObject().name);
                return;
            }
            if (!script.functionName) {
                print("Warning, Function Name is not set " + script.getSceneObject().name);
                return;
            }
            minValue = script["start" + prefix[script.valueType]];
            maxValue = script["end" + prefix[script.valueType]];
            setResponse = callApiFunction;
            break;
    }
    //init current values
    if (isArray) {
        numBands = analyzer.getNumMel();
        value = new Array(numBands);
        bandValue = new Array(numBands);
        for (var i = 0; i < numBands; i++) {
            value[i] = copyValue(minValue);
            bandValue[i] = 0;
        }
    } else {
        value = copyValue(minValue);
        bandValue = 0;
    }

    updateValueFunc = getUpdateValueFunction(minValue);
    updateBand = getUpdateBandFunction();

    script.createEvent("LateUpdateEvent").bind(onLateUpdate);
}


function copyValue(v) {
    if (v.uniformScale != undefined) {
        return v.uniformScale(1.0);
    } else if (v.toEulerAngles != undefined) {
        return new quat(v.w, v.x, v.y, v.z);
    } else {
        return v;
    }
}
function getUpdateValueFunction(v) {
    if (v.uniformScale != undefined) {
        return updateVecValue;
    } else if (v.toEulerAngles != undefined) {
        return updateQuatValue;
    } else {
        return updateFloatValue;
    }
}
//update band value 
function getUpdateBandFunction() {
    switch (script.bandType) {
        case 0:
            return getBandByIndex;
        case 1:
            return getBandAverage;
        case 2:
            return getAllBands;
    }
}

function getBandByIndex(dt) {
    bandValue = getSmoothedValue(bandValue, analyzer.getBandByIndex(script.index), dt);
    value = updateValueFunc(minValue, maxValue, bandValue);
}

function getBandAverage(dt) {
    bandValue = getSmoothedValue(bandValue, analyzer.getAverage(), dt);
    value = updateValueFunc(minValue, maxValue, bandValue);
}

function getAllBands(dt) {
    bands = analyzer.getBands();
    for (var i = 0; i < value.length; i++) {
        bandValue[i] = getSmoothedValue(bandValue[i], bands[i], dt);
        value[i] = updateValueFunc(minValue, maxValue, bandValue[i]);
    }
}
// value functions
function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getSmoothedValue(prev, next, dt) {
    switch (script.smoothType) {
        case 0:
            return next;
        case 1:
            return next > prev ? next : Math.max(prev - dt * script.step, 0);
        case 2:
            return lerp(prev, next, 1.0 - script.lerpCoef);
    }
}

function updateFloatValue(a, b, t) {
    return lerp(a, b, t);
}

function updateVecValue(a, b, t) {
    return a.add(b.sub(a).uniformScale(t));
}

function updateQuatValue(a, b, t) {
    return quat.slerp(a, b, t);
}

//set transform 
function updateTransform(t) {
    transform["set" + space + script.transformType](t);
}
function setBlendshapeWeight(t) {
    script.meshWithBlendshapes.setBlendShapeWeight(script.blendshapeName, t);
}
//call api function
function callApiFunction(v) {
    script.scriptWithApi.api[script.functionName](v);
}
//set asset property
function setAssetProperty(v) {
    if (isArray) {
        for (var i = 0; i < v.length; i++) {
            asset[script.parameter + "[" + i + "]"] = v[i];
        }
    } else {
        asset[script.parameter] = v;
    }
}

// main update Loop
function onLateUpdate(eventData) {
    //update band value
    updateBand(eventData.getDeltaTime());
    //call response function
    setResponse(value);
}

initialize();
