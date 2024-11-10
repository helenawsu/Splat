// SpeechRecognition.js
// Version: 0.5.0
// Event: OnStart
// Description: Provides functions and configuration for Speech Recognition

//@input Asset.VoiceMLModule vmlModule {"label": "Voice ML Module"}
//@ui {"widget":"separator"}

//@input string voiceMLLanguage {"label": "Voice ML Language","widget":"combobox", "values":[{"label":"System Language", "value":"LANGUAGE_AUTOMATIC"},{"label":"English", "value":"LANGUAGE_ENGLISH"},{"label":"Spanish", "value":"LANGUAGE_SPANISH"},{"label":"French", "value":"LANGUAGE_FRENCH"},{"label":"German", "value":"LANGUAGE_GERMAN"}] }
//@ui {"widget":"separator"}

//@input string transcriptionType {"widget":"combobox", "values":[{"label":"Transcription", "value":"TRANSCRIPTION"}, {"label":"Live Transcription", "value":"LIVE_TRANSCRIPTION"}]}
//@input bool transcripitonText 
//@input Component.Text screenTextTranscription {"showIf":"transcripitonText", "label": "Transcription text component"}

//@ui {"widget":"separator"}
//@input bool useSpeechContext
//@input SceneObject speechContextsObject {"showIf":"useSpeechContext"}

//@ui {"widget":"separator"}
//@input bool useKeyword
//@input SceneObject keywordsParentObject {"showIf":"useKeyword"}
//@input bool keywordText {"showIf":"useKeyword"}
//@input Component.Text screenTextKeywordResponses {"showIf":"keywordText", "label": "KeywordResponses text component"}

//@ui {"widget":"separator","showIf":"voiceMLLanguage", "showIfValue":"LANGUAGE_ENGLISH"}
//@input bool useCommand {"showIf":"voiceMLLanguage", "showIfValue":"LANGUAGE_ENGLISH"}
//@input Component.ScriptComponent commandHandler {"showIf":"useCommand", "label": "CommandHandler"}
//@input bool commandText {"showIf":"useCommand"}
//@input Component.Text screenTextCommandResponses {"showIf":"commandText", "label": "CommandResponses text component"}

//@ui {"widget":"separator","showIf":"voiceMLLanguage", "showIfValue":"LANGUAGE_ENGLISH"}
//@input bool useSYSTEM_VOICE_COMMAND  {"showIf":"voiceMLLanguage", "showIfValue":"LANGUAGE_ENGLISH"}
//@ui {"widget":"group_start", "label":"System Voice Command Text", "showIf":"useSYSTEM_VOICE_COMMAND"}
//@input bool SYSTEM_VOICE_COMMANDText
//@input Component.Text screenTextSYSTEM_VOICE_COMMANDResponses {"showIf":"SYSTEM_VOICE_COMMANDText", "label": "System Voice CommandResponses text component"}
//@ui {"widget":"group_end"}

//@ui {"widget":"separator"}
//@input bool editBehaviors {"label": "Edit Behaviors"}
//@ui {"widget":"group_start", "label":"Voice Event Behaviors", "showIf":"editBehaviors"}
//@input bool debug
//@input Component.ScriptComponent[] onListeningEnabledGlobalBehaviors {"label":"On Listening Enabled"}
//@input Component.ScriptComponent[] onListeningDisabledGlobalBehaviors {"label":"On Listening Disabled"}
//@input Component.ScriptComponent[] onListeningTriggeredGlobalBehaviors {"label":"On Listening Triggered"}
//@input Component.ScriptComponent[] onErrorTriggeredGlobalBehaviors {"label":"On Error Triggered"}
//@input Component.ScriptComponent[] onFinalTranscriptionTriggeredGlobalBehaviors {"label":"On Final Transcription Triggered"}
//@ui {"widget":"label","showIf":"useKeyword", "label":"NOTE: On Keyword Detected will be triggered"}
//@ui {"widget":"label","showIf":"useKeyword", "label":"for all the keywords. For single keyword trigger,"}
//@ui {"widget":"label","showIf":"useKeyword", "label":"please check the Send Trigger in each keyword"}
//@ui {"widget":"label","showIf":"useKeyword", "label":"child under Keywords Object"}
//@ui {"widget":"separator","showIf":"useKeyword"}
//@input Component.ScriptComponent[] onKeywordTriggeredGlobalBehaviors {"showIf":"useKeyword", "label":"On Keyword Detected"}
//@ui {"widget":"label","showIf":"useCommand", "label":"NOTE: On Command Detected will be triggered"}
//@ui {"widget":"label","showIf":"useCommand", "label":"for all the commands. For single command trigger,"}
//@ui {"widget":"label","showIf":"useCommand", "label":"please check the functions in the CommandHandler"}
//@ui {"widget":"label","showIf":"useCommand", "label":"Script Component"}
//@ui {"widget":"separator","showIf":"useCommand"}
//@input Component.ScriptComponent[] onCommandTriggeredGlobalBehaviors {"showIf":"useCommand", "label":"On Command Detected"}
//@input Component.ScriptComponent[] onVoiceSystemCommandTriggeredGlobalBehaviors {"showIf":"useSYSTEM_VOICE_COMMAND", "label":"On System Voice Command Detected"}
//@ui {"widget":"group_end"}

