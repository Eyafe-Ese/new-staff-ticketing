import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { setStoreRef } from '../utils/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Set the store reference in the API utility
setStoreRef(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 