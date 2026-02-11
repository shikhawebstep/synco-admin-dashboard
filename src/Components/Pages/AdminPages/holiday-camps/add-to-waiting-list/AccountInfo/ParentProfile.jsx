// src/components/profile.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { motion } from "framer-motion";
import { X } from "lucide-react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import Loader from '../../../contexts/Loader';
import { usePermission } from '../../../Common/permission';
import { addDays } from "date-fns";
import { FaEdit, FaSave } from "react-icons/fa";
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import { showConfirm, showError, showSuccess, showWarning } from '../../../../../../utils/swalHelper';
const ParentProfile = ({ profile }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const {
        loading,
        addtoWaitingListSubmit, cancelMembershipSubmit,
        sendWaitingListMail, transferMembershipSubmit,
        freezerMembershipSubmit, reactivateDataSubmit, cancelWaitingListSpot, updateWaitingListFamily
    } = useBookFreeTrial() || {};
    const navigate = useNavigate();
    console.log('profiless', profile)
    const [commentsList, setCommentsList] = useState([]);
    const [loadingComment, setLoadingComment] = useState(false);
    const [comment, setComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 5; // Number of comments per page

    // Pagination calculations
    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
    const totalPages = Math.ceil(commentsList.length / commentsPerPage);
    const { adminInfo, setAdminInfo } = useNotification();
    const token = localStorage.getItem("adminToken");
    const [loadingData, setLoadingData] = useState(false);
    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };
    const classSchedule = profile?.classSchedule;
    const bookingId = profile?.id;
    const id = profile?.id;
    const paymentPlans = profile?.paymentPlans;
    const parentsList = profile?.parents || [];
    const emergencyList = profile?.emergency || [];
    const [editingEmergency, setEditingEmergency] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const students = profile?.students || [];
    const [parents, setParents] = useState(profile.parents || []);
    const [emergencyContacts, setEmergencyContacts] = useState(profile?.emergency || []);

    const bookedBy = profile?.bookedByAdmin;
    const [addToWaitingList, setaddToWaitingList] = useState(false);
    const [showCancelTrial, setshowCancelTrial] = useState(false);
    const [removeWaiting, setRemoveWaiting] = useState(false);

    const [transferVenue, setTransferVenue] = useState(false);
    const [reactivateMembership, setReactivateMembership] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [freezeMembership, setFreezeMembership] = useState(false);
    const reasonOptions = [
        { value: "Family emergency - cannot attend", label: "Family emergency - cannot attend" },
        { value: "Health issue", label: "Health issue" },
        { value: "Schedule conflict", label: "Schedule conflict" },
    ];
    const cancelType = [
        { value: "immediate", label: "Cancel Immediately" },
        { value: "scheduled", label: "Request Cancel" },
    ];
    const firstPayment = Array.isArray(profile?.payments)
        ? profile.payments[0]
        : profile?.payments;
    const ID = profile?.bookedId || profile?.bookingId;


    // console.log('profile', profile)
    const [rebookFreeTrial, setRebookFreeTrial] = useState({
        bookingId: id || null,
        trialDate: "",
        reasonForNonAttendance: "",
        additionalNote: "",
    });
    const [formData, setFormData] = useState({
        bookingId: bookingId,
        cancelReason: "",
        additionalNote: "",
    });

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000); // in seconds

        if (diff < 60) return `${diff} sec${diff !== 1 ? 's' : ''} ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;

        // fallback: return exact date if older than 7 days
        return past.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    const fetchComments = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/waiting-list/comment/list`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setCommentsList(result);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            showError("Failed to fetch comments", error.message || error.error || "Failed to fetch comments. Please try again later.");

        }
    }, []);

    useEffect(() => {
        fetchComments();
    }, [])
    const handleSubmitComment = async (e) => {

        e.preventDefault();

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${token}`);

        const raw = JSON.stringify({
            "comment": comment
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        try {
            setLoadingComment(true);


            const response = await fetch(`${API_BASE_URL}/api/admin/waiting-list/comment/create`, requestOptions);

            const result = await response.json();

            if (!response.ok) {
                showError("Failed to Add Comment", result.message || "Something went wrong.");
                return;
            }

            // showSuccess("Comment Created", result.message || " Comment has been  added successfully!");


            setComment('');
            fetchComments();
        } catch (error) {
            console.error("Error creating member:", error);
            showError("Network Error", error.message || "An error occurred while submitting the form.");

        } finally {
            setLoadingComment(false);
        }
    }

    // console.log('loading', loading)

    const { checkPermission } = usePermission();
    const failedPayments = profile.payments?.filter(
        (payment) => payment.paymentStatus !== "success"
    ) || [];

    const canCancelTrial =
        checkPermission({ module: 'cancel-free-trial', action: 'create' })
    const canRebooking =
        checkPermission({ module: 'rebooking', action: 'create' })

    const [waitingListData, setWaitingListData] = useState({
        bookingId: bookingId,
        classScheduleId: null,
        venueId: classSchedule?.venue?.id || null,
        startDate: null,
        notes: "",
    });
    const [cancelData, setCancelData] = useState({
        bookingId: bookingId,
        cancellationType: "immediate",      // corresponds to selected radio
        cancelReason: "",          // corresponds to Select value
        cancelDate: null,          // corresponds to DatePicker
        additionalNote: "",        // textarea
    });
    const [cancelWaitingList, setCancelWaitingList] = useState({
        bookingId: bookingId,
        removedReason: "",           // corresponds to DatePicker
        removedNotes: "",        // textarea
    });
    const [transferData, setTransferData] = useState({
        bookingId: bookingId || null,
        venueId: classSchedule?.venue?.id || null,
        transferReasonClass: "", // optional notes
        classScheduleId: null,        // selected new class
    });
    const [freezeData, setFreezeData] = useState({
        bookingId: bookingId || null,
        freezeStartDate: null,
        freezeDurationMonths: null,
        reactivateOn: null, // optional if you want to capture explicitly
        reasonForFreezing: "",
    });
    const [reactivateData, setReactivateData] = useState({
        bookingId: bookingId || null,
        reactivateOn: null,
        additionalNote: "",
    });
    const handleInputChange = (e, stateSetter) => {
        const { name, value } = e.target;
        stateSetter((prev) => ({ ...prev, [name]: value }));
    };
    const handleSelectChange = (selected, field, stateSetter) => {
        stateSetter((prev) => ({ ...prev, [field]: selected?.value || null }));
    };

    // Unified handler for DatePicker
    const handleDateChange = (date, field, stateSetter) => {
        if (!date) {
            stateSetter((prev) => ({ ...prev, [field]: null }));
            return;
        }
        const formatted = date.toLocaleDateString("en-CA"); // gives YYYY-MM-DD without timezone shift
        stateSetter((prev) => ({ ...prev, [field]: formatted }));
    };


    // Unified handler for radio buttons
    const handleRadioChange = (value, field, stateSetter) => {
        stateSetter((prev) => ({ ...prev, [field]: value }));
    };



    const paymentPlan = profile?.paymentPlans?.[0] ?? null;

    // Access the first booking's venue name
    const venueName = profile?.venue?.name;
    const MembershipPlan = paymentPlan?.title;
    const MembershipPrice = paymentPlan?.price;
    const duration = paymentPlan?.duration ?? 0;
    let interval = paymentPlan?.interval ?? "";
    if (duration > 1 && interval) {
        interval += "s";
    }
    const MembershipTenure = duration && interval
        ? `${duration} ${interval}`
        : "";

    const dateBooked = profile?.dateBooked;
    const startDate = profile?.startDate;

    const status = profile?.status;

    // console.log('Venue Name:', profile.dateBooked);

    function formatISODate(isoDateString, toTimezone = null) {
        if (!isoDateString) return "N/A"; // ✅ Handles null, undefined, or empty string

        const date = new Date(isoDateString);
        if (isNaN(date.getTime())) return "N/A"; // ✅ Handles invalid date formats

        let year, month, day, hours, minutes;

        if (toTimezone) {
            // Convert to target timezone using Intl.DateTimeFormat
            const options = {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: toTimezone,
            };
            const formatter = new Intl.DateTimeFormat("en-US", options);
            const parts = formatter.formatToParts(date);

            // Extract formatted parts
            month = parts.find(p => p.type === "month").value;
            day = parts.find(p => p.type === "day").value;
            year = parts.find(p => p.type === "year").value;
            hours = parts.find(p => p.type === "hour").value;
            minutes = parts.find(p => p.type === "minute").value;
        } else {
            // Use local time
            year = date.getFullYear();
            month = date.toLocaleString("en-US", { month: "short" });
            day = date.getDate().toString().padStart(2, "0");
            hours = date.getHours().toString().padStart(2, "0");
            minutes = date.getMinutes().toString().padStart(2, "0");
        }

        return `${month} ${day} ${year}, ${hours}:${minutes}`;
    }

    const hearOptions = [
    { value: "Google", label: "Google" },
    { value: "Facebook", label: "Facebook" },
    { value: "Instagram", label: "Instagram" },
    { value: "Friend", label: "Friend" },
    { value: "Flyer", label: "Flyer" },
  ];

    const getStatusBgColor = (status) => {
        switch (status) {
            case "active": return "bg-[#43BE4F]";
            case "frozen": return "bg-[#509EF9]";
            case "cancelled": return "bg-[#FC5D5D]";
            case "waiting list": return "bg-[#A4A5A6]";
            default: return "bg-[#A4A5A6]";
        }
    };
    const handleDataChange = (index, field, value) => {
        const updatedParents = [...parents];
        updatedParents[index][field] = value;
        setParents(updatedParents);
    };
    const handleEmergencyChange = (index, field, value) => {
        const updated = [...emergencyContacts];
        updated[index][field] = value;
        setEmergencyContacts(updated);
    };

    // ✅ Parent edit/save toggle
    const toggleEditParent = (index) => {
        if (editingIndex === index) {
            // 🔹 Save Mode
            setEditingIndex(null);

            const payload = students.map((student, sIndex) => ({
                id: student.id ?? sIndex + 1,
                studentFirstName: student.studentFirstName,
                studentLastName: student.studentLastName,
                dateOfBirth: student.dateOfBirth,
                age: student.age,
                gender: student.gender,
                medicalInformation: student.medicalInformation,
                parents: parents.map((p, pIndex) => ({
                    id: p.id ?? pIndex + 1,
                    ...p,
                })),
                emergencyContacts: emergencyContacts.map((e, eIndex) => ({
                    id: e.id ?? eIndex + 1,
                    ...e,
                })),
            }));

            updateWaitingListFamily(profile.id, payload);
            // console.log("Parent Payload to send:", payload);
        } else {
            // 🔹 Edit Mode
            setEditingIndex(index);
        }
    };

    // ✅ Emergency edit/save toggle
    const toggleEditEmergency = (index) => {
        if (editingEmergency === index) {
            // 🔹 Save Mode
            setEditingEmergency(null);

            const payload = students.map((student, sIndex) => ({
                id: student.id ?? sIndex + 1,
                studentFirstName: student.studentFirstName,
                studentLastName: student.studentLastName,
                dateOfBirth: student.dateOfBirth,
                age: student.age,
                gender: student.gender,
                medicalInformation: student.medicalInformation,
                parents: parents.map((p, pIndex) => ({
                    id: p.id ?? pIndex + 1,
                    ...p,
                })),
                emergencyContacts: emergencyContacts.map((e, eIndex) => ({
                    id: e.id ?? eIndex + 1,
                    ...e,
                })),
            }));

            updateWaitingListFamily(profile.id, payload);
            // console.log("Emergency Payload to send:", payload);
        } else {
            // 🔹 Edit Mode
            setEditingEmergency(index);
        }
    };
    console.log('profile', profile.paymentPlans)
    const handleBookMembership = () => {
        showConfirm("Are you sure?", "Do you want to book a membership?", "Yes, Book it!").then((result) => {

            if (result.isConfirmed) {
                // Navigate to your component/route
                navigate("/holiday-camp/find-a-camp/book-a-membership", {
                    state: { TrialData: profile, comesFrom: "waitingList" },
                });
            }
        });
    };
    const monthOptions = [
        { value: 1, label: "1 Month" },
        { value: 2, label: "2 Months" },
        { value: 3, label: "3 Months" },
        { value: 4, label: "4 Months" },
        { value: 5, label: "5 Months" },
        { value: 6, label: "6 Months" },
        { value: 12, label: "12 Months" },
    ];

    // console.log('waitingListData', waitingListData)
    // console.log('transferData', transferData)
    // console.log('freezeData', freezeData)
    // console.log('cancelData', cancelData)
    // console.log('cancelWaitingList', cancelWaitingList)

    const newClasses = profile?.newClasses?.map((cls) => ({
        value: cls.id,
        label: `${cls.className} - ${cls.day} (${cls.startTime} - ${cls.endTime})`,
    }));

    const selectedClass = newClasses?.find(
        (cls) => cls.value === waitingListData?.classScheduleId
    );
    if (loading) return <Loader />;


    return (
        <>
            <div className="md:flex w-full gap-4">
                <div className="transition-all duration-300 flex-1 md:w-8/12 ">
                    <div className="space-y-6">
                        {parents.map((parent, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 mb-10 rounded-3xl shadow-sm space-y-6 relative"
                            >
                                {/* Header + Pencil/Save */}
                                <div className="flex justify-between items-start">
                                    <h2 className="text-[20px] font-semibold">Parent information</h2>
                                    <button
                                        onClick={() => toggleEditParent(index)}
                                        className="text-gray-600 hover:text-blue-600"
                                    >
                                        {editingIndex === index ? <FaSave /> : <FaEdit />}
                                    </button>
                                </div>

                                {/* First/Last Name */}
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">First name</label>
                                        <input
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={parent.parentFirstName}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleDataChange(index, "parentFirstName", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Last name</label>
                                        <input
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={parent.parentLastName}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleDataChange(index, "parentLastName", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Email + Phone */}
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Email</label>
                                        <input
                                            type="email"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={parent.parentEmail}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleDataChange(index, "parentEmail", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Phone number</label>
                                        <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2">

                                            <PhoneInput
                                                country="uk"
                                                value="+44"
                                                disableDropdown={true}       // disables changing the country
                                                disableCountryCode={true}
                                                countryCodeEditable={false}
                                                inputStyle={{
                                                    width: "0px",
                                                    maxWidth: '20px',
                                                    height: "0px",
                                                    opacity: 0,
                                                    pointerEvents: "none",
                                                    position: "absolute",
                                                }}
                                                buttonClass="!bg-white !border-none !p-0"
                                            />
                                            <input
                                                type='number'
                                                className="border-none w-full focus:outline-none"
                                                value={parent.parentPhoneNumber}
                                                readOnly={editingIndex !== index}
                                                onChange={(e) =>
                                                    handleDataChange(index, "parentPhoneNumber", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Relation + How Did You Hear */}
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Relation to child</label>
                                        <input
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={parent.relationToChild}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleDataChange(index, "relationToChild", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">
                                            How did you hear about us?
                                        </label>
                                        <select
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={parent.howDidYouHear}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleDataChange(index, "howDidYouHear", e.target.value)
                                            }
                                        >
                                            {hearOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                            </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {emergencyContacts.map((emergency, index) => (
                        <div key={index} className="bg-white p-6 rounded-3xl shadow-sm space-y-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-[20px] font-semibold">Emergency contact details</h2>
                                <button
                                    onClick={() => toggleEditEmergency(index)}
                                    className="text-gray-600 hover:text-blue-600"
                                >
                                    {editingEmergency === index ? <FaSave /> : <FaEdit />}
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={emergency.sameAsAbove} readOnly disabled />
                                <label className="text-base font-semibold text-gray-700">
                                    Fill same as above
                                </label>
                            </div>

                            {/* First / Last Name */}
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">First name</label>
                                    <input
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={emergency.emergencyFirstName}
                                        readOnly={editingEmergency !== index}
                                        onChange={(e) =>
                                            handleEmergencyChange(index, "emergencyFirstName", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Last name</label>
                                    <input
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={emergency.emergencyLastName}
                                        readOnly={editingEmergency !== index}
                                        onChange={(e) =>
                                            handleEmergencyChange(index, "emergencyLastName", e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Phone / Relation */}
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Phone number</label>
                                    <input
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={emergency.emergencyPhoneNumber}
                                        readOnly={editingEmergency !== index}
                                        onChange={(e) =>
                                            handleEmergencyChange(index, "emergencyPhoneNumber", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Relation to child</label>
                                    <input
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={emergency.emergencyRelation}
                                        readOnly={editingEmergency !== index}
                                        onChange={(e) =>
                                            handleEmergencyChange(index, "emergencyRelation", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="bg-white my-10 rounded-3xl p-6 space-y-4">
                        <h2 className="text-[24px] font-semibold">Comment</h2>

                        {/* Input section */}
                        <div className="flex items-center gap-2">
                            <img
                                src={adminInfo?.profile ? `${adminInfo.profile}` : '/members/dummyuser.png'}
                                alt="User"
                                className="w-14 h-14 rounded-full object-cover"
                            />
                            <input
                                type="text"
                                name='comment'
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment"
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-[16px] font-semibold outline-none md:w-full w-5/12"
                            />
                            <button
                                disabled={loadingComment}
                                className="bg-[#237FEA] p-3 rounded-xl text-white hover:bg-blue-600"
                                onClick={handleSubmitComment}
                            >
                                <img src="/images/icons/sent.png" alt="" />
                            </button>
                        </div>

                        {/* Comment list */}
                        {commentsList && commentsList.length > 0 ? (
                            <div className="space-y-4">
                                {currentComments.map((c, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-4 text-sm">
                                        <p className="text-gray-700 text-[16px] font-semibold mb-1">{c.comment}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={
                                                        c?.bookedByAdmin?.profile
                                                            ? `${c?.bookedByAdmin?.profile}`
                                                            : '/members/dummyuser.png'
                                                    }
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null; // prevent infinite loop
                                                        e.currentTarget.src = '/members/dummyuser.png';
                                                    }}
                                                    alt={c?.bookedByAdmin?.firstName}
                                                    className="w-10 h-10 rounded-full object-cover mt-1"
                                                />
                                                <div>
                                                    <p className="font-semibold text-[#237FEA] text-[16px]">{c?.bookedByAdmin?.firstName} {c?.bookedByAdmin?.lastName}</p>
                                                </div>
                                            </div>
                                            <span className="text-gray-400 text-[16px] whitespace-nowrap mt-1">
                                                {formatTimeAgo(c.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination controls */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-4">
                                        <button
                                            className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100"
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Prev
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                className={`px-3 py-1 rounded-lg border ${currentPage === i + 1 ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-100'}`}
                                                onClick={() => goToPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100"
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center">No Comments yet.</p>
                        )}
                    </div>
                </div>
                <div className="max-h-fit rounded-full md:w-4/12 text-base space-y-5">
                    {/* Card Wrapper */}
                    <div className="rounded-3xl bg-[#363E49] overflow-hidden shadow-md border border-gray-200">
                        {/* Header */}
                        <div className={`m-2 px-6 rounded-3xl py-3 flex items-center justify-between bg-no-repeat bg-center `}
                            style={{
                                backgroundImage: status === "cancelled"
                                    ? "url('/frames/Cancelled.png')"
                                    : status === "frozen"
                                        ? "url('/frames/Frozen.png')"
                                        : status === "active"
                                            ? "url('/frames/Active.png')"
                                            : status === "waiting list"
                                                ? "url('/frames/Waiting.png')"
                                                : "url('/frames/Pending.png')",


                                backgroundSize: "cover",
                            }}>
                            <div>
                                <div className="text-[20px] font-bold text-[#1F2937]">Account Status</div>
                                <div className="text-[16px] font-semibold capitalize text-[#1F2937]">      <span>
                                    {status ? status.replaceAll("_", " ") : "Unknown"}
                                </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#363E49] text-white px-6 py-6 space-y-6">
                            {/* Avatar & Account Holder */}
                            <div className="flex items-center gap-4">
                                <img
                                    src={
                                        bookedBy?.profile
                                            ? `${API_BASE_URL}/${bookedBy.profile}`
                                            : "https://cdn-icons-png.flaticon.com/512/147/147144.png"
                                    }
                                    alt="avatar"
                                    className="w-18 h-18 rounded-full"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/147/147144.png"; // fallback if image fails to load
                                    }}
                                />

                                <div>
                                    <div className="text-[24px] font-semibold leading-tight">
                                        Booked By
                                    </div>
                                    <div className="text-[16px] text-gray-300">
                                        {bookedBy?.firstName} {bookedBy?.lastName}

                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y">
                                <div>
                                    <div className="text-[20px] font-bold tracking-wide">Venue</div>
                                    <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md my-2">
                                        {venueName || "-"}
                                    </div>
                                </div>

                                <div className="border-t border-[#495362] pt-5">

                                    <div className="text-[20px] text-white">Membership Plan</div>

                                    <div className="text-[1s6px] mt-1 text-gray-400">
                                        {MembershipPlan ? `${MembershipPlan} Plan` : "N/A"}
                                    </div>

                                </div>
                                <div className="border-t border-[#495362] pt-5">

                                    <div className="text-[20px] text-white">Membership Start Date</div>

                                    <div className="text-[1s6px] mt-1 text-gray-400">
                                        {formatISODate(startDate)}
                                    </div>

                                </div>

                                <div className="border-t border-[#495362] pt-5">

                                    <div className="text-[20px] text-white">Membership Tenure</div>
                                    <div className="text-[1s6px] mt-1 text-gray-400">
                                        {MembershipTenure || 'N/A'}
                                    </div>

                                </div>
                                <div className="border-t border-[#495362] pt-5">

                                    <div className="text-[20px] text-white">ID</div>
                                    <div className="text-[1s6px] mt-1 text-gray-400">
                                        {ID}
                                    </div>

                                </div>
                                <div className="border-t border-[#495362] py-5">
                                    <div className="text-[20px] text-white mb-3">Progress</div>
                                    <div className="flex items-center justify-between">
                                        <div className="w-[90%] bg-[#fff] h-3 rounded-full overflow-hidden">
                                            <div
                                                className="bg-green-500 h-4 rounded-full"
                                                style={{ width: "78%" }}
                                            ></div>
                                        </div>
                                        <div className="text-white text-right mt-1 text-[14px]">78%</div>
                                    </div>
                                </div>

                                <div className="border-t border-[#495362] py-5">
                                    <div className=" text-[20px] text-white">Price</div>
                                    <div className="text-[16px] mt-1 text-gray-400">
                                        {MembershipPrice !== null && MembershipPrice !== undefined ? `£${MembershipPrice}` : "N/A"}
                                    </div>
                                </div>

                            </div>
                        </div>



                    </div>
                    {status !== 'cancelled' && (
                        <>
                            <div className="bg-white rounded-3xl p-6  space-y-4 mt-4">

                                {/* Top Row: Email + Text */}
                                <div className="flex gap-7">

                                    <button onClick={() => sendWaitingListMail([bookingId])} className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center hover:shadow-md transition-shadow duration-300 gap-2 text-[#717073] font-medium">
                                        <img src="/images/icons/mail.png" alt="" /> Send Email
                                    </button>

                                    <button className="flex-1 border border-[#717073] rounded-xl py-3 flex  text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium">
                                        <img src="/images/icons/sendText.png" alt="" /> Send Text
                                    </button>
                                </div>
                                {(status === "frozen" || status === "cancelled") && canRebooking && (
                                    <button
                                        onClick={() => setReactivateMembership(true)}
                                        className="w-full bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:bg-blue-700 hover:shadow-md transition-shadow duration-300"
                                    >
                                        Reactivate Membership
                                    </button>
                                )}

                                {(status === "active" || status === "frozen" || status === "cancelled") && (
                                    <button
                                        onClick={() => setaddToWaitingList(true)}
                                        className={`w-full rounded-xl py-3 text-[18px] font-medium transition-shadow duration-300 
            ${addToWaitingList
                                                ? "bg-[#237FEA] text-white shadow-md"   // Active state
                                                : "bg-white  border border-gray-300  hover:bg-blue-700 text-[#717073] hover:text-white hover:shadow-md"
                                            }`}
                                    >
                                        Add to the waiting list
                                    </button>
                                )}


                                {status == 'active' && canCancelTrial && (
                                    <button
                                        onClick={() => setFreezeMembership(true)}
                                        className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                    >
                                        Freeze Membership
                                    </button>
                                )}
                                {status == 'active' && canCancelTrial && (
                                    <button
                                        onClick={() => setTransferVenue(true)}
                                        className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                    >
                                        Transfer Class
                                    </button>
                                )}
                                {/* {status !== 'pending' && status !== 'attended' && (
                                    <button className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md hover:bg-[#237FEA] hover:text-white transition-shadow duration-300 font-medium">
                                        Book a Membership
                                    </button>
                                )} */}
                                {status == 'waiting list' && canCancelTrial && (
                                    <div className='grid grid-cols-1 items-center gap-2'>

                                        <button
                                            onClick={() => setRemoveWaiting(true)}
                                            className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                        >
                                            Remove Waiting List
                                        </button>
                                        {!profile?.paymentPlans?.length && profile?.classSchedule?.capacity !== 0 && (
                                            <button
                                                onClick={handleBookMembership}
                                                className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                            >
                                                Book a Membership
                                            </button>
                                        )}

                                    </div>
                                )}
                                {(status == 'active' || status == 'frozen') && canCancelTrial && (
                                    <button
                                        onClick={() => setshowCancelTrial(true)}
                                        className={`w-full border text-[18px] rounded-xl py-3 font-medium transition-shadow duration-300
    ${showCancelTrial
                                                ? "bg-[#FF6C6C] text-white shadow-md border-transparent"
                                                : "border-gray-300 text-[#717073] hover:bg-[#FF6C6C] hover:text-white hover:shadow-md"
                                            }`}
                                    >
                                        Cancel Membership
                                    </button>

                                )}



                                {status === 'attended' && (
                                    <div className="flex gap-7">
                                        <button className="flex-1 border bg-[#FF6C6C] border-[#FF6C6C] rounded-xl py-3 flex text-[18px] items-center justify-center hover:shadow-md transition-shadow duration-300 gap-2 text-white font-medium">
                                            No Membership
                                        </button>

                                        <button className="flex-1 border bg-[#237FEA] border-[#237FEA] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-white font-medium">
                                            Book a Membership
                                        </button>
                                    </div>
                                )}


                            </div>
                        </>
                    )}
                </div>
                {addToWaitingList && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setaddToWaitingList(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Add to Waiting List Form</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Current Class */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Current Class</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={classSchedule?.className || "-"}
                                        readOnly
                                    />
                                </div>

                                {/* Venue */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Venue</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={classSchedule?.venue?.name || "-"}
                                        readOnly
                                    />
                                </div>

                                {/* New Class */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Select New Class</label>
                                    <Select
                                        value={
                                            waitingListData.classScheduleId
                                                ? {
                                                    value: waitingListData.classScheduleId,
                                                    label: selectedClass ? selectedClass.label : `Class ${waitingListData.classScheduleId}`
                                                }
                                                : null
                                        } onChange={(selected) => handleSelectChange(selected, "classScheduleId", setWaitingListData)}
                                        options={newClasses}
                                        placeholder="Select Class"
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
                                                boxShadow: "none",
                                                padding: "4px 8px",
                                                minHeight: "48px",
                                            }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />

                                </div>

                                {/* Preferred Date */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Preferred Start Date (Optional)</label>
                                    <DatePicker
                                        withPortal
                                        minDate={addDays(new Date(), 1)} // disables today and all past dates
                                        selected={waitingListData.startDate ? new Date(waitingListData.startDate) : null}
                                        onChange={(date) => handleDateChange(date, "startDate", setWaitingListData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    />

                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Notes (Optional)</label>
                                    <textarea
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        name="notes"

                                        value={waitingListData.notes}
                                        onChange={(e) => handleInputChange(e, setWaitingListData)}
                                    />

                                </div>

                                {/* Button */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => addtoWaitingListSubmit(waitingListData, 'allMembers')}
                                    >
                                        Join Waiting List
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )}
                {reactivateMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setReactivateMembership(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Reactivate Membership</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Reactivate On */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Reactivate On</label>
                                    <DatePicker
                                        withPortal
                                        minDate={addDays(new Date(), 1)} // disable today & past dates
                                        selected={
                                            reactivateData?.reactivateOn
                                                ? new Date(reactivateData.reactivateOn)
                                                : null
                                        }
                                        onChange={(date) => handleDateChange(date, "reactivateOn", setReactivateData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    />
                                </div>

                                {/* Confirm Class */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Confirm Class</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={classSchedule?.className || "-"}
                                        readOnly
                                    />
                                </div>

                                <div className="w-full max-w-xl mx-auto">
                                    <button
                                        type="button"
                                        disabled={!paymentPlan}
                                        onClick={() => setIsOpen(!isOpen)}
                                        className={`bg-[#237FEA] text-white text-[18px]  font-semibold border w-full border-[#237FEA] px-6 py-3 rounded-lg flex items-center justify-center  ${paymentPlan
                                            ? "bg-[#237FEA] border border-[#237FEA]"
                                            : "bg-gray-400 border-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        Review Membership Plan

                                        <img
                                            src={isOpen ? "/images/icons/whiteArrowDown.png" : "/images/icons/whiteArrowUp.png"}
                                            alt={isOpen ? "Collapse" : "Expand"}
                                            className="ml-2 inline-block"
                                        />

                                    </button>

                                    {isOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-white mt-4 rounded-2xl shadow-lg p-6   font-semibold  space-y-4 text-[16px]"
                                        >
                                            <div className="flex justify-between text-[#333]">
                                                <span>Membership Plan</span>
                                                <span>
                                                    {paymentPlan?.duration} {paymentPlan?.interval}
                                                    {paymentPlan?.duration > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[#333]">
                                                <span>Monthly Subscription Fee</span>
                                                <span>£{paymentPlan?.price} p/m</span>
                                            </div>
                                            <div className="flex justify-between text-[#333]">
                                                <span>Price per class per child</span>
                                                <span>£{paymentPlan?.price}</span>
                                            </div>

                                        </motion.div>
                                    )}
                                </div>
                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Additional Notes (Optional)</label>
                                    <textarea
                                        name="additionalNote"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        value={reactivateData.additionalNote}
                                        onChange={(e) => handleInputChange(e, setReactivateData)}
                                    />
                                </div>

                                {/* Button */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => reactivateDataSubmit(reactivateData, 'allMembers')}

                                    >
                                        Reactivate Membership
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {showCancelTrial && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setshowCancelTrial(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Cancel Membership </h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Cancellation Type
                                    </label>

                                    {cancelType.map((option) => (
                                        <label key={option.value} className="flex mt-4  items-center mb-2 cursor-pointer">
                                            <label className="flex items-center cursor-pointer space-x-2">
                                                <input
                                                    type="radio"
                                                    name="cancelType"
                                                    value={option.value}
                                                    checked={cancelData.cancellationType === option.value}
                                                    onChange={() => handleRadioChange(option.value, "cancellationType", setCancelData)}
                                                    className="hidden peer"
                                                />
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 peer-checked:bg-blue-500 peer-checked:border-blue-500">
                                                    {/* Tick icon */}
                                                    <svg
                                                        className=" w-3 h-3 text-white peer-checked:block"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                                <span className="text-gray-800 text-[16px]">{option.label}</span>
                                            </label>

                                        </label>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">Cancellation Effective Date</label>
                                    <DatePicker
                                        withPortal
                                        minDate={addDays(new Date(), 1)} // disables today and all past dates
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        selected={cancelData.cancelDate ? new Date(cancelData.cancelDate) : null}
                                        onChange={(date) => handleDateChange(date, "cancelDate", setCancelData)}
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"

                                    />
                                </div>
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Cancellation
                                    </label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === cancelData.cancelReason)}
                                        onChange={(selected) => handleSelectChange(selected, "cancelReason", setCancelData)}
                                        options={reasonOptions}
                                        placeholder=""
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
                                                boxShadow: "none",
                                                padding: "6px 8px",
                                                minHeight: "48px",
                                            }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-100  mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={3}
                                        name="additionalNote"    // <-- MUST match state key
                                        value={cancelData.additionalNote}
                                        onChange={(e) => handleInputChange(e, setCancelData)}
                                        placeholder=""
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            // Validation
                                            if (!cancelData.cancellationType) {
                                                showWarning("Missing Field", "Please select a cancellation type.");
                                                return;
                                            }

                                            if (cancelData.cancellationType !== "immediate" && !cancelData.cancelDate) {
                                                showWarning("Missing Field", "Please select a cancellation effective date.");
                                                return;
                                            }

                                            if (!cancelData.cancelReason) {
                                                showWarning("Missing Field", "Please select a reason for cancellation.");
                                                return;
                                            }

                                            if (cancelData.cancellationType !== "immediate" && !cancelData.cancelDate) {
                                                showWarning("Missing Field", "Please select a cancellation effective date.");
                                                return;
                                            }

                                            if (!cancelData.cancelReason) {
                                                showWarning("Missing Field", "Please select a reason for cancellation.");
                                                return;
                                            }


                                            // If all validations pass → call submit function
                                            cancelMembershipSubmit(cancelData, "allMembers");
                                        }}
                                        className="w-1/2 bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                    >
                                        Cancel Membership
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )}
                {removeWaiting && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setRemoveWaiting(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Cancel Waiting List Spot </h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Cancellation
                                    </label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === cancelWaitingList.cancelReason)}
                                        onChange={(selected) => handleSelectChange(selected, "removedReason", setCancelWaitingList)}
                                        options={reasonOptions}
                                        placeholder=""
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
                                                boxShadow: "none",
                                                padding: "6px 8px",
                                                minHeight: "48px",
                                            }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-100  mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        name="removedNotes"    // <-- MUST match state key
                                        value={cancelWaitingList.removedNotes}
                                        onChange={(e) => handleInputChange(e, setCancelWaitingList)}
                                        placeholder=""
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={() => cancelWaitingListSpot(cancelWaitingList, 'waitingList')}

                                        className="w-1/2  bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                    >
                                        Cancel Spot on Waiting List
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )}
                {transferVenue && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setTransferVenue(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Transfer Class Form</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Current Class */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Current Class</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={classSchedule?.className || "-"}
                                        readOnly
                                    />
                                </div>

                                {/* Venue */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Venue</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        value={classSchedule?.venue?.name || "-"}
                                        readOnly
                                    />
                                </div>

                                {/* Select New Class */}
                                <div>


                                    <label className="block text-[16px] font-semibold">
                                        Select New Class
                                    </label>

                                    <Select
                                        value={
                                            transferData.classScheduleId
                                                ? newClasses.find((cls) => cls.value === transferData.classScheduleId) || null
                                                : null
                                        }
                                        onChange={(selected) =>
                                            handleSelectChange(selected, "classScheduleId", setTransferData)
                                        }
                                        options={newClasses}
                                        placeholder="Select Class"
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
                                                boxShadow: "none",
                                                padding: "4px 8px",
                                                minHeight: "48px",
                                            }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />

                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Transfer (Optional)
                                    </label>
                                    <textarea
                                        name="transferReasonClass"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        value={transferData.transferReasonClass}
                                        onChange={(e) => handleInputChange(e, setTransferData)}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4 pt-4">


                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => transferMembershipSubmit(transferData, 'allMembers')}
                                    >
                                        Submit Transfer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {freezeMembership && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setFreezeMembership(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Freeze Membership Form</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Freeze Start Date */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Freeze Start Date</label>
                                    <DatePicker
                                        withPortal
                                        minDate={addDays(new Date(), 1)} // disables today and all past dates
                                        selected={freezeData.freezeStartDate ? new Date(freezeData.freezeStartDate) : null}
                                        onChange={(date) => handleDateChange(date, "freezeStartDate", setFreezeData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[16px] font-semibold">Freeze Duration (Months)</label>
                                    <Select
                                        value={monthOptions.find((opt) => opt.value === freezeData.freezeDurationMonths) || null}
                                        onChange={(selected) => handleSelectChange(selected, "freezeDurationMonths", setFreezeData)}
                                        options={monthOptions}
                                        placeholder="Select Duration"
                                        className="rounded-lg mt-2"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "0.7rem",
                                                boxShadow: "none",
                                                padding: "4px 8px",
                                                minHeight: "48px",
                                            }),
                                            placeholder: (base) => ({ ...base, fontWeight: 600 }),
                                            dropdownIndicator: (base) => ({ ...base, color: "#9CA3AF" }),
                                            indicatorSeparator: () => ({ display: "none" }),
                                        }}
                                    />
                                </div>

                                {/* Reactivate On */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Reactivate On</label>
                                    <DatePicker
                                        withPortal
                                        minDate={addDays(new Date(), 1)} // disables today and all past dates
                                        selected={freezeData.reactivateOn ? new Date(freezeData.reactivateOn) : null}
                                        onChange={(date) => handleDateChange(date, "reactivateOn", setFreezeData)}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    />
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Freezing (Optional)
                                    </label>
                                    <textarea
                                        name="reasonForFreezing"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={6}
                                        value={freezeData.reasonForFreezing}
                                        onChange={(e) => handleInputChange(e, setFreezeData)}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex w-full justify-end gap-4 pt-4">
                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => {
                                            if (!freezeData.freezeStartDate || !freezeData.freezeDurationMonths || !freezeData.reactivateOn) {
                                                showWarning("Incomplete Form", "Please fill in all the required fields before submitting.");

                                                return;
                                            }

                                            // ✅ Submit when all fields are filled
                                            freezerMembershipSubmit(freezeData, "allMembers");
                                        }}
                                    >
                                        Freeze Membership
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </div >
        </>
    );
};

export default ParentProfile;
