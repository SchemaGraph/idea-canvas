/*!
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance with the License. A copy of
 * the License is located at
 *     http://aws.amazon.com/asl/
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
import { ApolloLink, Observable, Operation } from 'apollo-link';

import * as Paho from './paho-mqtt';

const Client = Paho.Client as any;
type PahoClient = typeof Client;
export class SubscriptionHandshakeLink extends ApolloLink {
  private subsInfoContextKey: string;

  private clientTopics: Map<PahoClient, string[]> = new Map();

  private topicObserver: Map<
    string,
    ZenObservable.SubscriptionObserver<object>
  > = new Map();

  constructor(subsInfoContextKey: string) {
    super();
    this.subsInfoContextKey = subsInfoContextKey;
  }

  request(operation: Operation) {
    console.log(operation.getContext());
    const { [this.subsInfoContextKey]: subsInfo } = operation.getContext();

    if (subsInfo.errors) {
      throw subsInfo.errors;
    }
    const {
      extensions: {
        subscription: { newSubscriptions, mqttConnections },
      },
    } = subsInfo;

    const newTopics = Object.keys(newSubscriptions).map(
      subKey => newSubscriptions[subKey].topic
    );
    const prevTopicsSet = new Set(this.topicObserver.keys());
    const newTopicsSet = new Set(newTopics);
    const lastTopicObserver = new Map(this.topicObserver);

    const connectionsInfo = mqttConnections
      .map((connInfo: any) => {
        const connTopics = connInfo.topics;

        const topicsForClient = new Set([
          ...connTopics.filter((x: any) => prevTopicsSet.has(x)),
          ...connTopics.filter((x: any) => newTopicsSet.has(x)),
        ]);

        return {
          ...connInfo,
          topics: Array.from(topicsForClient.values()),
        };
      })
      .filter((connInfo: any) => connInfo.topics.length);

    return new Observable(observer => {
      Promise.resolve()
        // Disconnect existing clients, wait for them to disconnect
        .then(this.disconnectAll)
        // Connect to all topics
        .then(
          this.connectAll.bind(
            this,
            observer,
            connectionsInfo,
            lastTopicObserver
          )
        );

      return () => {
        const [topic = null] =
          Array.from(this.topicObserver).find(
            ([_topic, obs]) => obs === observer
          ) || [];

        if (topic) {
          const [client = null] =
            Array.from(this.clientTopics).find(
              ([_client, t]) => t.indexOf(topic) > -1
            ) || [];
          if (client) {
            this.unsubscribeFromTopic(client, topic).then(() => {
              const activeTopics = this.clientTopics.get(client) || [];

              if (!activeTopics.length) {
                this.disconnectClient(client, activeTopics);
              }
            });
          }
        }
      };
    });
  }

  /**
   * @returns  {Promise<void>}
   */
  disconnectAll = () => {
    const disconnectPromises = Array.from(this.clientTopics).map(
      ([client, topics]) => this.disconnectClient(client, topics)
    );

    return Promise.all(disconnectPromises).then(() => undefined);
  };

  unsubscribeFromTopic = (client: any, topic: string) => {
    return new Promise((resolve, reject) => {
      if (!client.isConnected()) {
        const topics = this.clientTopics.get(client)!.filter(t => t !== topic);
        this.clientTopics.set(client, topics);
        this.topicObserver.delete(topic);
        return resolve(topic);
      }

      client.unsubscribe(topic, {
        onSuccess: () => {
          const topics = this.clientTopics
            .get(client)!
            .filter(t => t !== topic);
          this.clientTopics.set(client, topics);
          this.topicObserver.delete(topic);
          resolve(topic);
        },
        onFailure: reject,
      });
    });
  };

  /**
   *
   * @param {Paho.Client} client
   * @param {Set<string>} topics
   */
  disconnectClient = (client: any, topics: string[]) => {
    // console.log(`Unsubscribing from ${topics.length} topics`, topics);

    const unsubPromises: Array<Promise<{}>> = [];
    topics.forEach(topic => {
      unsubPromises.push(this.unsubscribeFromTopic(client, topic));
    });

    return Promise.all(unsubPromises).then(([...topicss]) => {
      // console.log(`Unsubscribed from ${topics.length} topics`, topics);

      return new Promise((resolve, _reject) => {
        if (!client.isConnected()) {
          return resolve({ client, topicss });
        }

        client.onConnectionLost = () => resolve({ client, topicss });

        client.disconnect();
      });
    });
  };

  /**
   *
   * @param {ZenObservable.Observer} observer
   * @param {[any]} connectionsInfo
   * @returns {Promise<void>}
   */
  connectAll = (
    observer: ZenObservable.Observer<any>,
    connectionsInfo = [],
    lastTopicObserver: any
  ) => {
    const connectPromises = connectionsInfo.map(
      this.connect.bind(this, observer, lastTopicObserver)
    );

    return Promise.all(connectPromises).then(() => undefined);
  };

  connect = (
    observer: ZenObservable.Observer<any>,
    lastTopicObserver: any,
    connectionInfo: any
  ) => {
    const { topics, client: clientId, url } = connectionInfo;

    const client: any = new Client(url, clientId);
    // client.trace = console.log.bind(null, clientId);

    (client as any).onMessageArrived = (m: any) =>
      this.onMessage(m.destinationName, m.payloadString);

    return new Promise((resolve, reject) => {
      client.connect({
        useSSL: url.indexOf('wss://') === 0,
        mqttVersion: 3,
        onSuccess: () => resolve(client),
        onFailure: reject,
      });
    }).then((cclient: any) => {
      // console.log(`Doing setup for ${topics.length} topics`, topics);

      const subPromises = topics.map(
        (topic: any) =>
          new Promise((resolve, reject) => {
            (cclient as any).subscribe(topic, {
              onSuccess: () => {
                if (!this.topicObserver.has(topic)) {
                  this.topicObserver.set(
                    topic,
                    lastTopicObserver.get(topic) || observer
                  );
                }

                resolve(topic);
              },
              onFailure: reject,
            });
          })
      );

      return Promise.all(subPromises).then(([...ttopics]: any[]) => {
        // console.log('All topics subscribed', topics);

        this.clientTopics.set(cclient, ttopics);

        return { cclient, ttopics };
      });
    });
  };

  onMessage = (topic: string, message: any) => {
    const parsedMessage = JSON.parse(message);
    const observer = this.topicObserver.get(topic);

    // console.log(topic, parsedMessage);
    if (observer) {
      try {
        observer.next(parsedMessage);
      } catch (err) {
        console.error(err);
      }
    }
  };
}
