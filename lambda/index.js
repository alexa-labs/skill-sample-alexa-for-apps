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
const APP_LINK_STATE = "AppLink";
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

        const appLinksInterface = handlerInput.requestEnvelope.context.System.supportedInterfaces['AppLink'];
        if(appLinksInterface != null) {
            // Skill can only support one version of AppLink interface. This version check can be used
            // when migrating from V1 interface to V2 interface.
            const version = appLinksInterface['version']
            if (version === null) {
                speakOutput = 'Welcome, you can launch a deep link to the Amazon shopping mobile app. I support deep linking to the search page, your order history, or simply opening the app. Which would you like to try? ';
            } else if (version === "2.0") {
                speakOutput = 'Welcome, you can launch a deep link to the Amazon shopping mobile app directly or via a push notification. I can send notification to open the search page, your order history, or simply opening the app. Which would you like to try? '
            }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function createAppLinkSkillConnection(linksPerCatalog, linkTopic, suppress = false) {
    return {
        type: "Connections.StartConnection",
        uri: "connection://AMAZON.LinkApp/2",
        input: {
            links: linksPerCatalog,
            prompt: {
                topic: linkTopic,
                directLaunchDefaultPromptBehavior: suppress ? "SUPPRESS" : "SPEAK"
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
        if(cause != null && cause.result != null) {
            if (cause.result.directLaunch != null) {
                // handle V2 direct launch result
                console.log("Direct launch primary result: " + JSON.stringify(cause.result.directLaunch.primary));
                console.log("Direct launch fallback result: " + JSON.stringify(cause.result.directLaunch.fallback));
            } else if (cause.result.sendToDevice != null) {
                // handle V2 send to device result
                console.log("Send to device result: " + JSON.stringify(cause.result.sendToDevice));
            } else if (cause.result.primary || cause.result.fallback) {
                // This is needed only if code handles both V1 and V2 AppLink interface during V1 to V2 migration period
                console.log("V1 primary result: " + JSON.stringify(cause.result.primary));
                console.log("V1 fallback result: " + JSON.stringify(cause.result.fallback));
            } else {
                // Unknown response
                console.log("~~~~ Error: unknown response: " + JSON.stringify(cause.result));
            }
        }
        return handlerInput.responseBuilder.withShouldEndSession(true).getResponse();
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
        const appLinkState = handlerInput.requestEnvelope.context[APP_LINK_STATE];
        if(appLinkState) {
            if (appLinkState.supportedCatalogTypes) {
                // This means request is V1, which should not happen after skill declares support for APP_LINKS_V2 interface.
                // But we could use this branch if the same code base is used during migration for skills 
                // in both development and live stage that support different version of APP_LINKS interface.
            } else if (appLinkState.sendToDevice || appLinkState.directLaunch) {
                console.log(appLinkState);
                // create links per supported catalog type
                let links = {
                    GOOGLE_PLAY_STORE: {
                        primary: {
                            ANDROID_PACKAGE : {
                                packageIdentifier: AMAZON_ANDROID_PACKAGE
                            }
                        }
                    },
                    IOS_APP_STORE: {
                        primary: {
                            UNIVERSAL_LINK: {
                                appIdentifier: AMAZON_IOS_ID,
                                url: "https://www.amazon.com"
                            }
                        }
                    }
                };
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(links, "open Amazon shopping app."))
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
        const appLinkState = handlerInput.requestEnvelope.context[APP_LINK_STATE];
        if(appLinkState) {
            if (appLinkState.supportedCatalogTypes) {
                // This means request is V1, which should not happen after skill declares support for APP_LINKS_V2 interface.
                // But we could use this branch if the same code base is used during migration for skills 
                // in both development and live stage that support different version of APP_LINKS interface.
            } else if (appLinkState.sendToDevice || appLinkState.directLaunch) {
                // create links per supported catalog type
                let links = {
                    GOOGLE_PLAY_STORE: {
                        primary: {
                            UNIVERSAL_LINK : {
                                appIdentifier: AMAZON_ANDROID_PACKAGE,
                                url: AMAZON_ORDER_HISTORY_URL
                            }
                        }
                    },
                    IOS_APP_STORE: {
                        primary: {
                            UNIVERSAL_LINK: {
                                appIdentifier: AMAZON_IOS_ID,
                                url: AMAZON_ORDER_HISTORY_URL
                            }
                        }
                    }
                };
                const topic = "See your order history";
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(links, topic, true
                    )).getResponse();
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

        const appLinkState = handlerInput.requestEnvelope.context[APP_LINK_STATE];
        if(appLinkState) {
            //If there is a query, append it as a query Param, otherwise just open the search page.
            let searchUrl = new url.URL(AMAZON_SEARCH_URL);
            let queryParams = new url.URLSearchParams();
            queryParams.set(AMAZON_SEARCH_QUERY_PARAM, searchQuery);
            searchUrl.search = queryParams;
            const deeplink = searchQuery != null ? searchUrl.toString() : AMAZON_SEARCH_URL;

            if (appLinkState.supportedCatalogTypes) {
                // This means request is V1, which should not happen after skill declares support for APP_LINKS_V2 interface.
                // But we could use this branch if the same code base is used during migration for skills 
                // in both development and live stage that support different version of APP_LINKS interface.
            } else if (appLinkState.sendToDevice || appLinkState.directLaunch) {
                // create links per supported catalog type
                let links = {
                    GOOGLE_PLAY_STORE: {
                        primary: {
                            UNIVERSAL_LINK : {
                                appIdentifier: AMAZON_ANDROID_PACKAGE,
                                url: deeplink
                            }
                        }
                    },
                    IOS_APP_STORE: {
                        primary: {
                            UNIVERSAL_LINK: {
                                appIdentifier: AMAZON_IOS_ID,
                                url: deeplink
                            }
                        }
                    }
                };

                const topic = `See search results for ${searchQuery}.`;
                //Send the app links response!
                return handlerInput.responseBuilder.addDirective(createAppLinkSkillConnection(
                    links, topic, true
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
        const speakOutput = `This skill can launch a deep link to the Amazon shopping mobile app directly or via a push notification.
            It works from the context of the Alexa mobile deivce as well as Echo devices.
            You can ask me to deep link into the Amazon shopping app\'s order history, search page, or simply opening the app.
            What would you like me to do?`;

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
            .withShouldEndSession(true)
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
