import Vue from 'vue';
import VueApollo from 'vue-apollo';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';

import { ApolloClient } from 'apollo-client';
import { WebSocketLink } from 'apollo-link-ws';
import { createHttpLink } from "apollo-link-http";
import { split } from "apollo-link";
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { getMainDefinition } from 'apollo-utilities';

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: 'http://localhost:8080/v1/graphql',
});

const wsLink = new WebSocketLink({
  uri: 'ws://localhost:8080/v1/graphql',
  options: {
    reconnect: true,
    connectionParams: {
      headers: {
        "x-hasura-admin-secret": "edv"
      }
    }
  }
});

const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
          definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink
);

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      "x-hasura-admin-secret": "edv"
    }
  }
});

// Cache implementation
const cache = new InMemoryCache();

// Create the apollo client
const apolloClient = new ApolloClient({
  //link: authLink.concat(httpLink),
  link: authLink.concat(link),
  cache,
});

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
});

Vue.config.productionTip = false;
Vue.use(VueApollo);

new Vue({
  router,
  store,
  vuetify,
  apolloProvider,
  render: h => h(App)
}).$mount('#app');
