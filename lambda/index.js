// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const url = require('url');

//Amazon Shopping App Constants 
const AMAZON_ORDER_HISTORY_URL = "https://www.amazon.com/gp/css/order-history/";
const AMAZON_SEARCH_URL = "https://www.amazon.com/s";
const AMAZON_SEARCH_QUERY_PARAM = "k";

const AMAZON_ANDROID_PACKAGE = "com.amazon.mShop.android.shopping";
const AMAZON_IOS_ID = "id297606951";

// Constants used by the AppLinks feature
const APP_LINK_INTERFACE = "AppLink";
const ANDROID_STORE_TYPE = "GOOGLE_PLAY_STORE";
const IOS_STORE_TYPE = "IOS_APP_STORE";

//Some Possible types of deep links supported.
const CUSTOM_SCHEME_TYPE = "CUSTOM_SCHEME";
const UNIVERSAL_LINK_TYPE = "UNIVERSAL_LINK";
const ANDROID_PACKAGE_TYPE = "ANDROID_PACKAGE";

const CANNOT_SERVE_RESPONSE = "Sorry, you are not on a mobile device. Try asking from the Alexa mobile app, an Alexa Built-in phone, or from an Alexa mobile accessory.";

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        //Log the request.
        console.log(JSON.stringify(handlerInput.requestEnvelope));

        let speakOutput = CANNOT_SERVE_RESPONSE;

        const appLinksInterface = handlerInput.requestEnvelope.context[APP_LINK_INTERFACE];
        if(appLinksInterface != null) {
            speakOutput = 'Welcome, you can launch a deep link to the Amazon shopping mobile app. I support deep linking to the search page, your order history, or simply opening the app. Which would you like to try? ';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function createAppLinkSkillConnection(linkType, link, isAndroid, unlockedSpeech, lockedScreenSpeech, suppress = false) {
    return {
        type: "Connections.StartConnection",
        uri: "connection://AMAZON.LinkApp/1",
        input: {
            catalogInfo: {
                identifier: isAndroid ? AMAZON_ANDROID_PACKAGE : AMAZON_IOS_ID,
                type: isAndroid ? ANDROID_STORE_TYPE : IOS_STORE_TYPE,
            },
            actions: {
                primary: {
                    type: linkType,
                    link: link
                }
            },
            prompts: {
                onAppLinked: {
                    prompt: {
                        ssml: `<speak>${unlockedSpeech}</speak>`,
                        type: "SSML"
                    },
                    defaultPromptBehavior: suppress? "SUPPRESS" : "SPEAK"
                },
                onScreenLocked: {
                    prompt: {
                        ssml: `<speak>${lockedScreenSpeech}</speak>`,
                        type: "SSML"
                    }
                }
            }
        }
    }
}

/**
 * Session Resumed handler used for the skill connection request.
 * 
 */
const SessionResumedIntentHandler = { // TODO: check for cause.type == 'ConnectionCompleted'?
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionResumedRequest';
    },
    handle(handlerInput) {
        console.log("Session Resumed: " + JSON.stringify(handlerInput.requestEnvelope));
        const cause = handlerInput.requestEnvelope.request.cause;
        console.log(cause);
        if(cause != null) {
            //Let's log our results
            // You can make decisions based on this and even continue the voice experience.
            console.log("Primary result: " + JSON.stringify(cause.result.primary));
            console.log("Fallback result: " + JSON.stringify(cause.result.fallback));
            
            //If the status failed for both, let's continue the experience.
            if(cause.result.primary.status === "FAILURE" && cause.result.fallback.status === "FAILURE") {
                return handlerInput.responseBuilder
                    .speak("Oh no, sorry I was unable to link to the app. Check the status code in the logs to see what went wrong.")
                    .getResponse();
            }
        }
        return handlerInput.responseBuilder.getResponse();
    }
}

 /**
  * Handler for OpenAppIntent requests. Opens the app with an android package request.
  * Falls back to the app store.
  * TODO iOS.
  */
const OpenAppIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OpenAppIntent';
    },
    handle(handlerInput) {
        const appLinksInterface = handlerInput.requestEnvelope.context[APP_LINK_INTERFACE];
        if(appLinksInterface) {
            const unlockedSpeech = "Okay. ";
            const lockedScreenSpeech = "Please unlock your device to open the Amazon Shopping App. ";
            console.log(appLinksInterface.supportedCatalogTypes);
            if(appLinksInterface.supportedCatalogTypes.includes(ANDROID_STORE_TYPE)) {
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection( // TODO Fallback on this.
                    ANDROID_PACKAGE_TYPE, AMAZON_ANDROID_PACKAGE, true, unlockedSpeech, lockedScreenSpeech, false
                ))
                .getResponse();
            } else if(appLinksInterface.supportedCatalogTypes.includes(IOS_STORE_TYPE)) {
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(
                    // No need for fallback. it's built right in!
                    UNIVERSAL_LINK_TYPE, "https://amazon.com", false, unlockedSpeech, lockedScreenSpeech, false
                ))
                .getResponse();
            }
        }

        return handlerInput.responseBuilder
            .speak(CANNOT_SERVE_RESPONSE)
            .getResponse();
    }
};

/**
 * Handler for GetOrdersIntent. Opens the order history page in the mobile app and falls back to the mobile website. (universal links)
 */
const GetOrdersIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetOrdersIntent';
    },
    handle(handlerInput) {
        const appLinksInterface = handlerInput.requestEnvelope.context[APP_LINK_INTERFACE];
        if(appLinksInterface) {
            const unlockedSpeech = "Okay. ";
            const lockedScreenSpeech = "Please unlock your device to open the Amazon Shopping App. ";
            const deeplink = AMAZON_ORDER_HISTORY_URL;
            console.log(appLinksInterface.supportedCatalogTypes);
            if(appLinksInterface.supportedCatalogTypes.includes(ANDROID_STORE_TYPE)) {
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(
                    UNIVERSAL_LINK_TYPE, deeplink, true, unlockedSpeech, lockedScreenSpeech, true
                ))
                .getResponse();
            } else if(appLinksInterface.supportedCatalogTypes.includes(IOS_STORE_TYPE)) {
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(
                    UNIVERSAL_LINK_TYPE, deeplink, false, unlockedSpeech, lockedScreenSpeech, true
                ))
                .getResponse();
            }
        }

        return handlerInput.responseBuilder
            .speak(CANNOT_SERVE_RESPONSE)
            .getResponse();
    }
};

/**
 * Handles search intent. Opens the search page on the app if installed if there is no parameter and performs a search otherwise. 
 * Falls back to the mobile web experiences (universal links)
 */
const SearchIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SearchIntent';
    },
    handle(handlerInput) {
        //Log the request.
        console.log(JSON.stringify(handlerInput.requestEnvelope));
        const searchQuery = Alexa.getSlotValue(handlerInput.requestEnvelope, "query");

        const appLinksInterface = handlerInput.requestEnvelope.context[APP_LINK_INTERFACE];
        if(appLinksInterface) {
            //If there is a query, append it as a query Param, otherwise just open the search page.
            let searchUrl = new url.URL(AMAZON_SEARCH_URL);
            let queryParams = new url.URLSearchParams();
            queryParams.set(AMAZON_SEARCH_QUERY_PARAM, searchQuery);
            searchUrl.search = queryParams;
            const deeplink = searchQuery != null ? searchUrl.toString() : AMAZON_SEARCH_URL;
            
            const unlockedSpeech = `Searching for ${searchQuery}. `;
            const lockedScreenSpeech = "Please unlock your device to search in the Amazon Shopping App. ";
            if(appLinksInterface.supportedCatalogTypes.includes(ANDROID_STORE_TYPE)) {
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(
                    UNIVERSAL_LINK_TYPE, deeplink, true, unlockedSpeech, lockedScreenSpeech, true
                ))
                .getResponse();
            } else if(appLinksInterface.supportedCatalogTypes.includes(IOS_STORE_TYPE)) {
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(
                    UNIVERSAL_LINK_TYPE, deeplink, false, unlockedSpeech, lockedScreenSpeech, true
                ))
                .getResponse();
            }
        }

        return handlerInput.responseBuilder
            .speak(CANNOT_SERVE_RESPONSE)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = "This skill only works from the context of the Alexa mobile app, a mobile accessory such as the Echo Buds, or from an Alexa-enable mobile phone. You can ask me to deep link into the Amazon shopping app\'s order history, search page, or simply opening the app. What would you like me to do?";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        OpenAppIntentHandler,
        GetOrdersIntentHandler,
        SearchIntentHandler,
        HelpIntentHandler,
        SessionResumedIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
