// AudioAnalyzer.js
// Version 2.1.0
// A script that reads audio data from the source and calculates the power of signal in different frequency ranges over time.
// Event : OnAwake
// @ui {"widget":"group_start","label":"Input"}
// @input int inputType = 1 {"widget" : "combobox", "values" : [{"label" : "None", "value" : 0}, {"label" : "File or Sound", "value" : 1}, {"label" : "From Microphone", "value" : 2}, {"label" : "Audio Component", "value" : 3}, {"label" : "Script With API", "value" : 4}]}

// @input Asset.AudioTrackAsset audioTrack {"showIf":"inputType", "showIfValue":"1"}
// @input bool playAudio {"showIf":"inputType", "showIfValue":"1"}
// @input int loops = -1 {"showIf":"inputType", "showIfValue":"1"}

// @input Asset.AudioTrackAsset microphoneAudio {"showIf":"inputType", "showIfValue":"2"}

// @input Component.AudioComponent audioComponent {"showIf":"inputType", "showIfValue":"3"}

// @input Component.ScriptComponent audioInputScript {"showIf":"inputType", "showIfValue":"4", "hint":"Script with api.getAudioFrame(),<br> api.maxFrameSize and api.sampleRate properties"}
// @ui {"widget":"group_end"}

// @ui {"widget":"separator"}
// @ui {"widget":"group_start","label":"Mel Spectrogram"}
// @input int sampleRate = 44100 {"widget" : "combobox", "values" : [{"label" : "4000", "value" : 4000}, {"label" : "8000", "value" : 8000},{"label" : "16000", "value" : 16000}, {"label" : "32000", "value" : 32000}, {"label" : "44100", "value" : 44100}, {"label" : "48000", "value" : 48000}], "hint" : "Number or samples per second"}

// @input int frameSize = 512 {"hint" : "Length of the window, the window will be the length of frameSize and then padded with zeros to mach fftSize"}
// @input int hopSize = 128 {"hint" : "Number of samples between successive fft segments"}
// @input int fftSize = 2048  {"hint" : "Length of the fft window"}
// @input int numMel = 8  {"hint" : "Number of equal-width bins in the range [minFreq, maxFreq] on mel scale"}
// @input float minFreq = 0.0  {"hint" : "Minimum frequency, Hz"}
// @input float maxFreq = 12000.0 {"hint" : "Maximum frequency, Hz"}

// @ui {"widget":"group_end"}

const BUFFER_SIZE = 640000;
const TOP_DB = 80.0;
const MAX_LEVEL = 0.0;
const MIN_LEVEL = -50.0;
const NORMALIZE_MULT = 1.0 / (MAX_LEVEL - MIN_LEVEL);
const NORMALIZE_ADD = -MIN_LEVEL;
const SUM_AXIS = new vec3(1, 0, 0);
//settings 
var sampleRate = script.sampleRate;
var numMel = script.numMel;
var fftSize = script.fftSize;
var hopSize = script.hopSize;
var frameSize = script.frameSize;
var minFreq = script.minFreq;
var maxFreq = script.maxFreq;

var melSpectrogram = createMelSpectrogram();
var melSpectrogramBuffer = new Float32Array(BUFFER_SIZE);

var bands = new Float32Array(numMel);
var bandsShape = new vec3(1, 1, numMel);
var bandsArray = new Array(numMel);
for (var i = 0; i < numMel; i++) {
    bandsArray[i] = 0;
}
var average = new Float32Array(1);

// audio input 

var audioInput;
var audioFrameShape = new vec3(0, 1, 1);
var audioFrame = new Float32Array(0);
var maxFrameSize;
var readAudioFrame;

var audioComponent;

//init from script inputs
initialize();
//main update loop 
script.createEvent("LateUpdateEvent").bind(onLateUpdate);

//spectrogram functions
function createMelSpectrogram() {
    var melBuilder = MachineLearning.createMelSpectrogramBuilder();
    var melSpectrogram = melBuilder.setSampleRate(sampleRate)
        .setNumMel(numMel)
        .setFrameSize(frameSize)
        .setHopSize(hopSize)
        .setFFTSize(fftSize)
        //clamp frequencies
        .setMinFreq(Math.min(minFreq, maxFreq))
        .setMaxFreq(Math.min(maxFreq, sampleRate / 2))
        .build();
    return melSpectrogram;
}

function process() {
    if (audioFrameShape.x == 0 || audioFrameShape.y == 0 || audioFrameShape.z == 0)  {
        return;
    }
    var melSpectrogramShape = melSpectrogram.process(audioFrame, audioFrameShape, melSpectrogramBuffer);
    var melSpectrogramData = new Float32Array(melSpectrogramBuffer.buffer, 0, melSpectrogramShape.x * melSpectrogramShape.y);
    // Normalize data to [0..1.0] range
    TensorMath.powerToDb(melSpectrogramData, TOP_DB, melSpectrogramData);
    TensorMath.clamp(melSpectrogramData, MIN_LEVEL, MAX_LEVEL, melSpectrogramData);
    TensorMath.addScalar(melSpectrogramData, NORMALIZE_ADD, melSpectrogramData);
    TensorMath.mulScalar(melSpectrogramData, NORMALIZE_MULT, melSpectrogramData);
    TensorMath.sum(melSpectrogramData, melSpectrogramShape, SUM_AXIS, bands);
    TensorMath.mulScalar(bands, 1.0 / melSpectrogramShape.y, bands);
    //add sum axis
    TensorMath.sum(bands, bandsShape, SUM_AXIS, average);
    for (var i = 0; i < numMel; i++) {
        bandsArray[i] = bands[i];
    }
}

