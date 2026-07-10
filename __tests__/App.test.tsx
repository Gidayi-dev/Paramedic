import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { store } from '../src/state/store';

jest.mock('../src/data/database', () => ({
  database: {
    collections: {
      get: jest.fn(() => ({
        query: jest.fn(() => ({
          fetch: jest.fn().mockResolvedValue([]),
        })),
      })),
    },
  },
}));

jest.mock('../src/sync/useNetworkSync', () => ({
  useNetworkSync: jest.fn(),
}));

import App from '../App';

test('app renders without crashing', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });
  // No assertion needed – if we get here, no crash.
  expect(true).toBe(true);
});