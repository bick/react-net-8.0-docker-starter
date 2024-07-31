import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import axios from 'axios';

// Define the interface for an Organization
interface Organization {
    id: number;
    ein: string;
    orgName: string;
    city: string;
    state: string;
    country: string;
    status: string;
}

// Define the interface for a Search
interface Search {
    query: string;
    timestamp: string;
}

// Define the state interface for the slice
interface OrganizationState {
    items: Organization[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    search: string;
    loading: boolean;
    error: string | null;
    fetchingIrsData: boolean;
    irsDataError: string | null;
    searchAuditTrail: Search[];
}

// Initial state for the slice
const initialState: OrganizationState = {
    items: [],
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    search: '',
    loading: false,
    error: null,
    fetchingIrsData: false,
    irsDataError: null,
    searchAuditTrail: []
};

// Base URL for API requests
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8888/api';

// Thunk to fetch organizations
export const fetchOrganizations = createAsyncThunk(
    'organization/fetchOrganizations',
    async ({search, page, pageSize}: { search: string; page: number; pageSize: number }, {rejectWithValue}) => {
        try {
            // Making GET request to fetch organizations
            const response = await axios.get(`${API_BASE_URL}/Organization`, {
                headers: {
                    'accept': '*/*'
                },
                params: {
                    search,
                    page,
                    pageSize
                }
            });
            return response.data;
        } catch (error) {
            // Handling errors
            if (axios.isAxiosError(error)) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('An unknown error occurred');
        }
    }
);

// Thunk to fetch IRS data
export const fetchIrsData = createAsyncThunk(
    'organization/fetchIrsData',
    async (_, {rejectWithValue}) => {
        try {
            // Making POST request to fetch IRS data
            const response = await axios.post(`${API_BASE_URL}/Organization/fetch-irs-data`);
            return response.data;
        } catch (error) {
            // Handling errors
            if (axios.isAxiosError(error)) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('An unknown error occurred');
        }
    }
);

// Thunk to delete all organizations
export const deleteAllOrganizations = createAsyncThunk(
    'organization/deleteAllOrganizations',
    async (_, {rejectWithValue}) => {
        try {
            // Making POST request to delete all organizations
            const response = await axios.post(`${API_BASE_URL}/Organization/delete-all`);
            return response.data;
        } catch (error) {
            // Handling errors
            if (axios.isAxiosError(error)) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('An unknown error occurred');
        }
    }
);

// Create the organization slice
const organizationSlice = createSlice({
    name: 'organization',
    initialState,
    reducers: {
        // Reducer to set the search string and reset current page
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
            state.currentPage = 1;
        },
        // Reducer to search organizations and update the search audit trail
        searchOrganizations: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
            state.currentPage = 1;
            if (action.payload.trim() !== '' && !state.searchAuditTrail.some(search => search.query === action.payload.trim())) {
                state.searchAuditTrail.push({query: action.payload, timestamp: new Date().toISOString()});
            }
        },
        // Reducer to reset the search string and current page
        resetSearch: (state) => {
            state.search = '';
            state.currentPage = 1;
        },
        // Reducer to set the current page
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        // Reducer to set the page size and reset current page
        setPageSize: (state, action: PayloadAction<number>) => {
            state.pageSize = action.payload;
            state.currentPage = 1;
        },
        // Reducer to delete a search from the search audit trail
        deleteSearch: (state, action: PayloadAction<string>) => {
            state.searchAuditTrail = state.searchAuditTrail.filter(search => search.timestamp !== action.payload);
        }
    },
    // Handling extra reducers for async actions
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrganizations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrganizations.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.totalRecords = action.payload.totalRecords;
                state.totalPages = action.payload.totalPages;
            })
            .addCase(fetchOrganizations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchIrsData.pending, (state) => {
                state.fetchingIrsData = true;
                state.irsDataError = null;
            })
            .addCase(fetchIrsData.fulfilled, (state) => {
                state.fetchingIrsData = false;
            })
            .addCase(fetchIrsData.rejected, (state, action) => {
                state.fetchingIrsData = false;
                state.irsDataError = action.payload as string;
            })
            .addCase(deleteAllOrganizations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAllOrganizations.fulfilled, (state) => {
                state.loading = false;
                state.items = [];
                state.totalRecords = 0;
                state.totalPages = 0;
            })
            .addCase(deleteAllOrganizations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

// Export the action creators
export const {
    setSearch,
    searchOrganizations,
    resetSearch,
    setCurrentPage,
    setPageSize,
    deleteSearch
} = organizationSlice.actions;

// Export the reducer
export default organizationSlice.reducer;
