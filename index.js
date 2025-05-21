const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const ambient = require('ambient-lib');
const ChannelId = process.env.CHANNELID;
const WriteKey = process.env.WRITEKEY;
const ReadKey = process.env.READKEY;
const UserKey = process.env.USERKEY;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        try {
            const temperature = await RoomTemp();
            const speechText = `はい。<break time="1s"/>お部屋の温度は${temperature[0].d1}度、湿度は${temperature[0].d2}パーセント、気圧は${temperature[0].d3}ヘクトパスカルです。`;
            return handlerInput.responseBuilder
                .speak(speechText)
                .getResponse();
        } catch (error) {
            console.error('エラーが発生しました:', error);
            return handlerInput.responseBuilder
                .speak('申し訳ありません、センサーからデータを取得できませんでした。')
                .getResponse();
        }
    }
};

function RoomTemp() {
    return new Promise((resolve, reject) => {
        try {
            ambient.connect(ChannelId, WriteKey, ReadKey, UserKey);
            ambient.read({n:1}, function(err, res, data) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'リビングの温度をお伝えします。';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
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
        const speechText = 'バイバイ！';
        return handlerInput.responseBuilder
            .speak(speechText)
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

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`~~~~ Error handled: ${error.message}`);
        const speechText = `すみません、よく理解できませんでした。もう一度言ってください。`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .lambda();
