import Select from "react-select";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SessionPlanSelect from "./SessionPlanSelect";
import { useNavigate, } from 'react-router-dom';
import Loader from '../../../contexts/Loader';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSearchParams } from "react-router-dom";
import { useHolidayTerm } from "../../../contexts/HolidayTermsContext";
import { showError, showSuccess } from "../../../../../../utils/swalHelper";

const initialTerms = [];
const HolidayTermsCreate = () => {
    const token = localStorage.getItem("adminToken");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [searchParams] = useSearchParams();
    const mapSectionRef = useRef(null);
    const id = searchParams.get("id");
    const [holidayTerms, setHolidayTerms] = useState({
        startDate: null,
        endDate: null,
        numberOfDays: 0,
    });


    const [terms, setTerms] = useState(initialTerms);
    const [activeSessionValue, setActiveSessionValue] = useState('');
    const [sessionMappings, setSessionMappings] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isGroupSaved, setIsGroupSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionsMap, setSessionsMap] = useState([]);
    const [savedTermIds, setSavedTermIds] = useState(new Set());
    const [isMapping, setIsMapping] = useState(false);
    const navigate = useNavigate();

    const { createHolidayCamp, updateHolidayCampDate, selectedTerm, myGroupData, setMyGroupData, setSelectedTermGroup, selectedTermGroup, fetchHolidayCampDate, termData, fetchCampDateId, loading } = useHolidayTerm();


    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                setMyGroupData(null);
                await fetchCampDateId(id);

            };

            fetchData();
        } else {
            setSelectedTermGroup(null);
        }
    }, [id]); // include fetchCampGroupId if it's stable (e.g., useCallback)
    function formatDateLocal(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    const handleMapClick = () => {
        if (!holidayTerms.startDate || !holidayTerms.endDate) {
            showError("Error", "Please select dates first");
            return;
        }

        setIsMapping(true);
    };

    function handleDateChange(field, date) {
        if (!date) return;

        setHolidayTerms((prev) => {
            const newTerm = { ...prev, [field]: date };

            if (newTerm.startDate && newTerm.endDate) {
                const start = new Date(newTerm.startDate);
                start.setHours(0, 0, 0, 0);

                const end = new Date(newTerm.endDate);
                end.setHours(0, 0, 0, 0);

                if (end < start) {
                    return newTerm;
                }

                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

                // 🎯 STEP 1: Create new sessions
                const newSessions = [];
                for (let i = 0; i < diffDays; i++) {
                    const d = new Date(start);
                    d.setDate(start.getDate() + i);

                    const formattedDate = formatDateLocal(d);

                    // 🎯 STEP 2: Try to find old session for the same date
                    const oldSession = sessionMappings?.find(
                        (s) => s.sessionDate === formattedDate
                    );

                    newSessions.push({
                        sessionDate: formattedDate,
                        sessionPlanId: oldSession ? oldSession.sessionPlanId : null, // 🔥 PRESERVE OLD ID
                    });
                }

                // 🎯 STEP 3: Update session mappings WITHOUT losing sessionPlanId
                setSessionMappings(newSessions);

                return {
                    ...newTerm,
                    numberOfDays: diffDays,
                };
            }

            return newTerm;
        });
    }


    // Second: Wait for isEditMode + termData + selectedTermGroup
    useEffect(() => {

        if (id && selectedTerm?.id) {

            setMyGroupData(null);
            setGroupName(selectedTerm?.holidayCamp?.name);
            setIsGroupSaved(true);



            setHolidayTerms({
                startDate: selectedTerm.startDate,
                endDate: selectedTerm.endDate,
                numberOfDays: selectedTerm.totalDays,
            })
            if (selectedTerm?.sessionsMap?.length) {
                const mappedTerms = {
                    id: selectedTerm.id,
                    startDate: selectedTerm.startDate,
                    endDate: selectedTerm.endDate,
                    sessions: selectedTerm.sessionsMap?.length || 0,
                    isOpen: false,
                    sessionsMap: selectedTerm.sessionsMap || [],
                };

                console.log("mappedTerms", mappedTerms);

                const extractedData = selectedTerm.sessionsMap.map((session) => ({
                    sessionDate: session.sessionDate,
                    sessionPlanId: session.sessionPlanId,
                    termId: id,
                }));

                setSavedTermIds((prev) => {
                    const updated = new Set(prev);
                    updated.add(mappedTerms.id); // <-- Correct
                    return updated;
                });

                console.log('extractedData', extractedData)

                setSessionMappings(extractedData);
            }

        }
    }, [id, selectedTerm]);
    console.log('selectedTerm', selectedTerm)
    const handleGroupNameSave = async () => {
        if (!groupName.trim()) {
            showError("Error", "Please enter a name for the term camp");
            return;
        }

        setMyGroupData(null);

        try {
            const payload = { name: groupName };

            let apiResponse;

            if (id || myGroupData?.id) {
                // Update existing camp
                apiResponse = await updateHolidayCampDate((myGroupData?.id || selectedTerm.holidayCamp?.id), payload);
            } else {
                // Create new camp
                apiResponse = await createHolidayCamp(payload);
            }

            // Try to extract message (if API returns text or json)
            let message = "";

            if (typeof apiResponse === "string") {
                message = apiResponse;
            } else if (apiResponse?.message) {
                message = apiResponse.message;
            } else {
                message = id
                    ? "Camp updated successfully"
                    : "Camp created successfully";
            }

            showSuccess(id ? "Camp Updated" : "Camp Created", message);
            if (id) {
                setIsEditMode(false)
            }

            setIsGroupSaved(true);
        } catch (error) {
            showError("Error", error?.message || "Failed to save Camp name");
        }
    };



    const deleteCampDate = () => {
        setHolidayTerms({
            startDate: null,
            endDate: null,
            numberOfDays: 0,
        });
        setSessionMappings([]);
    }



    useEffect(() => {
        const openTerm = terms.find(t => t.isOpen);
        if (openTerm) {

            setActiveSessionValue(openTerm.sessions || '');
            // Load either saved mappings or unsaved mappings
            setSessionMappings(openTerm.sessionsMap.length > 0 ?
                openTerm.sessionsMap :
                openTerm.unsavedSessionMappings || []);

        } else {
            setActiveSessionValue('');
            setSessionMappings([]);
        }
    }, [terms]);



    const handleMappingChange = (index, field, value) => {
        if (field === "sessionPlanId") {
            // ignore empty values
            if (!value) {
                const updated = [...sessionMappings];
                updated[index] = { ...updated[index], sessionPlanId: "" };
                setSessionMappings(updated);
                return;
            }

            // check duplicate
            const alreadyExists = sessionMappings.some(
                (item, idx) => idx !== index && item.sessionPlanId === value
            );

            if (alreadyExists) {
                return;
            }
        }

        const updated = [...sessionMappings];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };
        setSessionMappings(updated);
    };


    const handleSaveMappings = () => {
        // If empty
        if (!sessionMappings.length) {
            showError("Error", "Please add at least one session mapping.");
            return;
        }

        // Validate fields
        const isValid = sessionMappings.every(
            (mapping) => mapping.sessionDate && mapping.sessionPlanId
        );

        if (!isValid) {
            showError("Error", "Please fill all session mappings completely.");
            return;
        }

        // Save
        setSessionsMap(sessionMappings);
        setIsMapping(false);

        // Success
        showSuccess("Success", "Session mappings saved successfully.");
    };

    // Determine if it's an existing term (edit)

    const toDateOnly = (date) => {
        if (!date) return null;
        const d = new Date(date);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        // PURE DATE, NO TIMEZONE CONVERSION POSSIBLE
        return `${year}-${month}-${day}`;
    };
    console.log('myGroupData', myGroupData)

    const handleSaveCamp = async () => {

        if (id && !selectedTerm) {
            console.error("Missing termGroupId");
            return;
        }

        if (!holidayTerms.startDate || !holidayTerms.endDate) {
            showError("Error", "Please fill all required fields for the term");
            return;
        }

        // Validate session mappings
        if (
            sessionMappings.length === 0 ||
            sessionMappings.some(mapping => !mapping.sessionPlanId)
        ) {
            showError("Error", "Please map all sessions before saving the term");
            return;
        }

        const payload = {
            holidayCampId: selectedTerm?.holidayCampId || selectedTerm?.holidayCamp?.id,
            sessionPlanGroupId: 1, // static value
            startDate: toDateOnly(holidayTerms.startDate),
            endDate: toDateOnly(holidayTerms.endDate),
            totalDays: holidayTerms?.numberOfDays,
            sessionsMap: sessionMappings.map((session) => ({
                sessionDate: session.sessionDate,
                sessionPlanId: session.sessionPlanId,
            })),
        };




        const requestUrl = id
            ? `${API_BASE_URL}/api/admin/holiday/campDate/update/${id}`
            : `${API_BASE_URL}/api/admin/holiday/campDate/create`;
        const method = id ? "PUT" : "POST";

        setIsLoading(true);
        try {
            const response = await fetch(requestUrl, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save term.');
            }


            await fetchHolidayCampDate();

            showSuccess("Success", data.message || 'Term Saved Successfully');



            navigate('/configuration/holiday-camp/terms/list');

        } catch (error) {
            console.error("❌ Error saving term:", error);
            showError("Error", error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    console.log('myGroupData?.id', myGroupData?.id)




    if (loading) return <Loader />;
    return (
        <div className="md:p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2">
                <h2
                    ref={mapSectionRef}
                    onClick={() => {
                        navigate('/configuration/holiday-camp/terms/list');
                        setIsEditMode(false);
                        setGroupName('');
                        setTerms([]);
                        setMyGroupData(null)
                    }}
                    className="text-xl md:text-[28px] font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 duration-200">
                    <img
                        src="/images/icons/arrow-left.png"
                        alt="Back"
                        className="w-5 h-5 md:w-6 md:h-6"
                    />
                    <span className="truncate">{id ? 'Update Holiday Camp Dates' : 'Add Holiday Camp Dates'}</span>
                </h2>
            </div>
            <div className="flex flex-col gap-8 md:flex-row rounded-3xl w-full">
                <div className="transition-all duration-300 md:w-1/2">
                    <h3 className="font-semibold  mb-4 text-[24px]"> <b>Step 1: </b>Add camp Dates </h3>
                    <div className="rounded-2xl mb-5 bg-white md:p-6">
                        <div className="border border-gray-200 rounded-3xl px-4 py-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                    Name of Holiday Camp Dates
                                </label>
                                {(id || myGroupData?.id) && (
                                    <img
                                        src="/images/icons/edit.png"
                                        className="w-[18px] cursor-pointer"
                                        onClick={() => setIsEditMode(true)} // Allow editing
                                        alt="Edit camp name"
                                    />
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Holiday Camp Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className={`md:w-1/2 px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg 
focus:outline-none focus:ring-2 focus:ring-blue-500 
${(id || myGroupData?.id) && !isEditMode ? 'cursor-not-allowed' : ''}`}
                                disabled={(id || myGroupData?.id) && !isEditMode}
                            />


                            {(id || myGroupData?.id) && isEditMode && (
                                <button
                                    onClick={handleGroupNameSave}
                                    disabled={isLoading}
                                    className="mt-2 ml-6 bg-[#237FEA] text-white text-[14px] font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    {isLoading
                                        ? 'Saving...'
                                        : 'Update'}
                                </button>

                            )}
                            {!id && !myGroupData?.id && (
                                <button
                                    onClick={handleGroupNameSave}
                                    disabled={isLoading}
                                    className="mt-2 ml-6 bg-[#237FEA] text-white text-[14px] font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    {isLoading ? 'Saving...' : 'Save'}
                                </button>
                            )}



                        </div>
                    </div>

                    {isGroupSaved && (
                        <div className="rounded-2xl mb-5 bg-white md:p-6">
                            <div

                                className="border mb-5 border-gray-200 rounded-3xl px-4 py-3"
                            >
                                <div className="flex items-center justify-end py-3">
                                    {id && (

                                        <div className="flex gap-2">
                                            <img
                                                src="/images/icons/edit.png"
                                                className="w-[18px] cursor-pointer"
                                                onClick={() => setIsEdit(true)}

                                            />
                                            <img
                                                src="/images/icons/deleteIcon.png"
                                                className="w-[18px] cursor-pointer"
                                                onClick={deleteCampDate}
                                            />

                                            <img
                                                src="/images/icons/crossGray.png"
                                                className="w-[18px] cursor-pointer"

                                            />

                                        </div>
                                    )}

                                </div>

                                <AnimatePresence>

                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >

                                        <div className="md:flex gap-4 px-2 mb-5 justify-between">
                                            <div className="w-full">
                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                    Start Date
                                                </label>
                                                <DatePicker
                                                    selected={holidayTerms.startDate}
                                                    onChange={(date) => handleDateChange('startDate', date)}
                                                    className={`w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base ${id && !isEdit ? 'cursor-not-allowed' : ''}`}
                                                    showYearDropdown
                                                    scrollableYearDropdown
                                                    yearDropdownItemNumber={100}
                                                    dateFormat="dd/MM/yyyy"
                                                    placeholderText="Select start date"
                                                    withPortal
                                                    disabled={id && !isEdit}
                                                    minDate={new Date()}  // disable past dates before today
                                                />
                                            </div>

                                            <div className="w-full">
                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                    End Date
                                                </label>
                                                <DatePicker
                                                    selected={holidayTerms.endDate}
                                                    onChange={(date) => handleDateChange('endDate', date)}
                                                    className={`w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base ${id && !isEdit ? 'cursor-not-allowed' : ''}`}
                                                    showYearDropdown
                                                    scrollableYearDropdown

                                                    disabled={id && !isEdit}
                                                    yearDropdownItemNumber={100}
                                                    dateFormat="dd/MM/yyyy"
                                                    placeholderText="Select end date"
                                                    withPortal
                                                    minDate={holidayTerms.startDate || new Date()}  // disable dates before start date or today
                                                />
                                            </div>
                                        </div>

                                        <div className="md:flex gap-4 px-2 mb-5 justify-between">


                                            <div className="w-full">
                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                    Total Number of Days
                                                </label>
                                                <input
                                                    type="number"
                                                    value={holidayTerms.numberOfDays}
                                                    readOnly
                                                    name="numberOfDays"
                                                    placeholder="Total Number of Sessions"
                                                    className="w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                        {activeSessionValue && (
                                            <div className="text-right font-semibold text-blue-600 mb-4">
                                                Active Term Sessions: {activeSessionValue}
                                            </div>
                                        )}

                                        <div className="flex gap-4 justify-between">
                                            <div className="w-full md:block hidden" />
                                            <div className="w-full md:flex items-center gap-2 space-y-2 md:space-y-0">
                                                <button
                                                    className={`flex whitespace-nowrap px-2 md:w-5/12 w-full items-center justify-center gap-1 
        border border-blue-500 text-[#237FEA] hover:bg-blue-50
        px-6 py-2 rounded-lg text-[14px] font-semibold`}
                                                    onClick={handleMapClick}
                                                >
                                                    Map Session
                                                </button>


                                                <button
                                                    className="bg-[#237FEA] whitespace-nowrap text-white text-[14px] md:w-7/12 w-full font-semibold px-6 py-3 rounded-lg hover:bg-blue-700"
                                                    onClick={handleSaveCamp}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading
                                                        ? 'Saving...'
                                                        : (() => {
                                                            const activeTerm = terms.find(t => t.isOpen);
                                                            return activeTerm && savedTermIds?.has(activeTerm.id)
                                                                ? 'Update '
                                                                : 'Save ';
                                                        })()}

                                                </button>

                                            </div>
                                        </div>
                                    </motion.div>

                                </AnimatePresence>
                            </div>

                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {sessionMappings && holidayTerms.startDate && holidayTerms.endDate && isMapping && (
                        <motion.div
                            key="session-step"
                            initial={{ opacity: 0, y: 20 }}

                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.4 }}
                            className="transition-all duration-300 md:w-1/2"
                        >
                            <h3 className="font-semibold text-[24px] mb-4">
                                <b>Step 2:</b> Map Sessions Plans{' '}
                            </h3>

                            <motion.div
                                initial={{ scale: 0.98, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.98, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="rounded-2xl mb-5 bg-white md:p-6"
                            >
                                <div className="border border-gray-200 rounded-3xl px-4 py-3">
                                    <div className="md:flex items-center justify-between mb-2">
                                        <label className="block text-[22px] font-semibold">
                                            {groupName || 'N/A'}
                                        </label>
                                    </div>
                                    <div className="flex justify-between gap-4 w-full text-[18px] mb-4 font-semibold">
                                        <label className=" md:w-1/2">Session Date</label> <label className=" md:w-1/2 md:pl-5">Session Plan</label>
                                    </div>
                                    {sessionMappings.map((session, index) => (
                                        <div key={index} className="md:flex w-full items-start gap-4 justify-between mb-4">
                                            <div className="w-1/2">
                                                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-2xl px-4 py-3 mb-4 shadow-sm">
                                                    <span className="font-semibold text-base text-black whitespace-nowrap">
                                                        Session {index + 1}
                                                    </span>
                                                    <DatePicker
                                                        readOnly
                                                        selected={session.sessionDate ? new Date(session.sessionDate + "T00:00:00") : null}
                                                        onChange={(date) =>
                                                            handleMappingChange(
                                                                index,
                                                                "sessionDate",
                                                                date ? date.toISOString().slice(0, 10) : ""
                                                            )
                                                        }
                                                        dateFormat="EEEE, dd MMM"
                                                        placeholderText="Select date"
                                                        withPortal
                                                        minDate={holidayTerms.startDate}
                                                        maxDate={holidayTerms.endDate}
                                                        className="text-[#717073] text-[15px] font-semibold bg-transparent focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-1/2">
                                                <SessionPlanSelect
                                                    idx={index}
                                                    value={session.sessionPlanId}
                                                    onChange={handleMappingChange}
                                                    usedSessionPlans={sessionMappings.map(s => s.sessionPlanId)}
                                                />
                                            </div>
                                        </div>
                                    ))}



                                    <div className="flex gap-4 justify-between">
                                        <div className="w-1/2" />
                                        <div className="w-full flex items-center gap-2">
                                            <button
                                                className="flex whitespace-nowrap w-6/12 items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg text-base font-semibold hover:bg-blue-50"
                                                onClick={() => setIsMapping(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveMappings}
                                                className="bg-[#237FEA] whitespace-nowrap text-white text-base w-6/12 font-semibold px-6 py-3 rounded-lg hover:bg-blue-700"
                                            >
                                                Save Mappings
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HolidayTermsCreate;