var initialized = false;
var keywordList = [];
var options;
var VoiceStates = {
    ENABLED: "enabled",
    DISABLED: "disabled",
    ERROR :"error",
    LISTENING:"listening",
    FINAL:"final",
};

var LanguageCode = {
    EN:"en",
    EN_US:"en_US",
    ES:"es",
    ES_MX:"es_MX",
    FR:"fr",
    FR_FR:"fr_FR",
    DE:"de",
    DE_DE:"de_DE",
};

var SpeechRecognizer = {
    EN:VoiceMLModule.SpeechRecognizer.Default,
    DE:"german",
    ES:"spanish",
    FR:"french",
};

var TranscriptionType = {
    TRANSCRIPTION:"TRANSCRIPTION",
    LIVE_TRANSCRIPTION:"LIVE_TRANSCRIPTION",
};

var Category = {
    SYSTEM_VOICE_COMMAND:"SYSTEM_VOICE_COMMAND",
    COMMAND:"COMMAND",
    KEYWORD:"KEYWORD",
};

var ErrorCode = {
    INDECISIVE: "#SNAP_ERROR_INDECISIVE",
    INCONCLUSIVE: "#SNAP_ERROR_INCONCLUSIVE",
    NONVERBAL:"#SNAP_ERROR_NONVERBAL",
    SILENCE:"#SNAP_ERROR_SILENCE",
    PREFIX:"#SNAP_ERROR",
};
var voiceState = VoiceStates.DISABLED;
var prevVoiceState = VoiceStates.DISABLED;
var prevKeyword = "";
var keywordError = "";
var possibleCommands = ["next", "back", "left", "right", "up", "down", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
var voiceMLLanguage = script.voiceMLLanguage;

//This function will be called when the microphone is enabled.
var onListeningEnabledHandler = function() {

    script.vmlModule.startListening(options);
    //Trigger on Listening Enabled Event
    triggerBehaviors(script.onListeningEnabledGlobalBehaviors); 
    if (script.debug) {
        print("VOICE EVENT: Start Listening");
    }
    voiceState = VoiceStates.ENABLED;
    prevVoiceState = voiceState;

};

//This function will be called when the microphone is disabled.
var onListeningDisabledHandler = function() {
    script.vmlModule.stopListening();
    //Trigger on Listening Disabled Event
    triggerBehaviors(script.onListeningDisabledGlobalBehaviors);
    if (script.debug) {
        print("VOICE EVENT: Stop Listening");
    }
    voiceState = VoiceStates.DISABLED;
};

//This function will be called when there is error in the transcription.
var onListeningErrorHandler = function(eventErrorArgs) { 
    //Trigger on Error Event
    triggerBehaviors(script.onErrorTriggeredGlobalBehaviors);
    if (script.debug) {
        print("VOICE EVENT: Error: " + eventErrorArgs.error + " desc: "+ eventErrorArgs.description);
           
    }
    voiceState = VoiceStates.ERROR;
};

//This function will handle the error messages
var getErrorMessage = function(response) {
    var errorMessage = "";
    switch (response) {
        case ErrorCode.INDECISIVE:
            errorMessage = "indecisive"; 
            break;
        case ErrorCode.INCONCLUSIVE:
            errorMessage = "inconclusive"; 
            break;
        case ErrorCode.NONVERBAL:
            errorMessage = "non verbal"; 
            break;
        case ErrorCode.SILENCE:
            errorMessage = "too long silence";
            break;           
        default:
            if (response.includes(ErrorCode.PREFIX)) {
                errorMessage = "general error";   
            } else {
                errorMessage = "unknown error";
            }

    }
    return errorMessage;
};

//This function will handle system command, command and keyword response to fill out and return the valid responses
var getValidResponses = function(responses, category) {
    var values = [];
    var code = "";
    for (var iIterator = 0; iIterator < responses.length; iIterator++) {
        var response = responses[iIterator];
        switch (response.status.code) {
            case 0:
                code= "OK"; 
                if (category === Category.COMMAND) {
                    var command = response.intent;
                    values.push(command);

                } else if (category === Category.SYSTEM_VOICE_COMMAND) {
                    var SYSTEM_VOICE_COMMAND = response.command;
                    values.push(SYSTEM_VOICE_COMMAND);               
                    
                } else {
                    var keywords = response.keywords;
                    for (var keywordsIterator = 0; keywordsIterator < keywords.length; keywordsIterator++) {
                        var keyword = keywords[keywordsIterator];
                        values.push(keyword);               
                    } 
                }

                break;
            case 1:
                code = "ERROR";
                print("Status Code: "+code+ " Description: " + response.status.code.description);
                break;
            default:
                print("Status Code: No Status Code");
        }
       
    }

    return values;

};

//This function will be called when it's a full result, or partial transcription
//This function will handle live or final transcription result, keyword response, command response and system command response.
var onUpdateListeningEventHandler = function(eventArgs) {
    
    voiceState =  VoiceStates.LISTENING;

    //Trigger on Final Transcription Event
    if (eventArgs.isFinalTranscription) {
        voiceState = VoiceStates.FINAL;      
        triggerBehaviors(script.onFinalTranscriptionTriggeredGlobalBehaviors);
        if (script.debug) {
            print("VOICE EVENT: On Final Transcription");
        }
    //Trigger on Listening Triggered Event    
    } else if ((prevVoiceState==VoiceStates.FINAL|| prevVoiceState== VoiceStates.ENABLED) && voiceState == VoiceStates.LISTENING) {  
    
        triggerBehaviors(script.onListeningTriggeredGlobalBehaviors);
        if (script.debug) {
            print("VOICE EVENT: On Listening");
        }
        
    }
    
    //Set Final Transcription to Screen Text Transcription  
    if (script.transcripitonText && (eventArgs.isFinalTranscription || eventArgs.transcription.trim())) {        
        script.screenTextTranscription.text = eventArgs.transcription;
    }
    
    //Keyword Response
    if (script.useKeyword && eventArgs.getKeywordResponses().length>0) {
        
        var keywordResponses = eventArgs.getKeywordResponses();
        var keywordResponseText = "";  
        var keywords = getValidResponses(keywordResponses,Category.KEYWORD);
 
        if (keywords.length===0) {
            return;
        }

        if (eventArgs.isFinalTranscription && script.transcriptionType === TranscriptionType.LIVE_TRANSCRIPTION) {
            prevKeyword ="";      
        } else {

            for (var kIterator=0; kIterator<keywords.length; kIterator++) {
                var keyword = keywords[kIterator].toUpperCase();

                if (keyword.includes(ErrorCode.PREFIX)) {
                    keywordError = getErrorMessage(keyword);
                    prevKeyword = "";
                    break;
                } 

                if (doesKeywordExist(keyword) && (script.transcriptionType === TranscriptionType.LIVE_TRANSCRIPTION || eventArgs.isFinalTranscription) && prevKeyword !== keyword) {

                    keywordResponseText += keyword+"\n"; 
                    if (script.debug) {
                        print("VOICE EVENT: On Keyword Triggered");
                    }
                    if (script.keywordText) {
                        script.screenTextKeywordResponses.text = keywordResponseText!=="" ? ("Keyword: "+ keywordResponseText) : "";
                    }
                    triggerBehaviors(script.onKeywordTriggeredGlobalBehaviors);
                    triggerBehaviors(seekTriggerBehaviors(keyword));   
                    keywordError = "";
                    prevKeyword =eventArgs.isFinalTranscription? "":keyword;                          
                }
                
            }  

        }  
        if (eventArgs.isFinalTranscription && keywordError!=="") {
            print("Keyword Error: "+keywordError);
        }
        
    }

    if (!eventArgs.isFinalTranscription) {
        prevVoiceState = voiceState;
        return;
    }

    //Command Response
    if (script.useCommand && eventArgs.getIntentResponses().length>0 && voiceState==VoiceStates.FINAL) {
        var commandResponses = eventArgs.getIntentResponses();
        commandResponsesHandler(commandResponses, Category.COMMAND);     
    }
    
    //System Command Response
    if (script.useSYSTEM_VOICE_COMMAND && eventArgs.getCommandResponses().length>0 && voiceState==VoiceStates.FINAL) {
        var SYSTEM_VOICE_COMMANDResponses = eventArgs.getCommandResponses();
        commandResponsesHandler(SYSTEM_VOICE_COMMANDResponses, Category.SYSTEM_VOICE_COMMAND);
    }   
    prevVoiceState = voiceState;
   
};

function commandResponsesHandler(responses, category) {
    var commandResponses = responses;
    var commandResponseText = "";  

    var commands = getValidResponses(commandResponses,category);
    if (commands.length===0) {
        return;
    }         
    for (var iIterator=0;iIterator<commands.length;iIterator++) {
        var command  = commands[iIterator];
        if (command.includes(ErrorCode.PREFIX)) {
            var commandError = getErrorMessage(command);
            print(category +" Error: "+ commandError);
            break;
        }
        commandResponseText += commands[iIterator]+"\n";
        if (script.debug) {
            print("VOICE EVENT: On "+ category + " Triggered");
        }
        commandResponseText = commandResponseText!=="" ? (category+ ": "+ commandResponseText) : "";
        if (category === Category.SYSTEM_VOICE_COMMAND) {
            if (script.SYSTEM_VOICE_COMMANDText) {
                script.screenTextSYSTEM_VOICE_COMMANDResponses.text = commandResponseText;
            }
            triggerBehaviors(script.onVoiceSystemCommandTriggeredGlobalBehaviors);
        } else {
            if (script.commandText) {
                script.screenTextCommandResponses.text = commandResponseText;
            }
            triggerBehaviors(script.onCommandTriggeredGlobalBehaviors); 
            triggercommandHandler(possibleCommands.indexOf(command));   

        }

    }

}

//Return if keywordList contains keyword
function doesKeywordExist(keyword) {
    for (var j=0;j<keywordList.length;j++) {                                          
        if (keywordList[j].keyword.toUpperCase() === keyword) {
            return true;
        }
    }
    return false;

}

//Return trigger behaviors with keyword
function seekTriggerBehaviors(keyword) {
    for (var j=0;j<keywordList.length;j++) {                                          
        if (keywordList[j].keyword.toUpperCase() === keyword) {
            return keywordList[j].triggerBehaviors;
        }
    }
    return null;
}

//This function will called when any command is detected.
//Index number represents different commands.
//0-"next", 1-"back", 2-"left", 3-"right", 4-"up", 5-"down", 
//6-"first", 7-"second", 8-"third", 9-"fourth", 10-"fifth", 
//11-"sixth", 12-"seventh", 13-"eighth", 14-"ninth", 15-"tenth"
//With different index differernt functions will be triggered in the command handller.
function triggercommandHandler(index) {

    switch (index) {
        case 0:
            script.commandHandler.api.nextCommand();
            break;
        case 1:
            script.commandHandler.api.previousCommand();
            break;
        case 2:
            script.commandHandler.api.leftCommand();
            break;        
        case 3:
            script.commandHandler.api.rightCommand();
            break;   
        case 4:
            script.commandHandler.api.upCommand();
            break; 
        case 5:
            script.commandHandler.api.downCommand();
            break;
        default:
            script.commandHandler.api.numberCommand(index-6);
    }
    
}

//This function will trigger an array of behavior scripts as input
function triggerBehaviors(behaviors) {
    if (!behaviors) {
        return;
    }
    
    for (var i=0; i<behaviors.length; i++) {
        if (behaviors[i] && behaviors[i].api.trigger) {
            behaviors[i].api.trigger();    
        } else {
            print("WARNING: please assign the Behavior Script Component");
        }
                                        
    }
    
}

//Initialize Language

function initializeLanguage(language) {
    //Localization System Language
    var systemLanguage = global.localizationSystem.getLanguage();
    var langugeOption = {
        languageCode: LanguageCode.EN_US,
        speechRecognizer: SpeechRecognizer.EN,
        language: global.VoiceMLLanguage.LANGUAGE_ENGLISH,
    };

    //VoiceML Language options:
    switch (language) {
        case global.VoiceMLLanguage.LANGUAGE_AUTOMATIC:
            if (systemLanguage ==LanguageCode.EN) {
                langugeOption.languageCode = LanguageCode.EN_US;
                langugeOption.speechRecognizer = SpeechRecognizer.EN;
                langugeOption.language = global.VoiceMLLanguage.LANGUAGE_ENGLISH;
            } else if (systemLanguage.startsWith(LanguageCode.ES)) {
                langugeOption.languageCode = LanguageCode.ES_MX;
                langugeOption.speechRecognizer = SpeechRecognizer.ES;
                langugeOption.language = global.VoiceMLLanguage.LANGUAGE_SPANISH;
            } else if (systemLanguage == LanguageCode.DE) {
                langugeOption.languageCode = LanguageCode.DE_DE;
                langugeOption.speechRecognizer = SpeechRecognizer.DE;
                langugeOption.language = global.VoiceMLLanguage.LANGUAGE_GERMAN;
            } else if (systemLanguage == LanguageCode.FR) {
                langugeOption.languageCode = LanguageCode.FR_FR;
                langugeOption.speechRecognizer = SpeechRecognizer.FR;
                langugeOption.language = global.VoiceMLLanguage.LANGUAGE_FRENCH;
            }
            break;
        case global.VoiceMLLanguage.LANGUAGE_GERMAN:
            langugeOption.languageCode = LanguageCode.DE_DE;
            langugeOption.speechRecognizer = SpeechRecognizer.DE;
            langugeOption.language = global.VoiceMLLanguage.LANGUAGE_GERMAN;
            break;
        case global.VoiceMLLanguage.LANGUAGE_SPANISH:
            langugeOption.languageCode = LanguageCode.ES_MX;
            langugeOption.speechRecognizer = SpeechRecognizer.ES;
            langugeOption.language = global.VoiceMLLanguage.LANGUAGE_SPANISH;
            break;
        case global.VoiceMLLanguage.LANGUAGE_FRENCH:
            langugeOption.languageCode = LanguageCode.FR_FR;
            langugeOption.speechRecognizer = SpeechRecognizer.FR;
            langugeOption.language = global.VoiceMLLanguage.LANGUAGE_FRENCH;
            break;
        default:
            langugeOption.languageCode = LanguageCode.EN_US;
            langugeOption.speechRecognizer = SpeechRecognizer.EN;
            langugeOption.language = global.VoiceMLLanguage.LANGUAGE_ENGLISH;
    }

    return langugeOption;

}

//Initialize Speech Contexts
function initializeSpeechContexts() {

    var speechContexts = [];
    var scObject = script.speechContextsObject;
    if (!scObject.enabled) {
        print("WARNING: Speech Contexts Object is not enabled");
        return null; 
    }
    
    var scComponents = scObject.getComponents("Component.ScriptComponent");
    if (!scComponents || scComponents.length==0) {        
        print("WARNING: There is no valid speech context component");
        return null;       
    }
    
    for (var i = 0;i<scComponents.length;i++) {
        
        var scComponent = scComponents[i];
        if (scComponent && scComponent.enabled) {
            var data = {
                phrases: scComponent.api.getContext!==null && scComponent.api.getContext(voiceMLLanguage),
                boostValue: scComponent.api.getBoostValue!==null && scComponent.api.getBoostValue(),  
            };
            
            if (data.phrases.length>0 && data.boostValue!==null &&speechContexts) {
                speechContexts.push(data);
               
            } else {
                print("WARNING: Speech Context Script Component "+ i + " under Speech Contexts Object is not valid");
            }
            
        } else {
            print("WARNING:  Speech Context Script Component "+ i +  "under Speech Contexts Object is not enabled");                   
        }
    }

    return speechContexts;  
}


//Initialize Keywords
function initializeKeywords() {
    var nlpKeywordModel = VoiceML.NlpKeywordModelOptions.create();   
    var parent = script.keywordsParentObject;

    for (var i = 0; i < parent.getChildrenCount(); i++) {
        var child = parent.getChild(i);
        if (child.enabled) {
            var st = child.getComponent("Component.ScriptComponent");
            if (!st) {
                print("WARNING: child "+ i + " doesn't have Keyword Script Component");
                break;
            }
            
            var data = {
                keyword: st.api.getKeyword!==null && st.api.getKeyword()["Keyword"],
                categoryAliases: st.api.getCategoryAliases!==null && st.api.getKeyword()["CategoryAliases"],
                triggerBehaviors: st.api.getBehaviorComponents!==null && st.api.getBehaviorComponents(),
            };
            if (data.keyword!==null && data.categoryAliases.length>0) {
                keywordList.push(data);
                nlpKeywordModel.addKeywordGroup(data.keyword,data.categoryAliases);
            } else {
                print("WARNING: child "+ i + " doesn't have valid Keyword Script Component");
            }
        }
    }
    
    return nlpKeywordModel;
        
}

//Initialize Intent Models
function initializeIntentModels() {

    var nlpIntentModel = VoiceML.NlpIntentsModelOptions.create("VOICE_ENABLED_UI");         
    nlpIntentModel.possibleIntents = possibleCommands;   
    return nlpIntentModel;
    
}

function checkInputValues() {

    if (script.vmlModule == null) {
        print("ERROR: Make sure to assign VoiceML Module");
        return false;
    }  
    if (script.voiceMLLanguage == null) {
        print("ERROR: Make sure to choose VoiceML Language");
        return false; 
    }
    
    if (script.transcripitonText && script.screenTextTranscription == null) {
        print("ERROR: Make sure to assign Screen Text Transcription for debug");
        return false;
    }
    
    if (script.useSpeechContext && script.speechContextsObject == null) {
        print("ERROR: Make sure to assign Speech Contexts Object");
        return false;
    }
    
    if (script.useKeyword && script.keywordsParentObject == null) {
        print("ERROR: Make sure to assign Keywords Parent Object for keyword detection");
        return false;
    }
    
    if (script.useKeyword && script.screenTextKeywordResponses == null) {
        print("ERROR: Make sure to assign Screen Text Nlp Keyword Responses for keyword detection");
        return false;
    }

    return true;
}


function initialize() {
    
    if (!checkInputValues()) {
        return;
    }
    
    if (initialized) {
        return;
    }
    
    //VoiceML Option
    options = VoiceML.ListeningOptions.create();

    //VoiceML Language
    var languageOption = initializeLanguage(voiceMLLanguage);
    voiceMLLanguage = languageOption.language;
    options.languageCode = languageOption.languageCode;
    options.SpeechRecognizer = languageOption.speechRecognizer;
    
    var nlpModel = [];
    
    //Keyword Option 
    var nlpKeywordModel;
    if (script.useKeyword) {
        nlpKeywordModel=initializeKeywords();
        nlpModel.push(nlpKeywordModel);
    }
    
    //IntentModel Option
    var nlpIntentModel; 
    if (script.useCommand) {
        nlpIntentModel=initializeIntentModels();
        nlpModel.push(nlpIntentModel);
        
    }
    
    if (script.useKeyword ||script.useCommand) {
        options.nlpModels = nlpModel;
    }
    
    //Speech Context Option 
    if (script.useSpeechContext) {
           
        var speechContexts = initializeSpeechContexts();
        
        if (!speechContexts || speechContexts.length == 0) {
            print("ERROR: Can't initialize Speech Context");
            return;
        }
        
        for (var i = 0; i <speechContexts.length; i++) {
            options.addSpeechContext(speechContexts[i].phrases,speechContexts[i].boostValue); 
        }
    }

      
    options.shouldReturnAsrTranscription = true;
    if (script.transcriptionType === TranscriptionType.TRANSCRIPTION) {
        options.shouldReturnInterimAsrTranscription = false;        
    } else {
        options.shouldReturnInterimAsrTranscription = true; 
    }

    //System Voice Command
    if (script.useSYSTEM_VOICE_COMMAND) {
        script.vmlModule.enableSystemCommands();        
    }
    
    //VoiceML Callbacks
    script.vmlModule.onListeningUpdate.add(onUpdateListeningEventHandler);
    script.vmlModule.onListeningError.add(onListeningErrorHandler);    
    script.vmlModule.onListeningEnabled.add(onListeningEnabledHandler);
    script.vmlModule.onListeningDisabled.add(onListeningDisabledHandler);


    initialized = true;
}

initialize();