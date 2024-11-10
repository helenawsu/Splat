// SpeechContext.js
// Event: OnAwake
// Version: 0.2.0
// Description: This script defines speech context for speech recognition

//@input string[] phrasesEnglish
//@input string[] phrasesSpanish
//@input string[] phrasesFrench
//@input string[] phrasesGerman
//@input int boostValue {"widget":"slider", "min":1, "max":10, "step":1}

script.api.getContext = getContext;
script.api.getBoostValue = getBoostValue;

function getContext(voiceMLLanguage) {
    var context;
    switch (voiceMLLanguage) {
        case global.VoiceMLLanguage.LANGUAGE_GERMAN:
            context = getValidPhrases(script.phrasesGerman);
            break;
        case global.VoiceMLLanguage.LANGUAGE_SPANISH:
            context = getValidPhrases(script.phrasesSpanish);
            break;
        case global.VoiceMLLanguage.LANGUAGE_FRENCH:
            context = getValidPhrases(script.phrasesFrench);
            break;
        default:
            context = getValidPhrases(script.phrasesEnglish);

    }    
    return context;
}

function getValidPhrases(phrases) {
    var count = phrases.length;
    if (count ==0) {
        print("ERROR: Make sure to assign phrases to speech context");
        return phrases; 
    }
    var validPhrases = phrases.filter(isNotNull); 
    return validPhrases;
}

function getBoostValue() {

    return script.boostValue;
}


function isNotNull(value) { 
    return value!==null && value!=="";
}
