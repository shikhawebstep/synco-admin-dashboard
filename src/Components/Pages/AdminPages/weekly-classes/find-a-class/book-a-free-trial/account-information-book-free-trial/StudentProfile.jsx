// src/components/StudentProfile.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';

import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useBookFreeTrial } from '../../../../contexts/BookAFreeTrialContext';
import Loader from '../../../../contexts/Loader';
import { usePermission } from '../../../../Common/permission';
import List from '../../Book a Membership/list';
import { showSuccess, showError, showConfirm, showWarning } from '../../../../../../../utils/swalHelper';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaSave } from "react-icons/fa";
import { useNotification } from '../../../../contexts/NotificationContext';

const StudentProfile = ({ StudentProfile }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [selectedDate, setSelectedDate] = useState(null);
    const navigate = useNavigate();
    const [commentsList, setCommentsList] = useState([]);
    const [loadingComment, setLoadingComment] = useState(false);
    const [comment, setComment] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 5; // Number of comments per page
    console.log('StudentProfile', StudentProfile)
    // Pagination calculations
    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
    const totalPages = Math.ceil(commentsList.length / commentsPerPage);

    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };
    const [editingIndex, setEditingIndex] = useState(null);
    const { loading, cancelFreeTrial, sendCancelFreeTrialmail, rebookFreeTrialsubmit, noMembershipSubmit, updateBookFreeTrialsFamily } = useBookFreeTrial() || {};
    const { adminInfo, setAdminInfo } = useNotification();
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
    const token = localStorage.getItem("adminToken");

    const [showRebookTrial, setshowRebookTrial] = useState(false);
    const [showCancelTrial, setshowCancelTrial] = useState(false);
    const [noMembershipSelect, setNoMembershipSelect] = useState(false);

    const [selectedTime, setSelectedTime] = useState(null);
    const [additionalNote, setAdditionalNote] = useState("");

    const [reason, setReason] = useState("");
    const reasonOptions = [
        { value: "Family emergency - cannot attend", label: "Family emergency - cannot attend" },
        { value: "Health issue", label: "Health issue" },
        { value: "Schedule conflict", label: "Schedule conflict" },
    ];

    const handleCancel = () => {
        console.log("Payload:", formData);
        cancelFreeTrial(formData);
    };
    const formatDate = (dateString, withTime = false) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const options = {
            year: "numeric",
            month: "short",
            day: "2-digit",
        };
        if (withTime) {
            return (
                date.toLocaleDateString("en-US", options) +
                ", " +
                date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            );
        }
        return date.toLocaleDateString("en-US", options);
    };

    const {
        id,
        bookingId,
        trialDate,
        bookedBy,
        status,
        createdAt,
        venueId,
        classSchedule,
        paymentPlans,
    } = StudentProfile;

    const [students, setStudents] = useState(StudentProfile?.students || []);


    const [cancelWaitingList, setCancelWaitingList] = useState({
        bookingId: id,
        noMembershipReason: "",           // corresponds to DatePicker
        noMembershipNotes: "",        // textarea
    });
    const [rebookFreeTrial, setRebookFreeTrial] = useState({
        bookingId: id || null,
        trialDate: "",
        reasonForNonAttendance: "",
        additionalNote: "",
    });

    console.log('parents', StudentProfile)
    const parents = StudentProfile?.parents;
    const [formData, setFormData] = useState({
        bookingId: id,
        cancelReason: "",
        additionalNote: "",
    });
    const studentCount = students?.length || 0;
    const matchedPlan = paymentPlans?.find(plan => plan.students === studentCount);
    const emergency = StudentProfile?.emergency;


    const { checkPermission } = usePermission();

    const canCancelTrial =
        checkPermission({ module: 'cancel-free-trial', action: 'create' })
    const canRebooking =
        checkPermission({ module: 'rebooking', action: 'create' })

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setRebookFreeTrial((prev) => ({
            ...prev,
            trialDate: date ? date.toISOString().split("T")[0] : "",
        }));
    };


    const fetchComments = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book/free-trials/comment/list`, {
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

            showError("Error", error.message || error.error || "Failed to fetch comments. Please try again later.");
        }
    }, []);
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
            // Loader skipped

            setLoadingComment(true)

            const response = await fetch(`${API_BASE_URL}/api/admin/book/free-trials/comment/create`, requestOptions);

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
        }
        finally {
            setLoadingComment(false)
        }
    }


    const handleDOBChange = (index, date) => {
        const today = new Date();
        let ageNow = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
            ageNow--;
        }

        const updatedStudents = [...students];
        updatedStudents[index].dateOfBirth = date;
        updatedStudents[index].age = ageNow;
        setStudents(updatedStudents);
    };


    const handleReasonChange = (selectedOption) => {
        setReason(selectedOption);
        setRebookFreeTrial((prev) => ({
            ...prev,
            reasonForNonAttendance: selectedOption ? selectedOption.value : "",
        }));
    };

    const handleNoteChange = (e) => {
        setAdditionalNote(e.target.value);
        setRebookFreeTrial((prev) => ({
            ...prev,
            additionalNote: e.target.value,
        }));
    };
    const handleInputChange = (e, stateSetter) => {
        const { name, value } = e.target;
        stateSetter((prev) => ({ ...prev, [name]: value }));
    };

    const handleStudentDataChange = (index, field, value) => {
        const updatedStudents = [...students];
        updatedStudents[index] = {
            ...updatedStudents[index],
            [field]: value,
        };
        setStudents(updatedStudents);
    };



    useEffect(() => {
        fetchComments();
    }, [])
    const toggleEditStudent = (index) => {
        if (editingIndex === index) {
            // ✅ Save Mode
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
                emergencyContacts: emergency.map((e, eIndex) => ({
                    id: e.id ?? eIndex + 1,
                    ...e,
                })),
            }));

            updateBookFreeTrialsFamily(StudentProfile.id, payload);
            console.log("Parent Payload to send:", payload);
        } else {
            // ✏️ Edit Mode
            setEditingIndex(index);
        }
    };

    const handleSelectChange = (selected, field, stateSetter) => {
        stateSetter((prev) => ({ ...prev, [field]: selected?.value || null }));
    };
    const formatStatus = (status) => {
        if (!status) return "-";
        return status
            .split("_")           // split by underscore
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize first letter
            .join(" ");           // join with space
    };
    const handleBookMembership = () => {
        showConfirm(
            "Are you sure?",
            "Do you want to book a membership?",
            "Yes, Book it!"
        ).then((result) => {
            if (result.isConfirmed) {
                // Navigate to your component/route
                navigate("/weekly-classes/find-a-class/book-a-membership", {

                    state: { TrialData: StudentProfile, comesFrom: "trials" },
                });
            }
        });
    };

    if (loading) return <Loader />;
    console.log('students', students)
    return (
        <>
            <div className="md:flex w-full gap-4">
                <div className="transition-all duration-300 flex-1 md:w-8/12 ">
                    <div className="space-y-6">
                        {students?.map((student, index) => (
                            <div
                                key={student.id || index}
                                className="bg-white p-6 mb-10 rounded-3xl shadow-sm space-y-6 relative"
                            >
                                {/* Header + Pencil/Save */}
                                <div className="flex justify-between items-start">
                                    <h2 className="text-[20px] font-semibold">Student Information</h2>
                                    <button
                                        onClick={() => toggleEditStudent(index)}
                                        className="text-gray-600 hover:text-blue-600"
                                    >
                                        {editingIndex === index ? <FaSave /> : <FaEdit />}
                                    </button>
                                </div>

                                {/* Row 1: First / Last Name */}
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">First name</label>
                                        <input
                                            type="text"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={student.studentFirstName || ""}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleStudentDataChange(index, "studentFirstName", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Last name</label>
                                        <input
                                            type="text"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={student.studentLastName || ""}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleStudentDataChange(index, "studentLastName", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Row 2: DOB / Age */}
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Date of Birth</label>
                                        <DatePicker
                                            withPortal
                                            selected={student.dateOfBirth}
                                            onChange={(date) => handleDOBChange(index, date)}
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            showYearDropdown
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            dateFormat="dd/MM/yyyy"
                                            maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 3))} // Minimum age: 3 years
                                            minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))} // Maximum age: 100 years
                                            placeholderText="Select date of birth"
                                            isClearable
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Age</label>
                                        <input
                                            type="number"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={student.age || ""}
                                            readOnly
                                            onChange={(e) =>
                                                handleStudentDataChange(index, "age", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Gender / Medical Info */}
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Gender</label>
                                        <input
                                            type="text"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={student.gender || ""}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleStudentDataChange(index, "gender", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">
                                            Medical Information
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={student.medicalInformation || ""}
                                            readOnly={editingIndex !== index}
                                            onChange={(e) =>
                                                handleStudentDataChange(index, "medicalInformation", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Row 4: Class / Time */}
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Class</label>
                                        <input
                                            type="text"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={student?.classSchedule?.className || ""}
                                            readOnly
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="block text-[16px] font-semibold">Time</label>
                                        <input
                                            type="text"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                            value={student?.classSchedule?.startTime || ""}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}


                    </div>


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
                                {loadingComment ? (
                                    <Loader2 className="animate-spin w-5 h-5 text-white" />
                                ) : (
                                    <img src="/images/icons/sent.png" alt="" />
                                )}
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
                    <div className="rounded-3xl bg-[#2E2F3E] overflow-hidden shadow-md border border-gray-200">
                        {/* Header */}
                        <div className="] m-2 px-6 rounded-3xl py-3 flex items-center justify-between bg-no-repeat bg-center"
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
                                <div className="text-[16px] font-semibold text-[#1F2937]">Trials</div>
                            </div>
                            <div className="bg-[#343A40] flex items-center gap-2  text-white text-[14px] px-3 py-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                    {status === 'pending' && (
                                        <img src="/images/icons/loadingWhite.png" alt="Pending" />
                                    )}
                                    {status === 'not attend' && (
                                        <img src="/images/icons/x-circle-contained.png" alt="Not Attended" />
                                    )}
                                    {status === 'attended' && (
                                        <img src="/images/icons/attendedicon.png" alt="Attended" />
                                    )}
                                    {status === 'cancelled' && (
                                        <img src="/images/icons/x-circle-contained.png" alt="Cancelled" />
                                    )}

                                    {/* Fallback for any other or undefined status */}
                                    {!status && (
                                        <>
                                            <img src="/images/icons/x-circle-contained.png" alt="Not Attended" />
                                            Not Attended
                                        </>
                                    )}

                                    {/* Status text */}
                                    <span className="capitalize">
                                        {status ? status.replaceAll("_", " ") : "Unknown"}
                                    </span>
                                </div>

                            </div>
                        </div>

                        <div className="bg-[#2E2F3E] text-white px-6 py-6 space-y-6">
                            {/* Avatar & Account Holder */}
                            <div className="flex items-center gap-4">
                                <img
                                    src={
                                        (status === 'pending' || status === 'attended') && bookedBy?.profile
                                            ? `${API_BASE_URL}/${bookedBy?.profile}`
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
                                        {status === 'pending' || status === 'attended'
                                            ? 'Booked By'
                                            : 'Account Holder'}
                                    </div>
                                    <div className="text-[16px] text-gray-300">
                                        {status === 'pending' || status === 'attended'
                                            ? `${bookedBy?.firstName} ${bookedBy?.lastName}`
                                            : `${StudentProfile?.parents[0]?.parentFirstName} / ${StudentProfile?.parents[0]?.relationToChild}`}
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y">
                                <div>
                                    <div className="text-[20px] font-bold tracking-wide">Venue</div>
                                    <div className="inline-block bg-[#007BFF] text-white text-[14px] px-3 py-1 rounded-md my-2">
                                        {StudentProfile?.venue?.name || "-"}
                                    </div>
                                </div>

                                <div className="border-t border-[#495362] py-5">

                                    <>
                                        <div className="text-[20px] text-white">Students</div>
                                        <div className="text-[16px] mt-1 text-gray-400">{students?.length || 0}</div>
                                    </>


                                </div>

                                <div className="border-t border-[#495362] py-5">
                                    {status === 'pending' || status === 'attended' ? (
                                        <>
                                            <div className=" text-[20px] text-white">Booking Date</div>
                                            <div className="text-[16px]  mt-1 text-gray-400"> {formatDate(createdAt, true)}</div>

                                        </>
                                    ) : (
                                        <>

                                            <div className=" text-[20px] text-white">Date of Booking</div>
                                            <div className="text-[16px]  mt-1 text-gray-400"> {formatDate(createdAt, true)}</div>
                                        </>
                                    )}

                                </div>

                                <div className="border-t border-[#495362] py-5">
                                    <div className=" text-[20px] text-white">Date of Trial</div>
                                    <div className="text-[16px]  mt-1 text-gray-400">{formatDate(trialDate)}</div>
                                </div>

                                <>
                                    <div className="border-t border-[#495362] py-5">
                                        <div className=" text-[20px] text-white">Booking Source</div>
                                        <div className="text-[16px]  mt-1 text-gray-400"> {bookedBy?.firstName} {bookedBy?.lastName}</div>
                                    </div>
                                </>

                            </div>
                        </div>



                    </div>
                    {status !== 'cancelled' && (
                        <>
                            <div className="bg-white rounded-3xl p-6  space-y-4 mt-4">

                                {/* Top Row: Email + Text */}
                                <div className="flex gap-7">

                                    <button onClick={() => sendCancelFreeTrialmail([id])} className="flex-1 border border-[#717073] rounded-xl py-3 flex text-[18px] items-center justify-center hover:shadow-md transition-shadow duration-300 gap-2 text-[#717073] font-medium">
                                        <img src="/images/icons/mail.png" alt="" /> Send Email
                                    </button>

                                    <button className="flex-1 border border-[#717073] rounded-xl py-3 flex  text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-[#717073] font-medium">
                                        <img src="/images/icons/sendText.png" alt="" /> Send Text
                                    </button>
                                </div>


                                {status?.trim().toLowerCase() == "pending" ||
                                    status?.trim().toLowerCase() == "not attend" ||
                                    status?.trim().toLowerCase() == "not attended" &&
                                    status?.trim().toLowerCase() !== "attended" &&
                                    status?.trim().toLowerCase() !== "no_membership" &&
                                    status?.trim().toLowerCase() !== "rebooked" &&
                                    canRebooking &&
                                    (() => {
                                        const today = new Date();
                                        const trialDateObj = new Date(trialDate);
                                        return trialDateObj <= today; // ✅ show only if date has passed
                                    })() && (
                                        <button
                                            onClick={() => setshowRebookTrial(true)}
                                            className="w-full bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:bg-blue-700 hover:shadow-md transition-shadow duration-300"
                                        >
                                            Rebook FREE Trial
                                        </button>
                                    )}

                                {status !== 'attended' && canCancelTrial && (
                                    <button
                                        onClick={() => setshowCancelTrial(true)}
                                        className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                    >
                                        Cancel Trial
                                    </button>
                                )}

                                {status !== 'pending' && status !== 'attended' && (
                                    <button
                                        onClick={handleBookMembership}
                                        className="w-full border border-gray-300 text-[#717073] text-[18px] rounded-xl py-3 hover:shadow-md transition-shadow duration-300 font-medium"
                                    >
                                        Book a Membership
                                    </button>
                                )}

                                {status === 'attended' && (
                                    <div className="flex gap-7">
                                        <button onClick={() => setNoMembershipSelect(true)} className="flex-1 border bg-[#FF6C6C] border-[#FF6C6C] rounded-xl py-3 flex text-[18px] items-center justify-center hover:shadow-md transition-shadow duration-300 gap-2 text-white font-medium">
                                            No Membership
                                        </button>

                                        <button onClick={handleBookMembership} className="flex-1 border bg-[#237FEA] border-[#237FEA] rounded-xl py-3 flex text-[18px] items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 text-white font-medium">
                                            Book a Membership
                                        </button>
                                    </div>
                                )}


                            </div>
                        </>
                    )}
                    {status === 'cancelled' && (() => {
                        const today = new Date();
                        const trialDateObj = new Date(trialDate);

                        // ✅ Strip time portion for fair date-only comparison
                        today.setHours(0, 0, 0, 0);
                        trialDateObj.setHours(0, 0, 0, 0);

                        // ✅ Only show if trial date is *before* today
                        return trialDateObj < today;
                    })() && (
                            <button
                                onClick={() => setshowRebookTrial(true)}
                                className="w-full bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:bg-blue-700 hover:shadow-md transition-shadow duration-300"
                            >
                                Rebook FREE Trial
                            </button>
                        )}
                </div>
                {showRebookTrial && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setshowRebookTrial(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">Rebook Free Trial</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Venue */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Venue</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        placeholder="Select Venue"
                                        value={classSchedule?.venue?.name || "-"}
                                        readOnly
                                    />
                                </div>

                                {/* Class */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Class</label>
                                    <input
                                        type="text"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        placeholder="Select Class"
                                        value={classSchedule?.className || "-"}
                                        readOnly
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Date</label>
                                    <DatePicker
                                        withPortal
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat="EEEE, dd MMMM yyyy"
                                        placeholderText="Select a date"
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    />
                                </div>

                                {/* Time */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[16px] font-semibold">Time</label>
                                        <DatePicker
                                            withPortal
                                            selected={selectedTime}
                                            onChange={setSelectedTime}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={60}
                                            timeCaption="Time"
                                            dateFormat="h:mm aa"
                                            placeholderText="Select Time"
                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        />
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <label className="block text-[16px] font-semibold">
                                            Reason for Non-Attendance
                                        </label>
                                        <Select
                                            value={reason}
                                            onChange={handleReasonChange}
                                            options={reasonOptions}
                                            placeholder="Select Reason"
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
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">Additional Notes (Optional)</label>
                                    <textarea
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={3}
                                        placeholder="Add any notes here..."
                                        value={additionalNote}
                                        onChange={handleNoteChange}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        className="flex-1 border border-gray-400 rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => setshowRebookTrial(false)}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="w-1/2 bg-[#237FEA] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                        onClick={() => {
                                            if (!selectedDate) {
                                                showWarning("Please select a date first!");
                                                return;
                                            }

                                            if (!reason) {
                                                showWarning("Please select a reason for non-attendance!");
                                                return;
                                            }

                                            // ✅ Proceed only if both selectedDate and reason exist
                                            rebookFreeTrialsubmit(rebookFreeTrial);
                                        }}
                                    >
                                        Rebook Trial
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
                                <h2 className="font-semibold text-[24px]">Cancel Free Trial</h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                {/* Reason */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Cancellation
                                    </label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === formData.cancelReason)}
                                        onChange={(selected) =>
                                            setFormData((prev) => ({ ...prev, cancelReason: selected.value }))
                                        }
                                        options={reasonOptions}
                                        placeholder=""
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

                                {/* Notes */}
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        className="w-full bg-gray-100 mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        rows={3}
                                        value={formData.additionalNote}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, additionalNote: e.target.value }))
                                        }
                                        placeholder=""
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={handleCancel}
                                        className="w-1/2 bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                    >
                                        Cancel Trial
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )}
                {noMembershipSelect && (
                    <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl w-[541px] max-h-[90%] overflow-y-auto relative scrollbar-hide">
                            <button
                                className="absolute top-4 left-4 p-2"
                                onClick={() => setNoMembershipSelect(false)}
                            >
                                <img src="/images/icons/cross.png" alt="Close" />
                            </button>

                            <div className="text-center py-6 border-b border-gray-300">
                                <h2 className="font-semibold text-[24px]">No Membership Selected  </h2>
                            </div>

                            <div className="space-y-4 px-6 pb-6 pt-4">
                                <div>
                                    <label className="block text-[16px] font-semibold">
                                        Reason for Not Proceeding
                                    </label>
                                    <Select
                                        value={reasonOptions.find((opt) => opt.value === cancelWaitingList.noMembershipReason)}
                                        onChange={(selected) => handleSelectChange(selected, "noMembershipReason", setCancelWaitingList)}
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
                                        name="noMembershipNotes"    // <-- MUST match state key
                                        value={cancelWaitingList.noMembershipNotes}
                                        onChange={(e) => handleInputChange(e, setCancelWaitingList)}
                                        placeholder=""
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        onClick={() => noMembershipSubmit(cancelWaitingList, 'allMembers')}

                                        className="w-1/2  bg-[#FF6C6C] text-white rounded-xl py-3 text-[18px] font-medium hover:shadow-md transition-shadow"
                                    >
                                        Cancel Spot on Waiting List
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

export default StudentProfile;
