import React, { useState, useCallback, useRef, useEffect } from "react";
import Select from "react-select";
import { FaEye } from "react-icons/fa";
const tabs = ["Beginner", "Intermediate", "Advanced", "Pro"];
import { Trash2, Copy } from 'lucide-react';
import { useNavigate } from "react-router-dom";

import { Editor } from '@tinymce/tinymce-react';
import Loader from "../../contexts/Loader";
import { showError, showSuccess, showWarning, ThemeSwal } from "../../../../../utils/swalHelper";

export default function BirthdayCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [removedImages, setRemovedImages] = useState([]);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("adminToken");
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState("Beginner");
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [groupData, setGroupData] = useState({
        groupName: "",
        player: "",
        skill: "",
        description: "",
        exercises: [],
        video: null,
        banner: null,
    });

    const [loading, setLoading] = useState(false);

    const MultiValue = () => null; // Hides the default selected boxes
    const [savedTabsData, setSavedTabsData] = useState({});
    const [exercises, setExercises] = useState([]);
    const [isEditExcercise, setIsEditExcercise] = useState(null);
    const exerciseRef = useRef(null);

    const [exercise, setExercise] = useState({
        title: "",
        duration: "",
        description: "",
        image: "",
        imageToSend: ""
    });
    const emptySession = () => {
        setGroupData({
            groupName: "",
            player: "",
            skill: "",
            description: "",
            exercises: [],
            video: null,
            banner: null,
        });
        setSavedTabsData(null);
    }

    const [photoPreview, setPhotoPreview] = useState([]);

    const removeImage = (id) => {
        setPhotoPreview((prev) => {
            const toDelete = prev.find((img) => img.id === id);
            const urlToRemove = toDelete ? toDelete.url : null;
            // Revoke the object URL to avoid memory leaks
            URL.revokeObjectURL(urlToRemove);

            // Remove the URL from preview array


            // Update removedImages state outside formData
            setRemovedImages((prevRemoved) => [...prevRemoved, urlToRemove]);
            if (toDelete?.url?.startsWith("blob:")) {
                URL.revokeObjectURL(toDelete.url);
            }

            // Remove preview
            return prev.filter((img) => img.id !== id);
        });

        // Remove from actual data
        setExercise((prev) => {
            const newPreviewList = photoPreview.filter((img) => img.id !== id);

            return {
                ...prev,
                image: newPreviewList.map((img) => img.url),
                imageToSend: newPreviewList
                    .map((img) => img.file)
                    .filter((f) => f !== null)
            };
        });
    };


    useEffect(() => {
        if (showExerciseModal) {
            const isMobile = window.innerWidth <= 769; // mobile + tablet breakpoint
            exerciseRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: isMobile ? '' : 'start', // scroll bottom on mobile, top on desktop
            });
        }
    }, [showExerciseModal]);


    const emptyExcerCises = () => {
        setExercise(
            {
                title: "",
                duration: "",
                description: "",
                image: "",
                imageToSend: ""
            }
        )
    }
    useEffect(() => {
        setMounted(true);
    }, [])

    const fetchExercises = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/session-exercise/listing`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            setExercises(result.data || []);
        } catch (err) {
            console.error("Failed to fetch packages:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);
    const fetchExcercisesById = useCallback(async (id) => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/session-exercise/listing/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            setExercise(result.data || []);
            const existingImages =
                typeof result.data?.imageUrl === "string" && result.data?.imageUrl.trim() !== ""
                    ? JSON.parse(result.data.imageUrl)
                    : Array.isArray(result.data?.imageUrl)
                        ? result.data.imageUrl
                        : [];

            setPhotoPreview(
                existingImages.map((img, i) => ({
                    id: `api-${i}-${Date.now()}`,
                    type: "api",
                    url: img,
                    file: null
                }))
            );



        } catch (err) {
            console.error("Failed to fetch packages:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const saveExercise = useCallback(
        async (id) => {
            if (!token) return;

            try {

                setLoading(true);


                const formdata = new FormData();
                formdata.append("title", exercise.title);
                formdata.append("description", exercise.description);
                formdata.append("duration", exercise.duration);
                if (removedImages) {
                    formdata.append("removedImages", JSON.stringify(removedImages));
                }
                if (exercise.imageToSend && exercise.imageToSend.length > 0) {
                    exercise.imageToSend.forEach((file) => {
                        formdata.append("images", file);
                    });
                }

                const url = !isEditExcercise
                    ? `${API_BASE_URL}/api/admin/birthday-party/session-exercise/create`
                    : `${API_BASE_URL}/api/admin/birthday-party/session-exercise/update/${id}`;

                const response = await fetch(url, {
                    method: isEditExcercise ? 'PUT' : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formdata,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result?.message || "Something went wrong");
                }

                await fetchExercises();
                showSuccess("Success", "Your Exercise Has Been Saved Succesfylly!");

                emptyExcerCises();
                setShowExerciseModal(false)
                setRemovedImages([])
                return result;
            } catch (err) {
                // Show error alert
                showError("Error", err.message || "Failed to save exercise. Please try again.");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [token, fetchExercises, exercise, isEditExcercise, removedImages]
    );

    const handleDuplicateExercise = useCallback(
        async (id) => {
            if (!token) return;

            try {
                // Show loading 
                setLoading(true);

                const response = await fetch(
                    `${API_BASE_URL}/api/admin/birthday-party/session-exercise/${id}/duplicate`,
                    {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const result = await response.json();
                await fetchExercises();
                showSuccess("Success", "Your Exercise Has Been Duplicated Succesfylly!");


            } catch (err) {
                showError("Error", err.message || "Failed to duplicate exercise. Please try again.");
                console.error("Failed :", err);
            } finally {
                setLoading(false);
            }
        },
        [token, fetchExercises]
    );

    const deleteExercise = useCallback(
        async (id) => {
            if (!token) return;

            try {

                const result = await ThemeSwal.fire({
                    title: "Delete Exercise",
                    html: `
                    <div class="text-[15px] text-gray-700">
                        Choose how you want to delete this exercise.
                    </div>
                `,
                    icon: "warning",
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: "Permanent Delete",
                    denyButtonText: "Just Remove",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#000",
                    denyButtonColor: "#3b82f6",
                    cancelButtonColor: "#6b7280",
                });

                // ------------------------------
                // ❌ CANCEL — DO NOTHING
                // ------------------------------
                if (result.isDismissed) return;

                // ------------------------------
                // 🟦 JUST REMOVE (local only)
                // ------------------------------
                if (result.isDenied) {
                    setGroupData((prev) => ({
                        ...prev,
                        exercises: prev.exercises.filter((ex) => ex.value !== id),
                    }));
                    showSuccess("Exercise removed from this group only.");



                    return;
                }

                // ------------------------------
                // 🔴 PERMANENT DELETE (API DELETE)
                // ------------------------------
                if (result.isConfirmed) {
                    setLoading(true);

                    const response = await fetch(
                        `${API_BASE_URL}/api/admin/birthday-party/session-exercise/delete/${id}`,
                        {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    const data = await response.json();
                    if (response.ok) {
                        await fetchExercises();
                    }

                    // remove from local data
                    setGroupData((prev) => ({
                        ...prev,
                        exercises: prev.exercises.filter((ex) => ex.value !== id),
                    }));
                    showSuccess("Exercise deleted successfully.");

                }
            } catch (err) {
                showError("Error", err.message || "Failed to delete exercise. Please try again.");

                console.error("Failed to delete Exercise:", err);
            } finally {
                setLoading(false);
            }
        },
        [token, fetchExercises]
    );



    const handleSavePlan = async (finalData = savedTabsData) => {
        if (!token) return;

        try {
            setLoading(true);
            const formData = new FormData();
            const levels = {};

            Object.keys(finalData).forEach((level) => {
                const data = finalData[level];
                if (!data) return;

                levels[level.toLowerCase()] = [
                    {
                        skillOfTheDay: data.skill || "",
                        description: data.description || "",
                        sessionExerciseId: data.exercises?.map((ex) => ex.value) || [],
                    },
                ];

                if (data.video?.file) {
                    formData.append(`${level.toLowerCase()}_video`, data.video.file, data.video.file.name);
                }
                if (data.banner?.file) {
                    formData.append(`${level.toLowerCase()}_upload`, data.banner.file, data.banner.file.name);
                }
            });

            formData.append("levels", JSON.stringify(levels));
            formData.append("groupName", groupData.groupName || "");
            formData.append("player", groupData.player || "");
            if (groupData.banner?.file) {
                formData.append("banner", groupData.banner.file, groupData.banner.file.name);
            }
            // if (groupData.video?.file) {
            //     formData.append("video", groupData.video.file, groupData.video.file.name);
            // }

            const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/session-plan-birthdayParty/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.status) {
                await showSuccess(data.message || "Group created successfully.");
                emptySession();
                navigate(`/birthday-party/session-plan`);
            } else {

                await showError(data.message || "Failed to create session group.");

            }
        } catch (err) {
            console.error("Failed to create session group:", err);
            showError("Something went wrong while creating the session group.");

        } finally {
            setLoading(false);
        }
    };




    useEffect(() => {
        fetchExercises();
    }, [])

    const handleExerciseChange = (e) => {
        const { name, value } = e.target;
        setExercise((prev) => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (e) => {
        const { name, value } = e.target;
        setGroupData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            console.log("📂 Uploaded file:", file);
            console.log("🌐 Preview URL:", url);
            console.log("🗂 Type:", type);

            setGroupData((prev) => ({ ...prev, [type]: { file, url } }));

            // ✅ Reset input value to allow re-uploading same file later
            e.target.value = "";
        } else {
            console.warn("⚠️ No file selected.");
        }
    };


    const handleExerciseSelect = (selected) => {
        setGroupData((prev) => ({
            ...prev,
            exercises: selected || [],
        }));
    };
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        const mapped = files.map((file) => ({
            id: `local-${file.name}-${Math.random()}`,
            type: "local",
            url: URL.createObjectURL(file),
            file
        }));

        // update preview
        setPhotoPreview((prev) => [...prev, ...mapped]);

        // update exercise
        setExercise((prev) => ({
            ...prev,
            image: [...(prev.image || []), ...mapped.map((m) => m.url)],
            imageToSend: [...(prev.imageToSend || []), ...mapped.map((m) => m.file)]
        }));
    };


    // Save current tab data excluding banner
    const saveCurrentTab = () => {
        setSavedTabsData((prev) => ({
            ...prev,
            [activeTab]: {
                ...groupData, // save all fields
                banner: undefined, // banner is same for all tabs
            },
        }));
    };
    const gotoNextTab = () => {
        if (!groupData.skill) {
            showWarning("Please fill the skill for this tab before proceeding.");

            return;
        }

        saveCurrentTab();

        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            const nextTab = tabs[currentIndex + 1];
            setActiveTab(nextTab);

            const nextData = savedTabsData[nextTab] || {};
            setGroupData({
                skill: nextData.skill || "",
                description: nextData.description || "",
                exercises: nextData.exercises || [],
                video: nextData.video || null,
                groupName: nextData.groupName || groupData.groupName,
                player: nextData.player || groupData.player,
                banner: groupData.banner, // keep same banner
            });
        }
    };

    const handleCreateSessionClick = async () => {
        if (isSubmitting) return; // 🧤 prevent double click
        setIsSubmitting(true);

        try {
            const currentIndex = tabs.indexOf(activeTab);
            const isLastTab = currentIndex === tabs.length - 1;

            // ✅ Validate fields
            if (!groupData.skill?.trim() || !groupData.description?.trim() || !groupData.exercises?.length) {
                showError("Please fill all the fields before proceeding.");

                return;
            }

            const updatedData = {
                ...savedTabsData,
                [activeTab]: {
                    ...groupData,
                    banner: undefined,
                },
            };
            setSavedTabsData(updatedData);

            if (isLastTab) {
                await handleSavePlan(updatedData);
            } else {
                const nextTab = tabs[currentIndex + 1];
                setActiveTab(nextTab);

                const nextData = updatedData[nextTab] || {};
                setGroupData({
                    skill: nextData.skill || "",
                    description: nextData.description || "",
                    exercises: nextData.exercises || [],
                    video: nextData.video || null,
                    groupName: nextData.groupName || groupData.groupName,
                    player: nextData.player || groupData.player,
                    banner: groupData.banner,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleCreateGroupClick = async () => {
        if (!token) return;

        // ✅ Validate required fields before saving
        if (!groupData.skill?.trim() || !groupData.description?.trim() || !groupData.exercises?.length) {
            await showWarning("Please fill the required fields before proceeding.");

            return;
        }

        // 🧠 Merge current tab data into savedTabsData before submission

        const updatedTabs = {
            ...savedTabsData,
            [activeTab]: {
                ...groupData,
                banner: undefined,
            },
        };

        // 2️⃣ Remove tabs where skill/description/exercises are invalid
        const finalData = Object.fromEntries(
            Object.entries(updatedTabs).filter(([key, tab]) => {
                return (
                    tab.skill?.trim() &&
                    tab.description?.trim() &&
                    Array.isArray(tab.exercises) &&
                    tab.exercises.length > 0
                );
            })
        );
        setSavedTabsData(finalData);

        // ✅ Now submit everything
        await handleSavePlan(finalData);
    };
    const handleRemoveImage = (indexToRemove) => {
        setExercise(prev => {
            const merged = [...prev.mergedImages];
            merged.splice(indexToRemove, 1);

            let serverImages = [];
            let localImages = [];

            // Split merged array again
            merged.forEach((img, idx) => {
                if (idx < prev.serverCount) serverImages.push(img);
                else localImages.push(img);
            });

            return {
                ...prev,
                mergedImages: merged,
                imageUrl: JSON.stringify(serverImages),
                serverCount: serverImages.length,
                image: localImages,
                imageToSend: prev.imageToSend?.slice(0, localImages.length) || []
            };
        });
    };


    // optional cleanup
    useEffect(() => {
        return () => {
            if (exercise.image) {
                exercise.image.forEach((url) => URL.revokeObjectURL(url));
            }
        };
    }, [exercise.image]);
    useEffect(() => {
        if (exercise.imageUrl || exercise.image) {
            const serverImages = exercise.imageUrl ? JSON.parse(exercise.imageUrl) : [];
            const localImages = exercise.image || [];

            setExercise(prev => ({
                ...prev,
                mergedImages: [...serverImages, ...localImages],   // Preview list
                serverCount: serverImages.length                   // To know which images came from server
            }));
        }
    }, [exercise.imageUrl, exercise.image]);

    console.log('exercise', exercise)
    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }

    return (
        <>
            <div ref={exerciseRef} className="flex flex-wrap gap-1 ps-3 md:ps-0 items-center cursor-pointer justify-between md:justify-start my-5" onClick={() => navigate('/birthday-party/session-plan')}>
                <img
                    src="/images/icons/arrow-left.png"
                    alt="Back"
                    className="w-5 h-5 md:w-6 md:h-6"
                />
                <h2 className="font-bold md:text-2xl">  Add a Session Plan Structure</h2>
            </div>

            <div className="p-12 flex flex-col lg:flex-row justify-center gap-10 bg-gray-50 min-h-screen rounded-2xl items-start bg-white">
                <div className="w-full md:p-6 lg:w-6/12">


                    <div className="space-y-4">
                        <div>
                            <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                Group Name
                            </label>
                            <input
                                type="text"
                                name="groupName"
                                value={groupData.groupName || ''}
                                onChange={handleGroupChange}
                                className="w-full border outline-none border-[#E2E1E5] rounded-xl px-3 p-3 py-2 mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                Player
                            </label>
                            <input
                                type="text"
                                name="player"
                                value={groupData.player || ''}
                                onChange={handleGroupChange}
                                className="w-full border outline-none border-[#E2E1E5] rounded-xl px-3 p-3 py-2 mt-1"
                            />
                        </div>
                        <label className="w-full block cursor-pointer border border-[#237FEA] text-[#237FEA] rounded-xl p-3 py-2 hover:bg-blue-50 transition text-center">
                            {groupData.banner ? "Change Banner" : "Add Banner"}

                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "banner")}
                            />

                        </label>
                        {groupData.banner && (
                            <img
                                src={groupData.banner.url}
                                alt="Banner"
                                className="w-full mt-2 rounded-xl"
                            />
                        )}
                        <div className="flex border border-[#E2E1E5] rounded-2xl p-2 mb-6 overflow-auto">
                            {tabs.map((tab, index) => {
                                // Determine if the tab should be disabled
                                const currentIndex = tabs.indexOf(activeTab);
                                const isDisabled = index > currentIndex && !groupData.skill;

                                return (
                                    <button
                                        key={tab}
                                        disabled={isDisabled}
                                        className={`flex-1 p-2 px-4 rounded-xl text-[17px] font-semibold transition-all 
                ${activeTab === tab ? "bg-[#237FEA] text-white" : "text-gray-600 hover:text-[#237FEA]"} 
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => {
                                            if (isDisabled) {
                                                showWarning("Please fill the skill for the current tab before proceeding.");

                                                return;
                                            }

                                            // Save current tab data (excluding banner)
                                            setSavedTabsData((prev) => ({
                                                ...prev,
                                                [activeTab]: {
                                                    groupName: groupData.groupName,
                                                    player: groupData.player,
                                                    skill: groupData.skill,
                                                    description: groupData.description,
                                                    exercises: groupData.exercises,
                                                    video: groupData.video,
                                                },
                                            }));

                                            // Move to new tab
                                            setActiveTab(tab);

                                            // Restore saved data for new tab or initialize defaults
                                            setGroupData((prev) => {
                                                const savedData = savedTabsData[tab] || {};
                                                return {
                                                    groupName: prev.groupName,
                                                    player: prev.player || savedData.player,
                                                    skill: savedData.skill || "",
                                                    description: savedData.description || "",
                                                    exercises: savedData.exercises || [],
                                                    video: savedData.video || null,
                                                    banner: prev.banner, // always keep the same banner
                                                };
                                            });
                                        }}
                                    >
                                        {tab}
                                    </button>
                                );
                            })}


                        </div>





                        <div>
                            <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                Skill of the day
                            </label>
                            <input
                                type="text"
                                name="skill"
                                value={groupData.skill || ''}
                                onChange={handleGroupChange}
                                className="w-full border outline-none border-[#E2E1E5] rounded-xl px-3 p-3 py-2 mt-1"
                            />
                        </div>
                        <label className="w-full block cursor-pointer border border-[#237FEA] text-[#237FEA] rounded-xl p-3 py-2 hover:bg-blue-50 transition text-center">
                            {groupData.video ? "Change Video" : "Add Video"}

                            <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "video")}
                            />

                        </label>
                        {groupData.video && (
                            <video
                                src={groupData.video.url}
                                controls
                                className="w-full mt-2 rounded-xl"
                            />
                        )}

                        <div>
                            <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                Description
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={groupData.description || ''}
                                onChange={handleGroupChange}
                                className="w-full border outline-none border-[#E2E1E5] rounded-xl px-3 p-3 py-2 mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                Exercises
                            </label>

                            {/* Selected exercises list */}
                            <div className="mt-2 border mb-5 border-gray-200 rounded-xl">
                                {Array.isArray(groupData.exercises) && groupData.exercises.length > 0 ? (
                                    groupData.exercises.map((ex, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center px-3 p-1 font-semibold"
                                        >
                                            <span>{ex?.label || "Untitled Exercise"}</span>

                                            <div className="flex gap-2">
                                                <img
                                                    onClick={() => {
                                                        setIsEditExcercise(true);
                                                        setRemovedImages([]);
                                                        setShowExerciseModal(true);
                                                        if (ex?.value) fetchExcercisesById(ex.value);
                                                    }}
                                                    src="/images/icons/edit2.png"
                                                    alt="Edit"
                                                    className="w-5 h-5 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => ex?.value && handleDuplicateExercise(ex.value)}
                                                    className="text-gray-800 transition-transform duration-200 transform hover:scale-110 hover:opacity-100 opacity-90 cursor-pointer"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => ex?.value && deleteExercise(ex.value)}
                                                    className="text-gray-800 hover:text-red-500"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                        No exercises added yet
                                    </div>
                                )}
                            </div>


                            {/* Exercise selection */}
                            <Select
                                isMulti
                                key={mounted}
                                options={exercises.map((item) => ({
                                    value: item.id,
                                    label: `${item.title} - ${item.duration}`,
                                }))}
                                value={groupData.exercises}
                                onChange={handleExerciseSelect}
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


                        <button
                            onClick={() => setShowExerciseModal(true)}
                            className="w-full bg-[#237FEA] text-white p-3 py-2 rounded-xl mt-2 hover:bg-blue-700"
                        >
                            Add New Exercise
                        </button>

                        <div className="flex justify-end">
                            <button
                                onClick={handleCreateSessionClick}
                                className="w-auto bg-[#237FEA] text-white p-3 py-2 px-10 rounded-xl mt-2 hover:bg-blue-700"
                            >
                                {tabs.indexOf(activeTab) === tabs.length - 1
                                    ? "Finish & Save All"
                                    : "Create Session"}
                            </button>
                        </div>

                    </div>
                </div>

                <div className="lg:w-6/12  flex flex-col gap-4">


                    {showExerciseModal && (
                        <div className="bg-white rounded-3xl shadow-md w-full p-6 relative">
                            <button
                                className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 text-xl"
                                onClick={() => {
                                    setShowExerciseModal(false);
                                    setIsEditExcercise(null);
                                    emptyExcerCises();
                                }}
                            >
                                ✕
                            </button>

                            <h2 className="text-xl font-semibold mb-4">Exercise</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={exercise.title}
                                        onChange={handleExerciseChange}
                                        className="w-full border outline-none border-[#E2E1E5] rounded-xl px-3 p-3 py-2 mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                        Duration
                                    </label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={exercise.duration}
                                        onChange={handleExerciseChange}
                                        className="w-full border outline-none border-[#E2E1E5] rounded-xl px-3 p-3 py-2 mt-1"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="text-[18px] font-semibold my-2 block text-[#282829]">
                                        Description
                                    </label>
                                    <Editor
                                        apiKey="sqe5er2lyngzjf0armhqaw1u7ffh0xgjyzmb7unv5irietwa"
                                        value={exercise.description}
                                        onEditorChange={(content) =>
                                            setExercise({ ...exercise, description: content })
                                        }
                                        init={{
                                            menubar: false,
                                            plugins: 'lists advlist code',
                                            toolbar:
                                                'fontsizeselect capitalize bold italic underline alignleft aligncenter bullist  ',
                                            height: 200,
                                            branding: false,
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
                                                editor.ui.registry.addIcon(
                                                    'capitalize-icon',
                                                    '<img src="/images/icons/smallcaps.png" style="width:16px;height:16px;" />'
                                                );

                                                editor.ui.registry.addButton('capitalize', {
                                                    icon: 'capitalize-icon',
                                                    tooltip: 'Capitalize Text',
                                                    onAction: () => {
                                                        editor.formatter.register('capitalize', {
                                                            inline: 'span',
                                                            styles: { textTransform: 'capitalize' },
                                                        });

                                                        editor.formatter.toggle('capitalize');
                                                    },
                                                });
                                            },
                                        }}
                                    />
                                </div>

                                <div>


                                    <label className="w-full block cursor-pointer border border-[#237FEA] text-[#237FEA] rounded-xl p-3 py-2 hover:bg-blue-50 transition text-center">
                                        {exercise.image ? "Update Image" : "Upload Image"}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            multiple
                                            onChange={handleImageUpload}
                                        />

                                    </label>

                                    <div className="flex flex-wrap gap-4 mt-3">
                                        {photoPreview.map((img) => (
                                            <div key={img.id} className="relative">
                                                <img
                                                    src={img.url}
                                                    alt="preview"
                                                    className="w-24 h-24 object-cover rounded-md border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(img.id)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}


                                    </div>


                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            isEditExcercise ? saveExercise(exercise.id) : saveExercise();
                                        }}
                                        className="bg-[#237FEA] text-white rounded-xl p-3 py-2 px-10 mt-3 hover:bg-blue-700"
                                    >
                                        {isEditExcercise ? "Update Exercise" : "Save Exercise"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-5">
                        <button disabled className="border-[#237FEA] text-[#237FEA] border rounded-xl px-6 py-2 flex bg-gray-100  cursor-not-allowed gap-2 items-center">Preview Sessions <FaEye /> </button>
                        <button className="bg-[#237FEA] text-white rounded-xl p-3 py-2 px-7 hover:bg-blue-700" onClick={handleCreateGroupClick}>Create Group</button>
                    </div>


                </div>
            </div>
        </>
    );
}
