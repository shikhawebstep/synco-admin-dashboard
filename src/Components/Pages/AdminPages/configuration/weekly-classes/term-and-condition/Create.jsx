import Select from "react-select";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, m } from 'framer-motion';
import SessionPlanSelect from "./SessionPlanSelect";
import { useNavigate, useParams } from 'react-router-dom';
import { showError, showSuccess, showWarning, showConfirm, ThemeSwal } from '../../../../../../utils/swalHelper';
import Loader from '../../../contexts/Loader';


import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useTermContext } from "../../../contexts/TermDatesSessionContext";

const initialTerms = [];
const Create = () => {
    const token = localStorage.getItem("adminToken");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [searchParams] = useSearchParams();
    const mapSectionRef = useRef(null);
    const id = searchParams.get("id");
    const [selectedDay, setSelectedDay] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const options = [
        { value: "monday", label: "Monday" },
        { value: "tuesday", label: "Tuesday" },
        { value: "wednesday", label: "Wednesday" },
        { value: "thursday", label: "Thursday" },
        { value: "friday", label: "Friday" },
        { value: "saturday", label: "Saturday" },
        { value: "sunday", label: "Sunday" },
    ];
    const termOptions = [
        { value: "Autumn", label: "Autumn" },
        { value: "Spring", label: "Spring" },
        { value: "Summer", label: "Summer" },
    ];

    const [terms, setTerms] = useState(initialTerms);
    const [activeSessionValue, setActiveSessionValue] = useState('');
    const [sessionMappings, setSessionMappings] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [isGroupSaved, setIsGroupSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionsMap, setSessionsMap] = useState([]);
    const [savedTermIds, setSavedTermIds] = useState(new Set());
    const activeTerm = terms.find(t => t.isOpen);
    const activeSessionCount = parseInt(activeSessionValue || 0, 10);
    const [isMapping, setIsMapping] = useState(false);
    const navigate = useNavigate();
    // console.log('terms', terms)
    const { createTermGroup, updateTermGroup, myGroupData, setMyGroupData, setSelectedTermGroup, selectedTermGroup, fetchTerm, termData, fetchTermGroupById, loading } = useTermContext();
    // console.log('terms', terms)
    // Handle prefilling data in edit mode
    // First: fetch group data and wait for state update
    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                // console.log('Fetching group data...');
                setMyGroupData(null);
                await fetchTerm();

                await fetchTermGroupById(id);
                setIsEditMode(true);
            };

            fetchData();
        } else {
            setSelectedTermGroup(null);
        }
    }, [id, fetchTermGroupById]); // include fetchTermGroupById if it's stable (e.g., useCallback)

    // Second: Wait for isEditMode + termData + selectedTermGroup
    useEffect(() => {
        console.group('termData1', termData);

        if (isEditMode && termData.length && selectedTermGroup?.id) {
            setMyGroupData(null);
            setGroupName(selectedTermGroup.name);
            setIsGroupSaved(true);

            const matchedTerms = termData.filter(
                (term) => term.termGroup?.id === selectedTermGroup.id
            );

            if (matchedTerms?.length) {
                const mappedTerms = matchedTerms.map((term) => {
                    // Set selected day for the current term (optional — depends on your logic)
                    setSelectedDay(term.day);

                    return {
                        id: term.id,
                        day: term.day,
                        name: term.termName,
                        startDate: term.startDate,
                        endDate: term.endDate,
                        exclusions: Array.isArray(term?.exclusionDates)
                            ? term.exclusionDates
                            : JSON.parse(term?.exclusionDates || '[]'),
                        sessions: term.sessionsMap?.length || 0,
                        isOpen: false,
                        sessionsMap: term.sessionsMap || [],
                    };
                });

                setTerms(mappedTerms);

                const extractedData = mappedTerms.flatMap((term) =>
                    term.sessionsMap.map((session) => ({
                        sessionDate: session.sessionDate,
                        sessionPlanId: session.sessionPlanId,
                        termId: term.id,
                    }))
                );

                setSavedTermIds((prev) => {
                    const updated = new Set(prev);
                    matchedTerms.forEach((term) => updated.add(term.id));
                    return updated;
                });

                setSessionMappings(extractedData);
            }
        }
    }, [isEditMode, termData, selectedTermGroup]);


    const handleGroupNameSave = async () => {
    
            if (!groupName.trim()) {
                showError('Group Name Required', 'Please enter a name for the term group');
                return;
            }

            // console.log('myGroupData', selectedTermGroup);
            setMyGroupData(null)
            // setIsLoading(true);
            try {
                const payload = { name: groupName };

                const groupId = myGroupData?.id || selectedTermGroup?.id;
                // console.log('myGroupData', groupId);
                if (groupId) {
                    // Update existing group
                    await updateTermGroup(groupId, payload);
                 
                } else {
                    // Create new group
                    const createdGroup = await createTermGroup(payload);

                }

                setIsGroupSaved(true);
            } catch (error) {
                showError('Save Failed', error?.message || 'Failed to save group name');
            } finally {
                // setIsLoading(false);
            }
        };

        const handleMapSession = (termId) => {
            if (!isGroupSaved) {
                alert('Please save the group name first');
                return;
            }

            if (!activeTerm) {
                alert('Please select a term to map sessions');
                return;
            }

            // Only scroll when opening
            if (!isMapping) {
                setIsMapping(true);

                setTimeout(() => {
                    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100); // small delay to ensure the section is rendered
            } else {
                // If it's already open, just close
                setIsMapping(false);
            }
        };


        useEffect(() => {

            const openTerm = terms.find(t => t.isOpen);
            if (openTerm) {
                // console.log('openTerm0', openTerm)
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

        // IN PROGRESS


        // Term management functions
        const toggleTerm = (id) => {
            if (!isGroupSaved) {
              showError('Save Group First', 'Please save the group name before managing terms');
                return;
            }

            // Save current term's unsaved mappings before switching
            setTerms(prev => prev.map(term => {
                if (term.isOpen) {
                    return {
                        ...term,
                        unsavedSessionMappings: [...sessionMappings] // Save current mappings
                    };
                }
                return term;
            }));

            // Then toggle the terms
            setTerms(prev => prev.map(term => ({
                ...term,
                isOpen: term.id === id ? !term.isOpen : false
            })));

            // Load the new term's mappings
            const newActiveTerm = terms.find(t => t.id === id);
            if (newActiveTerm) {
                setSessionMappings(newActiveTerm.unsavedSessionMappings || []);
            }
        };

        const handleInputChange = (id, field, value) => {

            setTerms((prev) =>
                prev.map((term) =>
                    term.id === id ? { ...term, [field]: value } : term
                )
            );

            if (field === 'sessions') {
                const current = terms.find(t => t.id === id);
                if (current?.isOpen) {
                    setActiveSessionValue(value);
                }
            }
        };


        const handleSessionDate = (termId, date) => {
            if (!selectedDay) {
                showWarning("Oops...", "Select a day first!");
                return;
            }

            setTerms((prev) =>
                prev.map((t) => {
                    if (t.id !== termId) return t;

                    // if user clears the picker
                    if (!date) {
                        return {
                            ...t,
                            startDate: null,
                            endDate: null,
                            sessionsMap: [],
                        };
                    }

                    const dateStr = date.toLocaleDateString("en-CA");

                    let updatedDates = t.sessionsMap.map((s) => s.sessionDate);

                    if (updatedDates.includes(dateStr)) {
                        updatedDates = updatedDates.filter((d) => d !== dateStr);
                    } else {
                        updatedDates.push(dateStr);
                    }

                    updatedDates.sort((a, b) => new Date(a) - new Date(b));

                    const updatedSessionsMap = updatedDates.map((d) => {
                        const existing = t.sessionsMap.find((s) => s.sessionDate === d);
                        return existing || { sessionDate: d, sessionPlanId: null, sessionPlan: null };
                    });

                    return {
                        ...t,
                        startDate: updatedDates.length ? updatedDates[0] : null,
                        endDate: updatedDates.length ? updatedDates[updatedDates.length - 1] : null,
                        sessionsMap: updatedSessionsMap,
                    };
                })
            );
        };
        const handleStartDate = (termId, date) => {
            setTerms(prev =>
                prev.map(t => {
                    if (t.id !== termId) return t;

                    if (!date) {
                        return {
                            ...t,
                            startDate: null,
                            endDate: null,
                            sessionsMap: [],
                        };
                    }

                    return {
                        ...t,
                        startDate: date.toLocaleDateString("en-CA"),
                        endDate: null,
                        sessionsMap: [],
                    };
                })
            );
        };
        const handleEndDate = (termId, date) => {
            if (!date) return;

            setTerms(prev =>
                prev.map(t => {
                    if (t.id !== termId) return t;

                    const start = new Date(t.startDate + "T00:00:00");
                    const end = date;

                    const dayMap = {
                        sunday: 0,
                        monday: 1,
                        tuesday: 2,
                        wednesday: 3,
                        thursday: 4,
                        friday: 5,
                        saturday: 6,
                    };

                    const targetDay = dayMap[t.day.toLowerCase()];
                    const sessions = [];

                    let current = new Date(start);

                    while (current <= end) {
                        const dateStr = current.toLocaleDateString("en-CA");

                        if (
                            current.getDay() === targetDay &&
                            !t.exclusions.includes(dateStr)
                        ) {
                            sessions.push({
                                sessionDate: dateStr,
                                sessionPlanId: null,
                                sessionPlan: null,
                            });
                        }

                        current.setDate(current.getDate() + 1);
                    }

                    // 🔴 IMPORTANT PART
                    const validExclusions = t.exclusions.filter(ex => {
                        if (!ex) return false;
                        const exDate = new Date(ex + "T00:00:00");
                        return exDate >= start && exDate <= end;
                    });

                    return {
                        ...t,
                        endDate: end.toLocaleDateString("en-CA"),
                        exclusions: validExclusions,   // ❗ out-of-range exclusions removed
                        sessionsMap: sessions,
                    };
                })
            );
        };

        const filterEndDate = (date, term) => {
            if (!term.startDate || !term.day) return false;

            const dayMap = {
                sunday: 0,
                monday: 1,
                tuesday: 2,
                wednesday: 3,
                thursday: 4,
                friday: 5,
                saturday: 6,
            };

            const targetDay = dayMap[term.day.toLowerCase()];
            const dateStr = date.toLocaleDateString("en-CA");
            const start = new Date(term.startDate + "T00:00:00");

            // Only allow dates >= startDate, matching day, and not excluded
            return date >= start && date.getDay() === targetDay && !term.exclusions.includes(dateStr);
        };

        // Handle exclusion dates
        const handleExclusionChange = (termId, idx, dateStr) => {
            setTerms(prev =>
                prev.map(t => {
                    if (t.id !== termId) return t;

                    const exclusions = [...t.exclusions];
                    exclusions[idx] = dateStr;

                    const sessionsMap = t.sessionsMap.filter(
                        s => s.sessionDate !== dateStr
                    );

                    return {
                        ...t,
                        exclusions,
                        sessionsMap,
                    };
                })
            );
        };



        const addExclusionDate = (termId) => {
            setTerms((prev) =>
                prev.map((t) =>
                    t.id === termId ? { ...t, exclusions: [...t.exclusions, ""] } : t
                )
            );
        };

        const removeExclusionDate = (termId, idx) => {
            setTerms(prev =>
                prev.map(t => {
                    if (t.id !== termId) return t;

                    const removedDate = t.exclusions[idx];

                    const updatedExclusions = t.exclusions.filter(
                        (_, i) => i !== idx
                    );

                    // Check if removed date should be restored as session
                    const dayMap = {
                        sunday: 0,
                        monday: 1,
                        tuesday: 2,
                        wednesday: 3,
                        thursday: 4,
                        friday: 5,
                        saturday: 6,
                    };

                    const isValidSessionDate =
                        removedDate &&
                        t.startDate &&
                        t.endDate &&
                        removedDate >= t.startDate &&
                        removedDate <= t.endDate &&
                        new Date(removedDate + "T00:00:00").getDay() ===
                        dayMap[t.day.toLowerCase()];

                    let updatedSessions = [...t.sessionsMap];

                    if (
                        isValidSessionDate &&
                        !updatedSessions.some(
                            s => s.sessionDate === removedDate
                        )
                    ) {
                        updatedSessions.push({
                            sessionDate: removedDate,
                            sessionPlanId: null,
                            sessionPlan: null,
                        });

                        // keep sessions sorted
                        updatedSessions.sort(
                            (a, b) =>
                                new Date(a.sessionDate) -
                                new Date(b.sessionDate)
                        );
                    }

                    return {
                        ...t,
                        exclusions: updatedExclusions,
                        sessionsMap: updatedSessions,
                    };
                })
            );
        };


        const filterSessionDay = (date, term) => {
            if (!term.day) return false; // use the term's specific selected day

            const dayMap = {
                sunday: 0,
                monday: 1,
                tuesday: 2,
                wednesday: 3,
                thursday: 4,
                friday: 5,
                saturday: 6,
            };

            const dayOk = date.getDay() === dayMap[term.day.toLowerCase()];
            const dateStr = date.toLocaleDateString("en-CA");

            // disable if in exclusions
            const notExcluded = !term.exclusions.includes(dateStr);

            return dayOk && notExcluded;
        };


        const filterExclusionDay = (date, term) => {
            if (!term.startDate || !term.endDate) return true; // allow any date if range is missing

            const dateStr = date.toLocaleDateString("en-CA");
            const withinRange = dateStr >= term.startDate && dateStr <= term.endDate;

            return withinRange; // only restriction is start/end date
        };


        // console.log('myGroupData', myGroupData)
        const deleteTerm = useCallback(async (id) => {
            if (!token) return;

            const willDelete = await showConfirm(
                "Are you sure?",
                "This action will permanently delete the term.",
                "Yes, delete it!"
            );

            if (!willDelete.isConfirmed) return;

            // Check if term is saved (has real backend ID)
            const isSaved = savedTermIds.has(id);

            if (!isSaved) {
                // Just remove it locally
                setTerms(prev => prev.filter(term => term.id !== id));
                setSessionMappings([]);
                showSuccess("Deleted!", "The unsaved term was removed.");
                return;
            }

            // Otherwise delete from backend
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/term/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    showSuccess("Deleted!", "The term was deleted successfully.");

                    // 🔹 Update terms locally
                    setTerms(prev => prev.filter(term => term.id !== id));

                    // 🔹 Update session mappings (remove sessions of that term)
                    setSessionMappings(prev =>
                        prev.filter(mapping => mapping.termId !== id)
                    );

                    // 🔹 Update saved term IDs set
                    setSavedTermIds(prev => {
                        const updated = new Set(prev);
                        updated.delete(id);
                        return updated;
                    });

                    // 🔹 If you still want to refresh backend data
                    if (myGroupData) {
                        fetchTermGroupById(myGroupData.id);
                    } else {
                        navigate('/configuration/weekly-classes/term-dates/list');
                    }

                    fetchTerm();
                } else {
                    const errorData = await response.json();
                    showError("Failed", errorData.message || "Failed to delete the term.");
                }
            } catch (err) {
                console.error("Failed to delete term:", err);
                showError("Error", "Something went wrong. Please try again.");
            }
        }, [token, savedTermIds, fetchTerm, myGroupData, fetchTermGroupById, navigate]);

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
            if (!sessionMappings.length) {
                showWarning('No Session Mappings', 'Please add at least one session mapping');
                return;
            }

            const isValid = sessionMappings.every(mapping => mapping.sessionDate && mapping.sessionPlanId);
            console.log('sessionMappings', sessionMappings)
            if (!isValid) {
                showError('Incomplete Mappings', 'Please fill all session mappings completely');
                return;
            }

            // Save mappings exactly as added
            setSessionsMap(sessionMappings);
            console.log('sessionMappings', sessionMappings)

            setIsMapping(false);

            setIsMapping(false);

            showSuccess('Success', 'Session mappings saved successfully');
        };


        const handleSaveTerm = async (term) => {
           
            if (!myGroupData?.id && !selectedTermGroup) {
                console.error("Missing termGroupId");
                return;
            }

                if (!term.name || !term.startDate || !term.endDate) {
                    showError('Missing Information', 'Please fill all required fields for the term');
                    return;
                }

                // Validate session mappings
                if (
                    sessionMappings.length === 0 ||
                    sessionMappings.some(mapping => !mapping.sessionPlanId)
                ) {
                    showError('Session Mapping Required', 'Please map all sessions before saving the term');
                    return;
                }
                setIsLoading(true);
            
                const payload = {
                    termName: term.name,
                    day: term.day,
                    termGroupId: myGroupData?.id || selectedTermGroup?.id,
                    sessionPlanGroupId: 1, // static value
                    startDate: term.startDate,
                    endDate: term.endDate,
                    totalNumberOfSessions: Number(term.sessions),
                    exclusionDates: term.exclusions.filter((ex) => ex.trim() !== ""),
                    sessionsMap: sessionMappings.map((session) => ({
                        sessionDate: session.sessionDate,
                        sessionPlanId: session.sessionPlanId,
                    })),
                    unsavedSessionMappings: []
                };

                // Determine if it's an existing term (edit)
                const isExistingTerm = termData.some((t) => t.id === term.id);
                const requestUrl = isExistingTerm
                    ? `${API_BASE_URL}/api/admin/term/${term.id}`
                    : `${API_BASE_URL}/api/admin/term`;
                const method = isExistingTerm ? "PUT" : "POST";

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

                    // Update the terms list
                    setTerms(prev => prev.map(t => {
                        if (t.id === term.id) {
                            return {
                                ...t,
                                id: data.data.id || t.id,
                                name: data.data.termName || t.name,
                                startDate: data.data.startDate || t.startDate,
                                endDate: data.data.endDate || t.endDate,
                                sessions: data.data.totalNumberOfSessions?.toString() || t.sessions,
                                exclusions: data.data.exclusionDates || t.exclusions,
                                sessionsMap: data.data.sessionsMap || sessionMappings,
                            };
                        }
                        return t;
                    }));

                    await fetchTerm();
                    setSavedTermIds(prev => new Set(prev).add(data.data.id || term.id));

                    setSavedTermIds(prev => new Set(prev).add(data.data.id || term.id));

                    showSuccess(data.message || 'Term Saved Successfully');

                    toggleTerm(term.id);
                } catch (error) {
                    console.error("❌ Error saving term:", error);
                   showError('Save Failed', error?.message || 'Failed to save term.');
                    setIsLoading(false);
                } finally {
                    setIsLoading(false);
                }
            };

            const addNewTerm = () => {
                if (!isGroupSaved) {
                    showError('Save Group First', 'Please save the group name before adding terms');
                    return;
                }
                 

                // Check for unsaved terms
                const hasUnsavedTerms = terms.some(t => !savedTermIds.has(t.id));
                if (hasUnsavedTerms) {
                    showError('Unsaved Term', 'Please save the current term before adding a new one');

                    return;
                }


                setSessionMappings([]);
                const newTerm = {
                    id: Date.now(),
                    name: '',
                    startDate: '',
                    endDate: '',
                    exclusions: [''],
                    sessions: '',
                    isOpen: true,
                    sessionsMap: []
                };
                setTerms(prev => [
                    ...prev.map(term => ({ ...term, isOpen: false })),
                    newTerm
                ]);
                setIsMapping(false);


            };

            const handleSaveAll = async () => {
                if (!terms.length) {
                    showError("No Terms", "Please add at least one term");
                    return;
                }

                // Check if all terms are saved
                const unsavedTerms = terms.filter(t => !savedTermIds.has(t.id));
                if (unsavedTerms.length > 0) {
                    showError("Unsaved Terms", `Please save all terms (${unsavedTerms.length} unsaved) before final submission`);
                    return;
                }
                setIsEditMode(false);
                setSavedTermIds(null);
                setMyGroupData(null)
                // Success - navigate away or show success message
                // Success - navigate away or show success message
                showSuccess("All Terms Saved", "Your term group has been saved successfully").then(() => {
                    navigate('/configuration/weekly-classes/term-dates/list');
                });
            };

            if (loading) return <Loader />;
            console.log('selectedDay', selectedDay)
            console.log('terms', terms)
            return (
                <div className="md:p-6 bg-gray-50 min-h-screen">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2">
                        <h2
                            ref={mapSectionRef}
                            onClick={() => {
                                navigate('/configuration/weekly-classes/term-dates/list');
                                setIsEditMode(false);
                                // setSavedTermIds(null);
                                setMyGroupData(null)
                            }}
                            className="text-xl md:text-[28px] font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 duration-200">
                            <img
                                src="/images/icons/arrow-left.png"
                                alt="Back"
                                className="w-5 h-5 md:w-6 md:h-6"
                            />
                            <span className="truncate">Add term dates</span>
                        </h2>
                    </div>
                    <div className="flex flex-col gap-8 md:flex-row rounded-3xl w-full">
                        <div className="transition-all duration-300 md:w-1/2">
                            <h3 className="font-semibold  mb-4 text-[24px]"> <b>Step 1: </b>Add Term Dates   </h3>
                            <div className="rounded-2xl mb-5 bg-white md:p-6">
                                <div className="border border-gray-200 rounded-3xl px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-base font-semibold text-gray-700 mb-2">
                                            Name of Term Group
                                        </label>
                                        {isGroupSaved && (
                                            <img
                                                src="/images/icons/edit.png"
                                                className="w-[18px] cursor-pointer"
                                                onClick={() => setIsGroupSaved(false)} // Allow editing
                                                alt="Edit group name"
                                            />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter Term Group Name"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        onBlur={handleGroupNameSave}
                                        className="md:w-1/2 px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isGroupSaved && !isEditMode}
                                    />
                                    {!isGroupSaved && (
                                        <button
                                            onClick={handleGroupNameSave}
                                            disabled={isLoading}
                                            className="mt-2 ml-6 bg-[#237FEA] text-white text-[14px] font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            {isLoading
                                                ? 'Saving...'
                                                : myGroupData?.id
                                                    ? 'Update Group Name'
                                                    : 'Save Group Name'}
                                        </button>
                                    )}

                                </div>
                            </div>

                            {isGroupSaved && (
                                <div className="rounded-2xl mb-5 bg-white md:p-6">
                                    {terms.map((term) => (
                                        <div
                                            key={term.id}
                                            className="border mb-5 border-gray-200 rounded-3xl px-4 py-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <label className="rounded-3xl block text-base font-semibold text-gray-700 mb-2">
                                                    {term.name || 'Term Name'}
                                                </label>
                                                <div className="flex gap-2">
                                                    <img
                                                        src="/images/icons/edit.png"
                                                        className="w-[18px] cursor-pointer"
                                                        onClick={() => toggleTerm(term.id)}
                                                    />
                                                    <img
                                                        src="/images/icons/deleteIcon.png"
                                                        className="w-[18px] cursor-pointer"
                                                        onClick={() => deleteTerm(term.id)}
                                                    />
                                                    {term.isOpen && (
                                                        <img
                                                            src="/images/icons/crossGray.png"
                                                            className="w-[18px] cursor-pointer"
                                                            onClick={() => toggleTerm(term.id)}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {term.isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="md:flex items-center justify-between">
                                                            <Select
                                                                value={termOptions.find(option => option.value === term.name)}
                                                                onChange={(selectedOption) =>
                                                                    handleInputChange(term.id, "name", selectedOption.value)
                                                                }
                                                                options={termOptions}
                                                                placeholder="Select Term"
                                                                className="md:w-1/2 mb-5 mx-2 mt-2 font-semibold text-base"
                                                                classNamePrefix="react-select"
                                                                styles={{
                                                                    control: (base, state) => ({
                                                                        ...base,
                                                                        borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
                                                                        boxShadow: "none",
                                                                        padding: "6px 8px",
                                                                        minHeight: "48px",
                                                                    }),
                                                                    placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                                                    dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                                                    indicatorSeparator: () => ({ display: "none" }),
                                                                }}
                                                            />
                                                            <div className="md:w-1/2 mb-5 mx-2 mt-2">

                                                                <Select
                                                                    options={options}
                                                                    value={options.find(option => option.value === term.day) || null}
                                                                    onChange={async (selectedOption, { action }) => {
                                                                        if (action === 'clear') {
                                                                            const newTerms = terms.map(t =>
                                                                                t.id === term.id
                                                                                    ? { ...t, day: "", sessionsMap: [], exclusions: [], startDate: "", endDate: "" }
                                                                                    : t
                                                                            );
                                                                            setTerms(newTerms);
                                                                            setSelectedDay("");
                                                                            return;
                                                                        }

                                                                        const newDay = selectedOption?.value;
                                                                        if (!newDay) return;

                                                                        // If changing the day (not initial select)
                                                                        if (term.day && term.day !== newDay) {
                                                                            const confirmChange = await ThemeSwal.fire({
                                                                                title: "Change Day?",
                                                                                text: "Changing the day will reset all selected dates and exclusions. Do you want to continue?",
                                                                                icon: "warning",
                                                                                showCancelButton: true,
                                                                                confirmButtonColor: "#3085d6",
                                                                                cancelButtonColor: "#d33",
                                                                                confirmButtonText: "Yes, change it",
                                                                                cancelButtonText: "No, keep current day",
                                                                            });

                                                                            if (!confirmChange.isConfirmed) return; // user cancelled
                                                                        }

                                                                        // ✅ Proceed with change (reset sessionMap, exclusions, startDate, endDate)
                                                                        const newTerms = terms.map(t =>
                                                                            t.id === term.id
                                                                                ? { ...t, day: newDay, sessionsMap: [], exclusions: [], startDate: "", endDate: "" }
                                                                                : t
                                                                        );

                                                                        setSelectedDay(newDay);
                                                                        setTerms(newTerms);
                                                                    }}
                                                                    placeholder="Select a day"
                                                                    className="rounded-lg px-0 py-0"
                                                                    classNamePrefix="react-select"
                                                                    isClearable={true}
                                                                    menuPortalTarget={document.body}   // ⭐ IMPORTANT
                                                                    menuPosition="fixed"               // ⭐ IMPORTANT
                                                                    styles={{
                                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                        control: (base, state) => ({
                                                                            ...base,
                                                                            borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
                                                                            boxShadow: "none",
                                                                            padding: "6px 8px",
                                                                            minHeight: "48px",
                                                                        }),
                                                                    }}
                                                                />


                                                            </div>
                                                        </div>
                                                        <div className="md:flex gap-4 px-2 mb-5 justify-between">
                                                            <div className="w-full">
                                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                                    Start Date
                                                                </label>
                                                                <DatePicker
                                                                    disabled={!term.day}
                                                                    placeholderText="Enter Start Date"
                                                                    selected={term.startDate ? new Date(term.startDate + "T00:00:00") : null}
                                                                    onChange={(date) =>
                                                                        handleStartDate(term.id, date)
                                                                    }
                                                                    filterDate={(d) => filterSessionDay(d, term)}
                                                                    dateFormat="EEEE, dd MMM"
                                                                    isClearable
                                                                    withPortal
                                                                    minDate={new Date()}
                                                                    className={`w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg ${term.day ? "bg-white" : "bg-gray-200 cursor-not-allowed"
                                                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                                />




                                                                <ul>
                                                                    {selectedDates.map((d) => (
                                                                        <li key={d}>{d}</li>
                                                                    ))}
                                                                </ul>




                                                            </div>
                                                            <div className="w-full">
                                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                                    End Date
                                                                </label>
                                                                <DatePicker
                                                                    readOnly={!term.startDate}
                                                                    placeholderText="End Date"
                                                                    selected={term.endDate ? new Date(term.endDate + "T00:00:00") : null}
                                                                    onChange={(date) => handleEndDate(term.id, date)}
                                                                    dateFormat="EEEE, dd MMM"
                                                                    minDate={term.startDate ? new Date(term.startDate + "T00:00:00") : null}
                                                                    filterDate={(d) => filterEndDate(d, term)} // NEW filter
                                                                    withPortal
                                                                    className={`w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg ${term.day ? "bg-white" : "bg-gray-200 cursor-not-allowed"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                                />




                                                            </div>
                                                        </div>

                                                        <div className="md:flex gap-4 px-2 mb-5 justify-between">
                                                            <div className="w-full">
                                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                                    Exclusion Date(s)
                                                                </label>
                                                                {term.exclusions.map((ex, idx) => (
                                                                    <div key={idx} className=" relative gap-2 mb-2 items-center">
                                                                        <DatePicker
                                                                            placeholderText={`Exclusion Date ${idx + 1}`}
                                                                            selected={ex ? new Date(ex + "T00:00:00") : null}
                                                                            onChange={(date) =>
                                                                                handleExclusionChange(
                                                                                    term.id,
                                                                                    idx,
                                                                                    date ? date.toLocaleDateString("en-CA") : ""
                                                                                )
                                                                            }
                                                                            dateFormat="EEEE, dd MMM"
                                                                            filterDate={(d) => filterExclusionDay(d, term)}
                                                                            withPortal
                                                                            className="w-full px-4 font-semibold text-base py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            dayClassName={(date) => {
                                                                                const dateStr = date.toLocaleDateString("en-CA");
                                                                                if (term.exclusions.includes(dateStr)) return "exclusion-date";
                                                                                if (term.sessionsMap.map(s => s.sessionDate).includes(dateStr))
                                                                                    return "selected-date";
                                                                            }}

                                                                        />

                                                                        <button
                                                                            onClick={() => removeExclusionDate(term.id, idx)}
                                                                            type="button"
                                                                            className="text-red-500 absolute top-[10px] right-[15px] hover:text-red-700 font-bold text-xl"
                                                                            title="Remove"
                                                                        >
                                                                            &times;
                                                                        </button>

                                                                    </div>
                                                                ))}


                                                                <button
                                                                    className="flex whitespace-nowrap w-full items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg text-base font-semibold hover:bg-blue-50"
                                                                    onClick={() => addExclusionDate(term.id)}
                                                                >
                                                                    + Add Exclusion Date
                                                                </button>
                                                            </div>

                                                            <div className="w-full">
                                                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                                                    Total Number of Sessions
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Total Number of Sessions"
                                                                    value={term.sessionsMap.length}
                                                                    readOnly
                                                                    onChange={(e) =>
                                                                        handleInputChange(term.id, 'sessions', e.target.value)
                                                                    }
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
                                                                    className={`flex whitespace-nowrap px-2 md:w-5/12 w-full items-center justify-center gap-1 border ${term.isSubmitted ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' : 'border-blue-500 text-[#237FEA] hover:bg-blue-50'
                                                                        } px-6 py-2 rounded-lg text-[14px] font-semibold`}
                                                                    onClick={() => !term.isSubmitted && handleMapSession(term.id)}
                                                                    disabled={term.isSubmitted}
                                                                >
                                                                    Map Session
                                                                </button>

                                                                <button
                                                                    className="bg-[#237FEA] whitespace-nowrap text-white text-[14px] md:w-7/12 w-full font-semibold px-6 py-3 rounded-lg hover:bg-blue-700"
                                                                    onClick={() => {
                                                                        const activeTerm = terms.find(t => t.isOpen);
                                                                        if (activeTerm) handleSaveTerm(activeTerm);
                                                                    }}
                                                                    disabled={isLoading}
                                                                >
                                                                    {isLoading
                                                                        ? 'Saving...'
                                                                        : (() => {
                                                                            const activeTerm = terms.find(t => t.isOpen);
                                                                            return activeTerm && savedTermIds?.has(activeTerm.id)
                                                                                ? 'Update Term'
                                                                                : 'Save Term';
                                                                        })()}

                                                                </button>

                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}

                                    <div className="flex mb-5 flex-wrap flex-col-reverse gap-4 md:flex-row md:items-center md:justify-end md:gap-4">
                                        <button
                                            onClick={addNewTerm}
                                            className="flex items-center min-w-40 justify-center gap-1 border border-gray-400 text-gray-400 text-[14px] px-4 py-3 rounded-lg hover:bg-gray-100 w-full md:w-auto"
                                        >
                                            + Add Term
                                        </button>
                                        <button
                                            className={`min-w-40 font-semibold px-6 py-3 rounded-lg text-[14px] w-full md:w-auto 
        ${!isGroupSaved ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-[#237FEA] hover:bg-blue-700 text-white'}`}
                                            onClick={handleSaveAll}
                                            disabled={!isGroupSaved || isLoading}
                                        >
                                            {'Save All'}
                                        </button>

                                    </div>
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {activeTerm && isMapping && (
                                <motion.div
                                    key="session-step"
                                    initial={{ opacity: 0, y: 20 }}

                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.4 }}
                                    className="transition-all duration-300 md:w-1/2"
                                >
                                    <h3 className="font-semibold text-[24px] mb-4">
                                        <b>Step 2:</b> Map Sessions Plans for{' '}
                                        <span className="text-blue-600">{activeTerm.name}</span>
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
                                                    {activeTerm?.name}
                                                </label>
                                            </div>
                                            <div className="flex justify-between gap-4 w-full text-[18px] mb-4 font-semibold">
                                                <label className=" md:w-1/2">Session Date</label> <label className=" md:w-1/2 md:pl-5">Session Plan</label>
                                            </div>
                                            {Array.from({ length: activeTerm?.sessionsMap?.length || 0 }).map((_, index) => (
                                                <div key={index} className="md:flex w-full items-start gap-4 justify-between mb-4">
                                                    <div className="w-1/2">
                                                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-2xl px-4 py-3 mb-4 shadow-sm">
                                                            <span className="font-semibold text-base text-black whitespace-nowrap">
                                                                Session {index + 1}
                                                            </span>
                                                            <DatePicker
                                                                readOnly
                                                                selected={
                                                                    sessionMappings[index]?.sessionDate
                                                                        ? new Date(sessionMappings[index].sessionDate + "T00:00:00")
                                                                        : null
                                                                }
                                                                onChange={(date) =>
                                                                    handleMappingChange(
                                                                        index,
                                                                        "sessionDate",
                                                                        date ? date.toLocaleDateString("en-CA") : ""
                                                                    )
                                                                }
                                                                dateFormat="EEEE, dd MMM"
                                                                placeholderText="Select date"
                                                                withPortal
                                                                minDate={
                                                                    activeTerm?.startDate
                                                                        ? new Date(activeTerm.startDate + "T00:00:00")
                                                                        : null
                                                                }
                                                                maxDate={
                                                                    activeTerm?.endDate
                                                                        ? new Date(activeTerm.endDate + "T00:00:00")
                                                                        : null
                                                                }
                                                                excludeDates={
                                                                    activeTerm?.exclusions?.length
                                                                        ? activeTerm.exclusions.map(
                                                                            (ex) => new Date(ex + "T00:00:00")
                                                                        )
                                                                        : []
                                                                }
                                                                className="text-[#717073] text-[15px] font-semibold bg-transparent focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-1/2">
                                                        <motion.div
                                                            key={`sessionPlanId-${index}`}
                                                            initial={{ opacity: 0, x: 10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 10 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <SessionPlanSelect
                                                                idx={index}
                                                                value={sessionMappings[index]?.sessionPlanId || ""}
                                                                onChange={handleMappingChange}
                                                                usedSessionPlans={sessionMappings
                                                                    .map(s => s.sessionPlanId)
                                                                    .filter(id => id !== "" && id !== null && id !== undefined)} />

                                                        </motion.div>
                                                    </div>
                                                </div>
                                            ))}


                                            <div className="flex gap-4 justify-between">
                                                <div className="w-1/2" />
                                                <div className="w-full flex items-center gap-2">
                                                    <button
                                                        className="flex whitespace-nowrap w-6/12 items-center justify-center gap-1 border hover:border-blue-500 border-gray-400 hover:text-[#237FEA]  text-[#717073] px-4 py-2 rounded-lg text-base font-semibold"
                                                        onClick={() => setIsMapping(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveMappings}
                                                        className="bg-[#237FEA] whitespace-nowrap text-white text-base w-6/12 font-semibold px-6 py-3 rounded-lg hover:bg-blue-700"
                                                    >
                                                        Save
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

        export default Create;