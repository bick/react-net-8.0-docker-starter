import {configureStore} from '@reduxjs/toolkit';
import organizationReducer from './organizationSlice';

// Configuring the Redux store
const store = configureStore({
    // Adding the organization reducer to the store
    reducer: {
        organization: organizationReducer
    }
});

// Type for the RootState derived from the store's state
export type RootState = ReturnType<typeof store.getState>;

// Type for the AppDispatch derived from the store's dispatch
export type AppDispatch = typeof store.dispatch;

// Exporting the configured store
export default store;
