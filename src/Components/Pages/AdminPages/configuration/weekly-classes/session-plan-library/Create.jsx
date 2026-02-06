import Select from "react-select";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import Loader from '../../../contexts/Loader';
import { Editor } from '@tinymce/tinymce-react';
import { showError, showSuccess, showWarning, showConfirm, showLoading, ThemeSwal } from "../../../../../../utils/swalHelper";
import { Mic, StopCircle, Copy, Play } from "lucide-react";

import { useSessionPlan } from '../../../contexts/SessionPlanContext';
import ProgressBar from "../../../contexts/ProgressBar";

const Create = () => {
    const videoInputRef = useRef(null);
    const [removedImages, setRemovedImages] = useState([]); // Separate state for removed URLs

    const uploadInputRef = useRef(null);
    const [planLoading, setPlanLoading] = useState(false);
    const MultiValue = () => null; // Hides the default selected boxes
    const exerciseRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef(null);
    const [editIndex, setEditIndex] = useState(null); // null = not editing
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("adminToken");

    useEffect(() => {
        setMounted(true);
    }, [])
    const tabRef = useRef(null);
    const bannerInputRef = useRef(null);
    const [bannerPreviews, setBannerPreviews] = useState({});
    const [bannerFiles, setBannerFiles] = useState({})
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const level = searchParams.get("level");
    const tabs = ['beginner', 'intermediate', 'advanced', 'pro'];
    const [activeTab, setActiveTab] = useState('beginner');
    const fileInputRef = useRef(null);
    const [page, setPage] = useState(1);
    const [photoPreview, setPhotoPreview] = useState([]);
    // console.log('photoPreview', photoPreview)

    const [groupName, setGroupName] = useState('');
    const [groupNameSection, setGroupNameSection] = useState('');
    const [player, setPlayer] = useState('');
    const [skillOfTheDay, setSkillOfTheDay] = useState('');
    const [descriptionSession, setDescriptionSession] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewShowModal, setPreviewShowModal] = useState(false);
    const { fetchExercises, sessionGroup, groups, updateDiscount, progressLoading, uploadProgress, createSessionExercise, fetchExerciseById, deleteExercise, duplicatePlan, setLoading, updateSessionExercise, selectedGroup, loading, createGroup, selectedExercise, exercises, updateGroup, setExercises, createSessionGroup } = useSessionPlan();
    const [selectedPlans, setSelectedPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const visibleTabs = level ? tabs.filter((tab) => tab.toLowerCase() == level.toLowerCase()) : tabs;
    // console.log('visibleTabs', visibleTabs)
    // console.log('tabs', tabs)

    // console.log('exercises', exercises)
    const [recording, setRecording] = useState(null); // stores Blob
    const [audioURL, setAudioURL] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);
    const timerRef = useRef(null);
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                try {
                    const blob = new Blob(audioChunks.current, { type: "audio/webm" });
                    const url = URL.createObjectURL(blob);

                    // ⏳ short delay ensures recording fully flushed
                    setTimeout(() => {
                        setRecording(blob);
                        setAudioURL(url);
                    }, 200);

                    // 🔒 release mic
                    stream.getTracks().forEach((track) => track.stop());
                } catch (err) {
                    console.error("Error finalizing recording:", err);
                }
            };

            mediaRecorderRef.current.start();
            setRecording("in-progress");
            setElapsedTime(0);

            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            showWarning("Permissions Denied", "Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        try {
            mediaRecorderRef.current?.stop();
        } catch (err) {
            console.error("Error stopping recording:", err);
        }
        clearInterval(timerRef.current);
    };

    const formatTime = (secs) => {
        const m = String(Math.floor(secs / 60)).padStart(2, "0");
        const s = String(secs % 60).padStart(2, "0");
        return `${m}:${s}`;
    };



    // console.log('level', level)

    const [sessionExerciseId, setSessionExerciseId] = useState([]); // or selectedPlans[0]?.id
    const [levels, setLevels] = useState([]);
    // State for raw file instead of preview URL
    const [videoFiles, setVideoFiles] = useState({});
    const [videoPreviews, setVideoPreviews] = useState({});



    const [uploadFiles, setUploadFiles] = useState({});
    const [uploadPreviews, setUploadPreviews] = useState({});
    const [videoFilePreview, setVideoFilePreview] = useState(null);
    const [bannerFilePreview, setBannerFilePreview] = useState(null);

    const [bannerFile, setBannerFile] = useState(null);
    ;

    const [packageDetails, setPackageDetails] = useState('');
    const [terms, setTerms] = useState('');
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        duration: '',
        description: '',
        image: [], // new field

    });

    console.log('formData', formData)

    const [openForm, setOpenForm] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        return () => {
            photoPreview.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [photoPreview]);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    const handleVideoChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                showError("File too large", "Video size should not exceed 10 MB.");
                e.target.value = null; // Reset file input
                return;
            }

            const url = URL.createObjectURL(file);

            setVideoFiles((prev) => ({
                ...prev,
                [activeTab]: file,
            }));

            setVideoPreviews((prev) => ({
                ...prev,
                [activeTab]: url,
            }));

            // console.log(`🎥 Video selected for ${activeTab}:`, file.name);
        }
    };
    const handleUploadChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);

            setUploadFiles((prev) => ({
                ...prev,
                [activeTab]: file,
            }));

            setUploadPreviews((prev) => ({
                ...prev,
                [activeTab]: url,
            }));

            // console.log(`🎥 Upload selected for ${activeTab}:`, file.name);
        }
    };
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Inside your event handler
        if (file.size > MAX_FILE_SIZE) {
            showError("Oops...", "Banner image size should not exceed 10 MB.");
            e.target.value = null;
            return;
        }
        const url = URL.createObjectURL(file);

        setBannerFiles(prev => ({
            ...prev,
            [activeTab]: file,
        }));

        setBannerPreviews(prev => ({
            ...prev,
            [activeTab]: url,
        }));
    };
    useEffect(() => {
        // Cleanup all URLs on unmount
        return () => {
            Object.values(videoPreviews).forEach(URL.revokeObjectURL);
            Object.values(bannerPreviews).forEach(URL.revokeObjectURL);
        };
    }, []);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).filter(Boolean);

        if (!files.length) return;

        // Create new previews
        const newPreviews = files.map((file) => URL.createObjectURL(file));

        // Add to existing previews
        setPhotoPreview((prev) => [...prev, ...newPreviews]);

        // Add to formData.images (ensure it's always an array of Files)
        setFormData((prev) => ({
            ...prev,
            images: [...(Array.isArray(prev.images) ? prev.images : []), ...files],
        }));
    };



    const handleRemoveImage = (index) => {
        console.log('handleRemoveImage', index)

        setPhotoPreview((prev) => {
            const urlToRemove = prev[index];

            // Revoke the object URL to avoid memory leaks
            URL.revokeObjectURL(urlToRemove);

            // Remove the URL from preview array
            const newPreview = prev.filter((_, i) => i !== index);

            // Update removedImages state outside formData
            setRemovedImages((prevRemoved) => [...prevRemoved, urlToRemove]);

            // Remove corresponding file from images in formData
            setFormData((prevForm) => ({
                ...prevForm,
                images: Array.isArray(prevForm.images)
                    ? prevForm.images.filter((_, i) => i !== index)
                    : [],
            }));

            return newPreview;
        });
    };

    const handleCreateSession = (finalSubmit = false) => {
        if (isProcessing) return;


        if (!groupNameSection || !player || !skillOfTheDay || !descriptionSession || selectedPlans.length === 0) {
            showWarning("Missing Fields", "Please fill out all required fields before proceeding.");
            return;
        }

        setIsProcessing(true);

        // if (!finalSubmit && tabRef.current) {
        //     tabRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // }
        // console.log('selectedPlanssssssssssss', selectedPlans)

        const currentLevel = {
            level: activeTab,
            player,
            groupNameSection,
            skillOfTheDay,
            recording,
            descriptionSession,
            videoFile: videoFiles[activeTab] || null,
            uploadFile: uploadFiles[activeTab] || null,
            bannerFile: bannerFiles[activeTab] || null,
            sessionExerciseIds: selectedPlans.map(plan => plan.id),
        };

        setLevels((prevLevels) => {
            const existingIndex = prevLevels.findIndex((lvl) => lvl.level === activeTab);
            const updated = [...prevLevels];
            if (existingIndex !== -1) {
                updated[existingIndex] = currentLevel;
            } else {
                updated.push(currentLevel);
            }

            // Pass finalSubmit to handleNextTabOrSubmit
            handleNextTabOrSubmit(updated, finalSubmit);


            return updated;
        });

        setIsProcessing(false);
    };

    const handleNextTabOrSubmit = (updatedLevels, forceSubmit = false) => {
        const nextIndex = tabs.findIndex((tab) => tab === activeTab) + 1;
        const isLastTab = nextIndex >= tabs.length;
        // console.log('updatedLevels', updatedLevels)

        // ✅ Only send the activeTab when editing
        const levelsToSend = (isEditMode && id && level)
            ? updatedLevels.filter(item => item.level === activeTab)
            : updatedLevels;

        const transformed = {
            groupName: groupNameSection,
            player,
            banner: bannerFile,
            levels: {},
        };
        // console.log('transformed', transformed)
        levelsToSend.forEach((item) => {
            const levelKey = item.level.replace(/s$/i, '').toLowerCase();
            if (item.recording instanceof Blob || item.recording instanceof File) {
                transformed[`${levelKey}_recording`] = item.recording;
            }

            if (!transformed.levels[levelKey]) {
                transformed.levels[levelKey] = [];
            }

            transformed.levels[levelKey].push({
                player: item.player,
                skillOfTheDay: item.skillOfTheDay,
                description: item.descriptionSession,
                sessionExerciseId: item.sessionExerciseIds,
            });
        });

        Object.entries(videoFiles).forEach(([tab, file]) => {
            const levelKey = tab.replace(/s$/i, '').toLowerCase();
            if (file instanceof File) {
                transformed[`${levelKey}_video`] = file;
            } else if (typeof file === "string") {
                transformed[`${levelKey}_video`] = file;
            }
        });
        Object.entries(uploadFiles).forEach(([tab, file]) => {
            const levelKey = tab.replace(/s$/i, '').toLowerCase();
            if (file instanceof File) {
                transformed[`${levelKey}_upload`] = file;
            } else if (typeof file === "string") {
                transformed[`${levelKey}_upload`] = file;
            }
        });
        Object.entries(bannerFiles).forEach(([tab, file]) => {
            const levelKey = tab.replace(/s$/i, '').toLowerCase();
            if (file instanceof File || typeof file === "string") {
                transformed[`${levelKey}_banner`] = file;
            }
        });



        if ((isEditMode && id && level) || isLastTab || forceSubmit) {
            if (isEditMode && id && level) {
                // console.log('transformed', transformed)
                updateDiscount(id, transformed);
            } else {
                // console.log('transformed', transformed)
                createSessionGroup(transformed, true);
            }
        } else {
            // ✅ move to next tab but restore its data if exists
            const nextTab = tabs[nextIndex];
            setActiveTab(nextTab);
            setPage(1);


            // console.log('nextTab', nextTab)
            const existingLevel = updatedLevels.find((lvl) => lvl.level === nextTab);
            console.log('existinasasagLevel', existingLevel)

            if (existingLevel) {
                setPlayer(existingLevel.player || "");
                setSkillOfTheDay(existingLevel.skillOfTheDay || "");
                setRecording(existingLevel.recording || null);

                // ✅ Revoke old URL if exists
                if (audioURL) {
                    URL.revokeObjectURL(audioURL);
                }

                // ✅ Create a new audio URL if recording exists
                if (existingLevel.recording instanceof Blob || existingLevel.recording instanceof File) {
                    const url = URL.createObjectURL(existingLevel.recording);
                    setAudioURL(url);
                } else {
                    setAudioURL(null);
                }

                setDescriptionSession(existingLevel.descriptionSession || "");
                setSelectedPlans(
                    existingLevel.sessionExerciseIds
                        ?.map(id => exercises.find(ex => ex.id === id))
                        .filter(Boolean) || []
                );


            } else {
                // fresh tab
                setPlayer("");
                setSkillOfTheDay("");
                setRecording(null);

                if (audioURL) URL.revokeObjectURL(audioURL); // revoke old
                setAudioURL(null);

                setDescriptionSession("");
                setSelectedPlans([]);
            }



        }
    };



    useEffect(() => {
        return () => {
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
        };
    }, [audioURL]);



    useEffect(() => {
        console.log('level from URL:', level);
        if (level) {
            const matchedTab = tabs.find(
                tab => tab.toLowerCase() == level.toLowerCase()
            );
            setActiveTab(matchedTab || 'beginner');
        } else {
            const tabFromUrl = level && tabs.includes(level) ? (level) : 'beginner';
            setActiveTab(tabFromUrl);
        }
    }, [level]);

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                setIsEditMode(true);
                // Wait for group data to be fetched first

                await fetchGroupById();
            }

            // Then fetch exercises/packages
            try {
                const response = await fetchExercises();
                if (response?.status && Array.isArray(response.data)) {
                    setPlans(response.data);
                }
            } catch (error) {
                console.error("Error fetching exercises:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, fetchExercises]);

    // Load selectedGroup and levels initially

    const fetchGroupById = useCallback(async () => {
        if (!token) return;
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-group/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();
            const data = result.data || {};

            // console.log('data-(main)', data);

            // Parse levels safely
            let parsedLevels = data.levels || {};
            if (typeof parsedLevels === "string") {
                try {
                    parsedLevels = JSON.parse(parsedLevels);
                } catch (err) {
                    console.error("Failed to parse levels JSON:", err);
                    parsedLevels = {};
                }
            }

            // Prepare video/upload maps
            const videoMap = {};
            const videoPreviewMap = {};
            const uploadMap = {};
            const uploadPreviewMap = {};
            const bannerMap = {};
            const bannerPreviewMap = {};
            (visibleTabs || []).forEach((levelKey) => {
                const videoKey = `${levelKey}_video`;
                const uploadKey = `${levelKey}_upload`;
                const bannerKey = `${levelKey}_banner`;
                if (data[videoKey]) {
                    videoMap[levelKey] = data[videoKey];
                    videoPreviewMap[levelKey] = data[videoKey];
                }
                if (data[uploadKey]) {
                    uploadMap[levelKey] = data[uploadKey];
                    uploadPreviewMap[levelKey] = data[uploadKey];
                }
                if (data[bannerKey]) {
                    bannerMap[levelKey] = data[bannerKey];
                    bannerPreviewMap[levelKey] = data[bannerKey];
                }
            });

            setUploadFiles(uploadMap);
            setUploadPreviews(uploadPreviewMap);
            setVideoFiles(videoMap);
            setVideoPreviews(videoPreviewMap);
            setBannerFiles(bannerMap);
            setBannerPreviews(bannerPreviewMap);


            setBannerFile(data.banner || '');

            // Load all levels safely
            const loadedLevels = [];
            Object.entries(parsedLevels).forEach(([levelKey, sessions]) => {
                (sessions || []).forEach((session) => {
                    loadedLevels.push({
                        level: levelKey,
                        player: session.player || data.player || '',
                        skillOfTheDay: session.skillOfTheDay || '',
                        recording: data[`${levelKey}_upload`] || session._upload || '',
                        descriptionSession: session.description || '',
                        sessionExerciseId: session.sessionExerciseId || [],
                        sessionExercises: session.sessionExercises || [],
                        bannerFile: data[`${levelKey}_banner`] || '',
                        videoFile: data[`${levelKey}_video`] || '',
                        uploadFile: data[`${levelKey}_upload`] || '',
                    });
                });
            });

            setLevels(loadedLevels);
            console.log('loadedLevelsloadedLevels', loadedLevels)
            console.log('activeTabadedLevels', activeTab)

            // Safe access to existing level
            const existingLevel = loadedLevels.find(
                (lvl) => lvl.level?.toLowerCase() === level?.toLowerCase()
            );

            if (!existingLevel) {
                console.warn("No matching level found for activeTab:", activeTab);
            }
            setPlayer(existingLevel?.player || '');
            setSkillOfTheDay(existingLevel?.skillOfTheDay || '');
            setRecording(existingLevel?.recording || '');
            setDescriptionSession(existingLevel?.descriptionSession || '');
            setSessionExerciseId(existingLevel?.sessionExerciseId || []);
            setGroupNameSection(data.groupName || '');
            const currentLevelData = loadedLevels.find((item) => item.level === level?.toLowerCase());
            setSelectedPlans(
                (currentLevelData?.sessionExercises || []).map((exercise) => ({
                    id: exercise.id,
                    title: exercise.title || '',
                    duration: exercise.duration || '',
                    description: exercise.description || '',
                    imageUrl: exercise.imageUrl || '',
                    images: exercise.imageUrl || '',
                }))
            );

        } catch (err) {
            console.error("Failed to fetch group:", err);
        } finally {
            setLoading(false);
        }
    }, [token, id, activeTab, visibleTabs]);


    useEffect(() => {
        return () => {
            Object.values(videoPreviews).forEach((url) => {
                if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
            });
        };
    }, []);
    useEffect(() => {
        return () => {
            Object.values(bannerPreviews).forEach(url => {
                if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
            });
        };
    }, []);
    console.log('bannerPreviews', bannerPreviews)
    // Update audio URL when tab changes
    useEffect(() => {
        if (levels.length > 0) {
            const currentLevel = levels.find((lvl) => lvl.level === activeTab);

            if (currentLevel) {
                if (currentLevel._upload instanceof Blob) {
                    setAudioURL(URL.createObjectURL(currentLevel.recording));
                } else if (
                    typeof currentLevel.recording === "string" &&
                    currentLevel.recording.startsWith("http")
                ) {
                    setAudioURL(currentLevel.recording);
                } else {
                    setAudioURL(null);
                }

                setRecording(currentLevel.recording || null);
            }
        }
    }, [levels, activeTab]);






    const planOptions = exercises?.map((plan) => ({
        value: plan.id,
        label: `${plan.duration}: ${plan.title}`,
        data: plan, // to retain full plan data
    }));


    // console.log('planOptions', planOptions)
    const selectedOptions = selectedPlans.map((plan) => ({
        value: plan?.id,
        label: `${plan?.duration}: ${plan?.title}`,
        data: plan,
        imageUrl: plan.imageUrl,
    }));


    // console.log('selectedPlans', selectedPlans)
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [selectedOptions]);

    const handleSelectChange = (selected) => {
        setSelectedPlans(selected ? selected.map((item) => item.data) : []);
    };

    const handleAddPlan = () => {
        setOpenForm(true);

    };
    useEffect(() => {
        if (openForm) {
            const isMobile = window.innerWidth <= 769; // mobile + tablet breakpoint
            exerciseRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: isMobile ? '' : 'start', // scroll bottom on mobile, top on desktop
            });
        }
    }, [openForm]);


    const handleDeletePlan = async (index, id) => {
        const result = await showConfirm(
            "Choose an action for this plan",
            "This action cannot be undone",
            "Permanent Delete",
            true
        );

        if (result.isConfirmed) {
            // Permanent Delete
            try {
                await deleteExercise(id); // your API call
                removeFromUI(index);      // remove from UI after backend success
                showSuccess('Deleted!', 'Exercise deleted successfully');
            } catch (error) {
                showError('Error deleting!', 'Failed to delete exercise.');
            }
        } else if (result.isDenied) {
            // Just Remove from UI
            removeFromUI(index);
        }
        // Cancel / Do Nothing → do nothing
    };
    const removeFromUI = (index) => {
        const updated = [...selectedPlans];
        updated.splice(index, 1);
        setSelectedPlans(updated);
    };
    function cleanDescriptionHtml(html) {
        if (!html) return "";

        return html
            // remove empty paragraphs like <p>&nbsp;</p>
            .replace(/<p>(&nbsp;|\s|&nbsp;\s)*<\/p>/gi, "")
            // replace non-breaking spaces with regular spaces
            .replace(/&nbsp;/g, " ")
            // trim spaces inside list items
            .replace(/<li[^>]*>\s*(.*?)\s*<\/li>/gi, "<li>$1</li>")
            // ensure ul stays ul and ol stays ol — don't change them
            // (this line just to be safe if malformed nesting happens)
            .replace(/<\/(ul|ol)><\/p>/gi, "</$1>")
            .trim();
    }

    const handleSavePlan = async () => {
        const { title, duration, description, images } = formData;

        // console.log('formData---(35)', formData)

        const showAlert = ({ type = "info", message = "", title = "" }) => {
            if (type === "success") {
                showSuccess(title || "Success", message);
            } else if (type === "error") {
                showError(title || "Error", message);
            } else if (type === "warning") {
                showWarning(title || "Warning", message);
            } else {
                showSuccess(title || "Info", message);
            }
        };

        if (!title?.trim()) {
            showAlert({ type: "warning", message: "Title is required", title: "Missing Field" });
            return;
        }
        if (!images) {
            showAlert({ type: "warning", message: "Image is required", title: "Missing Field" });
            return;
        }
        if (!duration?.trim()) {
            showAlert({ type: "warning", message: "Duration is required", title: "Missing Field" });
            return;
        }

        setPlanLoading(true);

        try {
            // ---------------------- EDIT MODE ----------------------
            if (editIndex !== null) {
                const planToEdit = selectedPlans[editIndex];
                const exerciseId = planToEdit?.id;
                if (!exerciseId) throw new Error("Invalid exercise ID");

                // ✅ Prepare API payload
                const payload = {
                    ...formData,
                    existingImages: planToEdit.imageUrl || [],  // previously saved image URLs
                    newImages: formData.images || [],            // newly uploaded image files
                };
                if (removedImages) {
                    payload.removedImages = removedImages;
                }

                const res = await updateSessionExercise(exerciseId, payload);
                const updatedExercise = res?.data?.data || res?.data;
                if (!updatedExercise) throw new Error("Invalid API response");

                // 🔧 Normalize image URLs before merging
                const parseImageList = (val) => {
                    if (!val) return [];
                    try {
                        if (Array.isArray(val)) return val;
                        if (typeof val === "string") {
                            const parsed = JSON.parse(val);
                            return Array.isArray(parsed) ? parsed : [parsed];
                        }
                    } catch {
                        // fallback: remove brackets/quotes manually
                        return val
                            .toString()
                            .replace(/[\[\]"']/g, "")
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean);
                    }
                    return [];
                };

                const oldImages = parseImageList(planToEdit.imageUrl);
                const newImages = parseImageList(updatedExercise.images);

                const mergedImages = Array.from(new Set([...oldImages, ...newImages])).filter(Boolean);

                // 🔹 Update local state
                const updatedPlans = selectedPlans.map((plan) =>
                    plan.id === exerciseId
                        ? {
                            ...plan,
                            title: updatedExercise.title || plan.title,
                            duration: updatedExercise.duration || plan.duration,
                            description: updatedExercise.description || plan.description,
                            imageUrl: mergedImages,
                        }
                        : plan
                );
                console.log('Removed images:', removedImages);

                // Only add removedImages if it's a non-empty array
                if (Array.isArray(removedImages) && removedImages.length > 0) {
                    updatedPlans.removedImages = removedImages;
                }

                setSelectedPlans(updatedPlans);

                if (isEditMode) fetchGroupById();


                showAlert({ type: "success", message: "Exercise updated successfully!", title: "Updated" });
                setEditIndex(null);
            }

            // ---------------------- ADD MODE ----------------------
            else {
                const data = new FormData();

                data.append("title", formData.title);
                data.append("duration", formData.duration);
                const cleanedDescription = cleanDescriptionHtml(formData.description);
                data.append("description", cleanedDescription);
                // append all image files
                (formData.images || []).forEach((file) => {
                    if (file instanceof File) data.append("images", file);
                });

                const res = await createSessionExercise(formData);
                const newExercise = res?.data?.data || res?.data;
                if (!newExercise) throw new Error("Invalid API response");

                showAlert({ type: "success", message: "Exercise saved successfully!", title: "Saved" });
                // you can optionally refresh group if needed
                // fetchGroupById();
            }

            // ✅ Reset form and close modal
            setPhotoPreview([]);
            setFormData({
                title: "",
                duration: "",
                description: "",
                images: [], // consistent field name (not image)
            });
            setOpenForm(false);
        } catch (err) {
            console.error("❌ Error saving exercise:", err);
            showAlert({
                type: "error",
                message: err?.message || "Something went wrong",
                title: "Error",
            });
        } finally {
            setRemovedImages([])
            setPlanLoading(false);
            fetchExercises();

        }
    };









    const videoPreviewUrl = useMemo(() => {
        const file = videoFiles[activeTab];
        if (file && typeof file !== "string") {
            return URL.createObjectURL(file);
        }
        return typeof file === "string" ? file : null;
    }, [videoFiles, activeTab]);

    const bannerPreviewUrl = useMemo(() => {
        if (bannerFile && typeof bannerFile !== "string") {
            return URL.createObjectURL(bannerFile);
        }
        return typeof bannerFile === "string" ? bannerFile : null;
    }, [bannerFile]);

    const handleDuplicateExercise = async (weekId) => {
        const result = await showConfirm("Duplicate Exercise?", "This Exercise will be duplicated.", "Yes, duplicate it!");
        if (result.isConfirmed) {
            try {
                showLoading("Duplicating...");
                await duplicatePlan(weekId); // Call your duplication function
                showSuccess('Duplicated!', 'The Exercise has been duplicated.');
            } catch (err) {
                console.error(err);
                showError('Error!', 'Failed to duplicate the Exercise.');
            } finally {
                setLoading(false);
            }
        }
    };
    console.log('removedImages', removedImages)
    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }
    if (progressLoading) {
        return (
            <>
                <ProgressBar uploadProgress={uploadProgress} />
            </>
        )
    }


    // console.log('formData', formData)
    const stripHtml = (html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setPage(1);

        if (videoInputRef.current) videoInputRef.current.value = null;
        if (uploadInputRef.current) uploadInputRef.current.value = null;

        if (bannerInputRef.current) bannerInputRef.current.value = null;

        // 🔥 You were missing this line!
        // Handle per-tab video
        const existingLevel = levels.find((lvl) => lvl.level === tab);
        console.log('tab', tab)
        console.log('existingLevel (1)', existingLevel)
        if (existingLevel?.videoFile) {
            setVideoFiles((prev) => ({
                ...prev,
                [tab]: existingLevel.videoFile,
            }));
        }
        if (existingLevel?.uploadFile) {
            setUploadFiles((prev) => ({
                ...prev,
                [tab]: existingLevel.uploadFile,
            }));
        }
        if (existingLevel?.bannerFile) {
            setBannerFiles(prev => ({
                ...prev,
                [tab]: existingLevel.bannerFile,
            }));


        }

        console.log('existingLevelchekk(1)', existingLevel)

        if (existingLevel) {
            setPlayer(existingLevel.player || "");
            setSkillOfTheDay(existingLevel.skillOfTheDay || "");
            setRecording(existingLevel.recording || null);

            // 👇 Recreate audio URL from saved blob
            if (existingLevel.recording instanceof Blob) {
                const url = URL.createObjectURL(existingLevel.recording);
                setAudioURL(url);
            } else {
                setAudioURL(null);
            }

            setDescriptionSession(existingLevel.descriptionSession || "");
            setSelectedPlans(
                existingLevel.sessionExerciseIds
                    ?.map(id => exercises.find(ex => ex.id === id))
                    .filter(Boolean) || []
            );
        } else {
            // No saved data for this tab — clear everything
            setPlayer("");
            setSkillOfTheDay("");
            setRecording(null);
            setAudioURL(null);
            setDescriptionSession("");
            setSelectedPlans([]);
        }
    };
    const sortedOptions = planOptions.sort((a, b) => {
        const aSelected = selectedOptions.some(o => o.value === a.value);
        const bSelected = selectedOptions.some(o => o.value === b.value);

        // If a is selected and b is not, a goes after b
        if (aSelected && !bSelected) return 1;
        if (!aSelected && bSelected) return -1;
        return 0; // keep original order if both selected or both unselected
    });

    return (

        <div className=" md:p-6 md:pl-0 bg-gray-50 min-h-screen">

            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2`}>
                <h2
                    ref={exerciseRef}
                    onClick={() => {
                        if (previewShowModal) {
                            setPreviewShowModal(false);
                        } else {
                            navigate('/configuration/weekly-classes/session-plan-list');
                        }
                    }}
                    className="text-xl md:text-2xl font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                    <img
                        src="/images/icons/arrow-left.png"
                        alt="Back"
                        className="w-5 h-5 md:w-6 md:h-6"
                    />
                    <span className="truncate">
                        {previewShowModal ? '2023/24 Standard Pricing preview' : 'Add a Session Plan Group'}
                    </span>
                </h2>


            </div>

            <div className={`flex mobileBlock flex-col gap-10 md:flex-row bg-white  rounded-3xl ${previewShowModal ? 'md:min-w-3/4  md:p-10' : 'w-full  md:p-12 p-4'}`}>

                <>
                    <div className={`transition-all duration-300 fullWidthTabMobile w-full md:w-1/2`}>
                        <div className="rounded-2xl  md:pe-10 mt-8 ">
                            <form className="mx-auto  space-y-4">


                                <div>
                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Group Name
                                    </label>
                                    <input
                                        value={groupNameSection}
                                        onChange={(e) => setGroupNameSection(e.target.value)}
                                        type="text"
                                        required
                                        disabled={isEditMode}
                                        placeholder="Enter Group Name"
                                        className={`w-full px-4 font-semibold text-[18px] py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditMode ? 'disabled cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                {/* Description */}



                                <div className="md:flex gap-2 justify-between my-10 border w-full border-gray-300 p-1 tabBar rounded-xl  flex-wrap">
                                    {visibleTabs.map((tab) => (
                                        <button
                                            type="button"
                                            ref={tabRef}
                                            key={tab}
                                            onClick={() => handleTabClick(tab)}
                                            className={`px-4 py-1.5 rounded-xl text-[19.28px] py-2  capitalize transition ${activeTab == tab ? 'bg-blue-500 font-medium  text-white' : 'text-gray-500 font-semibold  hover:text-blue-500'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}

                                </div>
                                <div className="flex w-full gap-4">
                                    {/* VIDEO */}
                                    <div className="w-full">
                                        <button
                                            type="button"
                                            onClick={() => videoInputRef.current.click()}
                                            className="w-full h-12 rounded-xl border border-blue-500 text-[#237FEA] font-semibold hover:bg-blue-50 transition"
                                        >
                                            {videoFiles[activeTab] ? "Change Video" : "Add Video"}
                                        </button>

                                        <input
                                            type="file"
                                            ref={videoInputRef}
                                            onChange={handleVideoChange}
                                            accept="video/*"
                                            className="hidden"
                                        />

                                        {/* VIDEO PREVIEW */}
                                        {videoPreviews[activeTab] && (
                                            <div className="mt-4 rounded-xl border shadow-md bg-white overflow-hidden">
                                                <label className="block text-sm font-semibold text-gray-700 p-3 capitalize">
                                                    {activeTab} Video Preview
                                                </label>

                                                <div className="h-[220px] bg-gray-100 flex items-center justify-center">
                                                    <video
                                                        controls
                                                        src={videoPreviews[activeTab]}
                                                        className="h-full max-w-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* BANNER */}
                                    <div className="w-full">
                                        <button
                                            type="button"
                                            onClick={() => bannerInputRef.current.click()}
                                            className="w-full h-12 rounded-xl border border-blue-500 text-[#237FEA] font-semibold hover:bg-blue-50 transition"
                                        >
                                            {bannerFiles[activeTab] ? "Change Banner" : "Add Banner"}
                                        </button>

                                        <input
                                            type="file"
                                            ref={bannerInputRef}
                                            onChange={handleBannerChange}
                                            accept="image/*"
                                            className="hidden"
                                        />

                                        {/* BANNER PREVIEW */}
                                        {bannerPreviews[activeTab] && (
                                            <div className="mt-4 rounded-xl border shadow-md bg-white overflow-hidden">
                                                <label className="block text-sm font-semibold text-gray-700 p-3 capitalize">
                                                    {activeTab} Banner Preview
                                                </label>

                                                <div className="h-[220px] bg-gray-100 flex items-center justify-center">
                                                    <img
                                                        src={bannerPreviews[activeTab]}
                                                        alt="Banner Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>

                                    <div className="flex w-full  gap-4 items-center">
                                        <button
                                            type="button"
                                            onClick={() => uploadInputRef.current.click()}
                                            className="flex w-full items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                                        >
                                            {uploadFiles[activeTab] ? "Change Audio" : "Upload Audio"}
                                        </button>
                                        <input
                                            type="file"
                                            ref={uploadInputRef}
                                            onChange={handleUploadChange}
                                            accept="audio/*"
                                            className="hidden"
                                        />

                                        {/* Add Banner */}

                                    </div>
                                </div>

                                {uploadPreviews[activeTab] && (
                                    <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mt-6 w-full">
                                        {/* Video Preview */}

                                        <div className="w-full md:w-full bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                                            <label className="block text-sm font-semibold mb-2 text-gray-700 p-4 capitalize">
                                                {activeTab} Audio Preview
                                            </label>
                                            <div className="w-full ">
                                                <audio
                                                    controls
                                                    className="w-full p-2"
                                                    src={uploadPreviews[activeTab]}
                                                    onError={() =>
                                                        console.error(`Failed to load ${activeTab} Audio`, uploadFiles[activeTab])
                                                    }
                                                />
                                            </div>
                                        </div>

                                    </div>
                                )}

                                <div>
                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Player
                                    </label>
                                    <input

                                        value={player}
                                        onChange={(e) => setPlayer(e.target.value)}
                                        type="text"
                                        requiredx
                                        className="w-full px-4 font-semibold py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div ref={containerRef}>

                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Skill of the day
                                    </label>
                                    <input
                                        value={skillOfTheDay}
                                        onChange={(e) => setSkillOfTheDay(e.target.value)}
                                        type="text"
                                        required
                                        className="w-full px-4 font-semibold py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>



                                <div>
                                    <label className="block text-[18px]  font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <input

                                        value={descriptionSession}
                                        onChange={(e) => setDescriptionSession(e.target.value)}
                                        type="text"
                                        required
                                        className="w-full px-4 font-semibold py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Payment Plans */}
                                <div className="w-full">
                                    {/* Label - Clickable to toggle options */}
                                    <div

                                        className="flex items-center justify-between cursor-pointer mb-2"
                                        onClick={() => setIsOpen(!isOpen)}
                                    >
                                        <label className="block text-[18px] font-semibold text-gray-700">
                                            Exercises
                                        </label>

                                    </div>

                                    {/* Animated Collapsible Plan Select Area */}


                                    {/* Selected Plans */}
                                    <div className="relative">
                                        <div

                                            onClick={() => setIsOpen(!isOpen)}
                                            className="mt-4 space-y-2 border border-gray-200 px-4 py-3 rounded-lg max-h-28 overflow-auto"
                                        >
                                            {selectedPlans.length > 0 ? (
                                                selectedPlans.map((plan, idx) => {
                                                    // console.log('plan', plan)
                                                    return (
                                                        <div
                                                            key={plan.id || idx}
                                                            className="flex items-center font-semibold justify-between"
                                                        >
                                                            <span>{`${plan.duration || plan.data.duration}: ${plan.title || plan.label}`}</span>

                                                            <div className="flex gap-2 i">
                                                                <img
                                                                    src="/images/icons/edit2.png"
                                                                    alt="Edit"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();

                                                                        setEditIndex(idx);
                                                                        setRemovedImages([]);

                                                                        // 🔥 get fresh fetched data directly
                                                                        const exerciseData = await fetchExerciseById(plan.id);

                                                                        if (!exerciseData) return;

                                                                        // console.log("exerciseData", exerciseData);

                                                                        const existingImages =
                                                                            typeof exerciseData.imageUrl === "string"
                                                                                ? JSON.parse(exerciseData.imageUrl || "[]")
                                                                                : Array.isArray(exerciseData.imageUrl)
                                                                                    ? exerciseData.imageUrl
                                                                                    : [];

                                                                        setFormData({
                                                                            title: exerciseData.title || "",
                                                                            duration: exerciseData.duration || "",
                                                                            description: exerciseData.description || "",
                                                                            images: [],
                                                                            imageUrl: existingImages
                                                                        });

                                                                        setPhotoPreview(existingImages);
                                                                        setOpenForm(true);
                                                                    }}
                                                                    className="w-5 h-5 hover:scale-110 cursor-pointer"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDuplicateExercise(plan.id)
                                                                    }
                                                                    className="text-gray-800 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                                                >
                                                                    <Copy size={18} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeletePlan(idx, plan.id); // pass index and id
                                                                    }}
                                                                    className="text-gray-800 hover:text-red-500"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                }


                                                )
                                            ) : (
                                                <div className="text-gray-400 italic py-3">  </div>
                                            )}
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className=" my-2 p-3 overflow-hidden"
                                                >
                                                    <div className="w-full mb-4">
                                                        <Select
                                                            key={mounted}
                                                            options={sortedOptions}
                                                            value={selectedOptions}
                                                            onChange={handleSelectChange}
                                                            isMulti
                                                            placeholder="Select Exercises..."
                                                            className="react-select-container"
                                                            classNamePrefix="react-select"
                                                            components={{ MultiValue }}
                                                            menuPortalTarget={document.body}
                                                            menuPosition="fixed"
                                                            menuPlacement="auto"
                                                            closeMenuOnSelect={false}
                                                            hideSelectedOptions={false}
                                                            isClearable
                                                            styles={{
                                                                control: (base, state) => ({
                                                                    ...base,
                                                                    borderRadius: "14px",
                                                                    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                                                                    padding: "4px 8px",
                                                                    backgroundColor: "#fff",
                                                                }),
                                                                valueContainer: (base) => ({
                                                                    ...base,
                                                                    maxHeight: "120px",
                                                                    overflowY: "auto",
                                                                    gap: "6px",
                                                                }),
                                                                multiValue: (base) => ({
                                                                    ...base,
                                                                    borderRadius: "10px",
                                                                    backgroundColor: "#eff6ff",
                                                                }),
                                                                multiValueLabel: (base) => ({
                                                                    ...base,
                                                                    color: "#1d4ed8",
                                                                }),
                                                            }}
                                                        />

                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                </div>

                                {/* Add Payment Plan Button */}
                                <button
                                    type="button"
                                    onClick={handleAddPlan}
                                    className="w-full bg-[#237FEA] mb-8 text-white text-[16px] font-semibold py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Add New Exercise
                                </button>

                                {/* Footer Buttons */}
                                <div className="flex flex-wrap flex-col-reverse gap-4 md:flex-row md:items-center md:justify-end md:gap-4">


                                    <button
                                        type="button"
                                        onClick={() => handleCreateSession()} // default = false
                                        disabled={isProcessing}
                                        className={`min-w-50 font-semibold px-6 py-2 rounded-lg w-full md:w-auto 
                                   ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#237FEA] hover:bg-blue-700 text-white'}`}
                                    >
                                        {isProcessing ? 'Processing...' :
                                            (isEditMode && id && level
                                                ? (activeTab === 'pro' ? 'Finish & Update All' : 'Update Session')
                                                : (activeTab === 'pro' ? 'Finish & Save All' : 'Next'))
                                        }
                                    </button>

                                </div>

                            </form>
                        </div>
                    </div>
                    <div className="w-full bg-none md:w-1/2   fullWidthTabMobile max-h-fit">
                        <AnimatePresence>
                            {openForm && (
                                <motion.div
                                    initial={{ x: '100%', opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: '100%', opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="bg-white rounded-3xl p-6 my-8  shadow-2xl relative "
                                >
                                    <button
                                        onClick={() => {
                                            setOpenForm(false);
                                            setEditIndex(null); // ❌ cancel edit
                                            setFormData({ title: '', duration: '', description: '', images: [] });
                                            setPhotoPreview([]);
                                        }}
                                        className="absolute top-3 right-3 hover:text-gray-700 text-5xl"
                                        title="Close"
                                    >
                                        <img src="/images/icons/crossGray.png" alt="" />
                                    </button>
                                    {/* Add your form content here */}
                                    <div className="text-[24px] font-semibold mb-4">Exercise    </div>

                                    {[
                                        { label: "Title", name: "title" },

                                        { label: "Duration", name: "duration" },

                                    ].map((field) => (
                                        <div key={field.name} className="mb-4">
                                            <label className="block text-[18px]  font-semibold text-gray-700 mb-2">{field.label}</label>
                                            <input
                                                type="text"
                                                value={formData[field.name]}
                                                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                                className="w-full px-4 font-semibold text-[18px] py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />

                                        </div>
                                    ))}

                                    <div className="mb-4 relative">
                                        <label className="block text-[18px] font-semibold text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <div className="rounded-md border border-gray-300 bg-gray-100 p-1">
                                            { /* bullist numlist  code */}
                                            <Editor
                                                apiKey="sqe5er2lyngzjf0armhqaw1u7ffh0xgjyzmb7unv5irietwa"
                                                value={formData.description}
                                                onEditorChange={(content) =>
                                                    setFormData({ ...formData, description: content })
                                                }
                                                init={{
                                                    menubar: false,
                                                    plugins: "lists advlist code",
                                                    toolbar:
                                                        "fontsizeselect capitalize bold italic underline alignleft aligncenter bullist numlist",
                                                    height: 200,
                                                    branding: false,
                                                    skin: "oxide", // ✅ use default oxide skin (so we can override styles)
                                                    content_style: `
  body {
    background-color: #f3f4f6;
 font-family: "Poppins", sans-serif !important;
    font-size: 1rem;
    padding: 0px; /* reduced padding */
    color: #111827;
  }

  * {
    font-family:"Poppins", sans-serif !important;
  }
`,
                                                    setup: (editor) => {
                                                        // 🔹 Custom capitalize icon
                                                        editor.ui.registry.addIcon(
                                                            "capitalize-icon",
                                                            '<img src="/images/icons/smallcaps.png" style="width:16px;height:16px;" />'
                                                        );

                                                        // 🔹 Custom capitalize button
                                                        editor.ui.registry.addButton("capitalize", {
                                                            icon: "capitalize-icon",
                                                            tooltip: "Capitalize Text",
                                                            onAction: () => {
                                                                editor.formatter.register("capitalize", {
                                                                    inline: "span",
                                                                    styles: { textTransform: "capitalize" },
                                                                });
                                                                editor.formatter.toggle("capitalize");
                                                            },
                                                        });
                                                    },
                                                }}
                                            />





                                        </div>

                                    </div>

                                    <div>
                                        <div className="w-full">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                ref={fileInputRef}
                                                onChange={handleImageChange}
                                                style={{ display: "none" }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex w-full items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50"
                                            >
                                                Upload images
                                            </button>

                                            {/* Multiple Previews */}
                                            <div className="flex flex-wrap gap-3 mt-3">
                                                {photoPreview.map((src, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={src}
                                                            alt={`preview-${index}`}
                                                            className="w-24 h-24 object-cover rounded-md border border-gray-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>


                                    </div>
                                    <div className="text-right flex justify-end">
                                        <button
                                            onClick={handleSavePlan}
                                            disabled={planLoading}
                                            className={`bg-[#237FEA] text-white mt-5 md:min-w-50 w-full md:w-auto font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 ${planLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {planLoading ? (
                                                <>
                                                    <svg
                                                        className="animate-spin h-5 w-5 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8v8H4z"
                                                        ></path>
                                                    </svg>
                                                    {editIndex !== null ? 'Updating...' : 'Saving...'}
                                                </>
                                            ) : (
                                                editIndex !== null ? 'Update Exercise' : 'Save Exercise'
                                            )}
                                        </button>

                                    </div>






                                </motion.div>
                            )}

                        </AnimatePresence>

                        <div className="flex items-center mt-16 gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    navigate(
                                        `/configuration/weekly-classes/session-plan-preview${isEditMode && id ? `?id=${id}&comesFrom=innerplan` : `?comesFrom=innerplan`
                                        }`,
                                        {
                                            state: {
                                                comesFrom: "innerplan",
                                                activeTab: activeTab,   // <-- your current active tab variable
                                            },
                                        }
                                    );
                                }}

                                className={`flex items-center justify-center gap-1 border border-blue-500 text-[#237FEA] px-4 py-2 rounded-lg font-semibold w-full md:w-auto 
            ${!isEditMode ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-50'}`}
                                disabled={!isEditMode}
                            >
                                Preview Sessions
                                <Eye size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCreateSession(true)} // pass true to finalize
                                disabled={isProcessing}
                                className={`font-semibold px-6 py-2 rounded-lg w-full md:w-auto 
            ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#237FEA] hover:bg-blue-700 text-white'}`}
                            >
                                {isProcessing ? 'Processing...' : isEditMode ? 'Update Group' : 'Create Group'}
                            </button>

                        </div>

                    </div>

                </>
            </div>
        </div>
    );
};

export default Create;
