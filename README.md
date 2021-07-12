## Alexa App Links Skill Sample

This sample uses the [Alexa for Apps](https://alexa.design/alexa-for-apps) App Link Skill Connection API in order to deep link into the Amazon shopping app via direct launch or push notification. [iOS](https://apps.apple.com/us/app/amazon-shopping/id297606951), [Android](https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping&hl=en_US)

You will need an [Amazon developer account](https://developer.amazon.com/) in order to run this sample. In addition, you will need to sign up for Alexa for Apps and be accepted. [Sign up here.](https://build.amazonalexadev.com/2020Alexa_for_Apps_Alexa.html)

## Features
* Open the Amazon shopping app from Alexa on mobile (fallback to the app store).
* Deep link into your order details on the app with a fallback to the mobile website. 
* Deep link to the search results page passing along an AMAZON.SearchQuery slot with a fallback to the mobile website.  
* Send push notification/Alexa app home card which can deeplink into Amazon shopping app.

## Build instructions

### Set up Skill with Alexa Hosted with ASK CLI V2

1. Fork, clone, or download this repository.
2. From the directory, Run `ask init `
3. TODO: rest of instructions. 

### Set up using Alexa Hosted GUI

### Node JS
If you would like to use the Developer Portal, you can follow the steps outlined in the [Hello World](https://github.com/alexa/skill-sample-nodejs-hello-world) example, substituting the [Model](./skill-package/interactionModels/custom/en-US.json) and the [skill code](./lambda/node/index.js) when called for. 

## Running the sample

First, you will need a mobile phone with the Alexa mobile app installed, an Alexa mobile accessory (for instance, Echo buds), or an Alexa-ready phone. 

### Direct Launch Experience
1. Invoke Alexa. For the mobile app, you will have to open the app and click the Alexa icon in the middle of the bottom bar. For companion devices or the phone, you can use the "Alexa" wake word.
2. "Open deep link sample"
3. Enjoy! 

### Send to Device Experience
1. Log in Alexa app and pair an Echo device.
2. Invoke Alexa on the echo device: "Open deep link sample".
3. Enjoy!

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the Amazon Software License.

