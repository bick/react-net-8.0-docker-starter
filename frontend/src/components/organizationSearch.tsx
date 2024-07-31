import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {AppDispatch, RootState} from '../redux/store';
import {
    deleteAllOrganizations,
    deleteSearch,
    fetchIrsData,
    fetchOrganizations,
    resetSearch,
    searchOrganizations,
    setCurrentPage,
    setPageSize
} from '../redux/organizationSlice';

const OrganizationSearch: React.FC = () => {
    // Redux dispatch function to dispatch actions
    const dispatch: AppDispatch = useDispatch();

    // Local state for the search input
    const [searchInput, setSearchInput] = useState('');

    // Selecting necessary state from the Redux store
    const {
        items,
        totalRecords,
        totalPages,
        currentPage,
        pageSize,
        search,
        loading,
        error,
        fetchingIrsData,
        irsDataError,
        searchAuditTrail
    } = useSelector((state: RootState) => state.organization);

    // useEffect to fetch organizations on component mount and when search, currentPage, or pageSize changes
    useEffect(() => {
        dispatch(fetchOrganizations({search, page: currentPage, pageSize}));
    }, [dispatch, search, currentPage, pageSize]);

    // Handler for search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    };

    // Handler for search button click
    const handleSearch = () => {
        if (searchInput.trim() !== '') {
            dispatch(searchOrganizations(searchInput));
        }
    };

    // Handler for reset search button click
    const handleResetSearch = () => {
        setSearchInput('');
        dispatch(resetSearch());
    };

    // Handler for enter key press in search input field
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Handler for page change
    const handlePageChange = (newPage: number) => {
        dispatch(setCurrentPage(newPage));
    };

    // Handler for page size change
    const handlePageSizeChange = (e: SelectChangeEvent<number>) => {
        dispatch(setPageSize(Number(e.target.value)));
    };

    // Handler to fetch IRS data
    const handleFetchIrsData = async () => {
        try {
            await dispatch(fetchIrsData()).unwrap();
            toast.success('IRS data fetch started successfully.');
        } catch (error) {
            toast.error('Failed to start IRS data fetch.');
        }
    };

    // Handler to delete all organizations
    const handleDeleteAllOrganizations = async () => {
        toast.success('Deletion of all data started.');
        try {
            await dispatch(deleteAllOrganizations()).unwrap();
            toast.success('All data has been deleted successfully.');
        } catch (error) {
            toast.error('Failed to delete all data.');
        }
    };

    // Handler to delete a specific search from the audit trail
    const handleDeleteSearch = (timestamp: string) => {
        dispatch(deleteSearch(timestamp));
    };

    // Function to get status information
    const getStatusInfo = (statuses: string) => {
        const statusInfo: { [key: string]: string } = {
            PC: `A public charity. Deductibility Limit (PC): 50% (60% for cash contributions)`,
            POF: `A private operating foundation. Deductibility Limit (POF): 50% (60% for cash contributions)`,
            PF: `A private foundation. Deductibility Limit (PF): 30% (generally)`,
            GROUP: `Generally, a central organization holding a group exemption letter. Deductibility Limit (GROUP): Depends on various factors`,
            LODGE: `A domestic fraternal society, operating under the lodge system. Deductibility Limit (LODGE): 30%`,
            UNKWN: `A charitable organization whose public charity status has not been determined. Deductibility Limit (UNKWN): Depends on various factors`,
            EO: `An organization described in section 170(c) of the Internal Revenue Code other than a public charity or private foundation. Deductibility Limit (EO): Depends on various factors`,
            FORGN: `A foreign-addressed organization. Deductibility Limit (FORGN): Depends on various factors`,
            SO: `A Type I, Type II, or functionally integrated Type III supporting organization. Deductibility Limit (SO): 50% (60% for cash contributions)`,
            SONFI: `A non-functionally integrated Type III supporting organization. Deductibility Limit (SONFI): 50% (60% for cash contributions)`,
            SOUNK: `A supporting organization, unspecified type. Deductibility Limit (SOUNK): 50% (60% for cash contributions)`,
        };

        return (
            <ul>
                {statuses.split(',').map(status => (
                    <li key={status.trim()}>{statusInfo[status.trim()] || 'Unknown status'}</li>
                ))}
            </ul>
        );
    };

    return (
        <Box sx={{m: 2}}>
            {/* Toast container for notifications */}
            <ToastContainer/>

            {/* Header with buttons to fetch IRS data and delete all data */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                <Typography variant="h5">IRS Publication 78 Search Engine</Typography>
                <Box>
                    <Button variant="contained" color="primary" onClick={handleFetchIrsData} disabled={fetchingIrsData}
                            sx={{mr: 2}}>
                        Fetch IRS Data
                    </Button>
                    <Button variant="contained" color="error" onClick={handleDeleteAllOrganizations}>
                        Delete All Data from DB
                    </Button>
                </Box>
            </Box>

            {/* Search box and controls */}
            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                <TextField
                    label="Search organizations by EIN or Name..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    variant="outlined"
                    size="small"
                    sx={{mr: 2, flex: 1}}
                />
                <Button variant="contained" color="primary" onClick={handleSearch} sx={{mr: 2}}>
                    Search
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleResetSearch} sx={{mr: 2}}>
                    Reset
                </Button>
                <Select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    variant="outlined"
                    size="small"
                    sx={{minWidth: '100px'}}
                >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                </Select>
            </Box>

            {/* Search history */}
            <Box sx={{mb: 2}}>
                <Typography variant="h6">
                    Search History
                </Typography>
                <ul>
                    {searchAuditTrail.map((search, index) => (
                        <li key={index}>
                            {search.query} (searched on {new Date(search.timestamp).toLocaleString()})
                            <Button onClick={() => handleDeleteSearch(search.timestamp)} size="small" sx={{ml: 1}}>
                                Delete
                            </Button>
                        </li>
                    ))}
                </ul>
            </Box>

            {/* Displaying loading, error, or the list of organizations */}
            {loading ? (
                <Typography>Loading...</Typography>
            ) : error ? (
                <Typography color="error">Error: {error}</Typography>
            ) : (
                <Box>
                    {items.map((org) => (
                        <Accordion key={org.id}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                <Typography sx={{width: '50%', flexShrink: 0}}>
                                    {org.orgName}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography>EIN: {org.ein}</Typography>
                                <Typography>ID: {org.id}</Typography>
                                <Typography>City: {org.city}</Typography>
                                <Typography>State: {org.state}</Typography>
                                <Typography>Country: {org.country}</Typography>
                                <Typography>Status: {org.status}</Typography>
                                {getStatusInfo(org.status)}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {/* Pagination controls */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2}}>
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    Previous
                </Button>
                <Typography>
                    Page {currentPage} of {totalPages}
                </Typography>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default OrganizationSearch;
