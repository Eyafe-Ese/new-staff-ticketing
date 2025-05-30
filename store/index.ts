import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import complaintsReducer from './complaintsSlice';
import { setStoreRef } from '../utils/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Set store reference for API interceptors
setStoreRef(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 