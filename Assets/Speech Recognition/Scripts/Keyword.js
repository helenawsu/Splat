// Keyword.js
// Event: OnAwake
// Version: 0.2.0
// Description: This script define keyword for keyword detection

//@input string keywordEnglish
//@input string[] categoryAliasesEnglish
//@input string keywordSpanish
//@input string[] categoryAliasesSpanish
//@input string keywordFrench
//@input string[] categoryAliasesFrench
//@input string keywordGerman
//@input string[] categoryAliasesGerman
//@input bool sendTriggers
//@input Component.ScriptComponent[] onKeywordTriggeredGlobalBehaviors {"showIf":"sendTriggers", "label":"On Keyword Triggered"}

script.api.getKeyword = getKeyword;
script.api.getBehaviorComponents = getBehaviorComponents;

function getBehaviorComponents() {
    if (!script.sendTriggers) {
        return null;
    }
    var behaviors = script.onKeywordTriggeredGlobalBehaviors.filter(isNotNull);
    var filteredCount = behaviors.length;
    var count = script.onKeywordTriggeredGlobalBehaviors.length;
    if (count==0 || filteredCount!==count) {
        print("Warning: Make sure to assign behavior script to the keyword trigger");
        return [];
    }
    
    return behaviors;
}
function getKeyword(voiceMLLanguage) {
    var keyword;
    switch (voiceMLLanguage) {
        case global.VoiceMLLanguage.LANGUAGE_GERMAN:
            keyword ={
                "Keyword":  getValidKeyword(script.keywordGerman), 
                "CategoryAliases": getCategoryAliases(script.categoryAliasesGerman),     
            };
            break;
        case global.VoiceMLLanguage.LANGUAGE_SPANISH:
            keyword = {
                "Keyword":  getValidKeyword(script.keywordSpanish), 
                "CategoryAliases": getCategoryAliases(script.categoryAliasesSpanish),
            };          
            break;
        case global.VoiceMLLanguage.LANGUAGE_FRENCH:
            keyword ={
                "Keyword":  getValidKeyword(script.keywordFrench), 
                "CategoryAliases": getCategoryAliases(script.categoryAliasesFrench),     
            };
            break;
        default:
            keyword = {
                "Keyword":  getValidKeyword(script.keywordEnglish), 
                "CategoryAliases": getCategoryAliases(script.categoryAliasesEnglish),     
            };  

    }    
    return keyword;
    
}

function getValidKeyword(keyword) {
    if (!keyword || keyword == "") {
        print("ERROR: Make sure to define keyword");
        return null;
    }
    return keyword;
}


function getCategoryAliases(aliases) {
    var count = aliases.length;
    if (count ==0) {
        print("ERROR: Make sure to define category aliases");
        return aliases; 
    }
    var validAliases = aliases.filter(isNotNull);    
    return validAliases;
}


function isNotNull(value) { 
    return value!==null && value!=="";
}