// set audio input functions
function setAudioTrackInput(audioTrack, loops) {
    audioInput = audioTrack.control;
    audioInput.loops = loops;
    audioInput.sampleRate = sampleRate;
    readAudioFrame = readFromAudioTrack;

    if (script.playAudio) {
        initAudioComponent(audioTrack, loops);
    }
}

function readFromAudioTrack() {
    var samples = Math.min(Math.round(getDeltaTime() * sampleRate), maxFrameSize); //amount of samples for current frame
    audioFrameShape = audioInput.getAudioBuffer(audioFrame, samples);
}

function setMicrophoneInput(audioFromMicrophone) {
    audioInput = audioFromMicrophone.control;
    audioInput.sampleRate = sampleRate;
    audioInput.start();

    readAudioFrame = readMicrophoneInput;
}

function readMicrophoneInput() {
    audioFrameShape = audioInput.getAudioFrame(audioFrame);
}

function setAudioComponentInput(audioComponentInput) {
    audioComponent = audioComponentInput;
    audioInput = audioComponent.audioTrack.control;
    audioInput.sampleRate = sampleRate;
    readAudioFrame = readFromAudioComponent;

    audioComponent.setOnFinish(resetBands);
}

function readFromAudioComponent() {
    if (audioComponent.isPlaying()) {
        audioInput.position = audioComponent.position;
        var samples = Math.min(Math.round(getDeltaTime() * sampleRate), maxFrameSize); //amount of samples for current frame
        audioFrameShape = audioInput.getAudioBuffer(audioFrame, samples);
    } else {
        audioFrameShape.x = 0;
    }
}

// set script with api that will override getAudioFrame funciton
function setScriptInput(scriptComponent) {
    audioInput = scriptComponent.api;
    readAudioFrame = readFromApi;
}

function readFromApi() {
    audioFrameShape = audioInput.getAudioFrame(audioFrame);
}

function initAudioComponent(audioTrack, loops) {
    if (audioComponent == undefined) {
        audioComponent = script.getSceneObject().createComponent("Component.AudioComponent");
    }
    audioComponent.audioTrack = audioTrack;
    audioComponent.setOnFinish(resetBands);
    audioComponent.play(loops);
}

//audio frame functions
function initAudioFrame() {
    maxFrameSize = audioInput.maxFrameSize;
    audioFrame = new Float32Array(maxFrameSize);
}

function reset() {
    if (audioComponent && audioComponent.isPlaying()) {
        audioComponent.stop(false);
    }
    audioFrameShape.x = 0;
    resetBands();
}

function resetBands() {
    for (var i = 0; i < numMel; i++) {
        bandsArray[i] = 0;
        bands[i] = 0;
    }
}

function onLateUpdate() {
    if (readAudioFrame) {
        readAudioFrame();
        process();
    }
}

function initialize() {
    switch (script.inputType) {
        case (0):
            reset();
            return;
        case (1):
            setInput(script.audioTrack, script.sampleRate, script.loops);
            break;
        case (2):
            setInput(script.microphoneAudio, script.sampleRate);
            break;
        case (3):
            setInput(script.audioComponent, script.sampleRate);
            break;
        case (4):
            setInput(script.audioInputScript, script.sampleRate);
            break;
    }
}

function setInput(input, inputSampleRate, loops) {
    reset();
    readAudioFrame = null;
    //allows to set different assets and componenets as input
    if (!input) {
        print("Error, Invalid argument, input is " + input);
        return;
    }
    if (!inputSampleRate) {
        print("Error, Invalid argument, sample rate is " + input);
        return;
    }
    sampleRate = inputSampleRate;
    
    if (input.isOfType("Asset.AudioTrackAsset")) {
        var control = input.control;
        if (control.isOfType("Provider.MicrophoneAudioProvider")) {

            setMicrophoneInput(input);

        } else if (control.getAudioBuffer) {

            setAudioTrackInput(input, loops == undefined ? -1 : loops);
           
        } else {
            print("Error, Invalid argument, Unsupported Audio Track " + input.control.getTypeName());
            return;

        }
    } else if (input.isOfType("Component.AudioComponent")) {
        if (!input.audioTrack) {
            print("Error, Invalid argument, Audio Track on Audio Component is not set");
            return;
        }
        setAudioComponentInput(input);
    } else if (input.input.isOfType("Component.ScriptComponent")) {
        if (!input.api.getAudioFrame || input.api.maxFrameSize == undefined) {
            print("Error, Invalid argument, please set Script component with getAudioFrame api function and maxFrame rate property");
            return;
        }
        setScriptInput(input);
    } else {
        audioInput = undefined;
        return;
    }
    initAudioFrame();
    melSpectrogram = createMelSpectrogram();
}

function getAudioFrame() {
    return new Float32Array(audioFrame.buffer, 0, audioFrameShape.x);
}

function getSampleRate() {
    return sampleRate;
}
// api
function getBands() {
    return bandsArray;
}

function getBandsFloatArray() {
    return bandsArray;
}

function getBandByIndex(idx) {
    return idx < numMel && idx > -1 ? bandsArray[idx] : 0;
}

function getAverage() {
    return average[0] / numMel;
}

function getNumMel() {
    return numMel;
}

//get band value by index
script.api.getBandByIndex = getBandByIndex;

//get array of all band values
script.api.getBands = getBands;

//get reference to the typed array of all band values
script.api.getBandsFloatArray = getBandsFloatArray;

//return average value across all bands
script.api.getAverage = getAverage;

//returns number of mels
script.api.getNumMel = getNumMel;

//returns audio frame buffer of length audioFrameShape.x
script.api.getAudioFrame = getAudioFrame;

//returns current sample rate
script.api.getSampleRate = getSampleRate;

//sets input
script.api.setInput = setInput;