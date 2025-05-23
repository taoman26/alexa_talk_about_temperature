import askSdkCore from 'ask-sdk-core';
import Ambient from 'ambient-lib';

const { SkillBuilders } = askSdkCore;

const ChannelId = process.env.CHANNELID;
const WriteKey = process.env.WRITEKEY;
const ReadKey = process.env.READKEY;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        try {
            const response = await RoomTemp();
            
            // レスポンスに直接データが含まれている場合
            let data;
            if (response && Array.isArray(response) && response.length > 0) {
                data = response;
            }
            // エラーオブジェクトの中にデータがある場合（ステータス200）
            else if (response && response.status === 200 && response.data && Array.isArray(response.data)) {
                data = response.data;
            }
            // それ以外の場合はエラー
            else {
                console.error('不正なデータ形式:', response);
                throw new Error('データ形式が不正です');
            }
            
            const speechText = `はい。<break time="1s"/>お部屋の温度は${data[0].d1}度、湿度は${data[0].d2}パーセント、気圧は${data[0].d3}ヘクトパスカルです。`;
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
            const ambient = new Ambient(ChannelId, WriteKey, ReadKey);
            
            ambient.read({n:1}, function(err, res, data) {
                // エラーがあっても、データとしてHTTP 200応答が返ってきている場合は成功とみなす
                if (err) {
                    if (err.status === 200 && err.data && Array.isArray(err.data)) {
                        resolve(err.data);
                    } else {
                        console.error('Ambientデータ取得エラー:', err);
                        reject(err);
                    }
                } else if (data) {
                    // 通常の成功パターン
                    resolve(data);
                } else {
                    // どちらも存在しない場合
                    reject(new Error('データが取得できませんでした'));
                }
            });
        } catch (error) {
            console.error('Ambient接続エラー:', error);
            reject(error);
        }
    });
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'お部屋の温度をお伝えします。';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
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
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
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

export const handler = SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .lambda();
