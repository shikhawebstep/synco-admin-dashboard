import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FiSearch } from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "react-select";
import { Check, } from "lucide-react";
import { useBookFreeTrial } from '../../contexts/BookAFreeTrialContext';
import { useNavigate } from "react-router-dom";
import Loader from '../../contexts/Loader';
import { usePermission } from '../../Common/permission';
import * as XLSX from "xlsx";
import { showError, showWarning } from '../../../../../utils/swalHelper'; 
import { useLocation } from "react-router-dom";

import { saveAs } from "file-saver";
import StatsGrid from '../../Common/StatsGrid';
import DynamicTable from '../../Common/DynamicTable';
const CancellationList = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [tempSelectedAgents, setTempSelectedAgents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const location = useLocation();
    const [isFilterApplied, setIsFilterApplied] = useState(false);

    const [active, setActive] = useState("request"); // default selected

    const buttons = [
        { key: "request", label: "Request to Cancel" },
        { key: "full", label: "Full Cancellation" },
        { key: "all", label: "All" },
    ];
    useEffect(() => {
        if (location.state === "fullCancellation") {
            setActive("full");
        } else if (location.state === "allCancellation") {
            setActive("all");
        }
    }, [location.state]);

    const { fetchFullCancellations, fetchRequestToCancellations, fetchAllCancellations, statsFreeTrial, bookFreeTrials, setSearchTerm, bookedByAdmin, searchTerm, loading, selectedVenue, setSelectedVenue, myVenues, sendRequestTomail, sendAllmail, sendFullTomail } = useBookFreeTrial() || {};

    const toggleSelect = (studentId) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId) // remove if already selected
                : [...prev, studentId] // add if not selected
        );
    };
    const exportFreeTrials = () => {
        const dataToExport = [];
        console.log('bookFreeTrials', bookFreeTrials)
        bookFreeTrials?.forEach((item) => {
            if (selectedStudents.length > 0 && !selectedStudents.includes(item.bookingId)) return;

            item.students.forEach((student) => {
                dataToExport.push({
                    Name: `${student.studentFirstName} ${student?.studentLastName}`,
                    Age: student.age,
                    Venue: item.venue?.name || "-",
                    'Date of Booking': new Date(item.createdAt || item.trialDate).toLocaleDateString(),
                    'Date of Trial': new Date(item.trialDate).toLocaleDateString(),
                    Source: item.parents?.[0]?.howDidYouHear || "-",
                    Attempts: "0",
                    Status: item.status,
                });
            });
        });

        if (!dataToExport.length) return alert('No data to export');

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'FreeTrials');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'Cancellations.xlsx');
    };

    const [checkedStatuses, setCheckedStatuses] = useState({
        request_to_cancel: false,
        cancelled: false,
        dateBooked: false,
        dateOfTrial: false,
    });

    const [selectedDates, setSelectedDates] = useState([]);
    const handleCheckboxChange = (label) => {
        setCheckedStatuses((prev) => {
            switch (label) {
                case "Request to cancel":
                    return { ...prev, request_to_cancel: !prev.request_to_cancel };
                case "Cancelled":
                    return { ...prev, cancelled: !prev.cancelled };
                case "Date Booked":
                    return { ...prev, dateBooked: !prev.dateBooked };
                case "Date of Trial":
                    return { ...prev, dateOfTrial: !prev.dateOfTrial };
                default:
                    return prev;
            }
        });
    };
    // const [selectedDate, setSelectedDate] = useState(null);



    const navigate = useNavigate();

    // console.log('bookedByAdmin', bookedByAdmin)

    useEffect(() => {
        const venueName = selectedVenue?.label || "";
        // console.log('venueName', venueName)
        if (active === "request") {
            fetchRequestToCancellations("", venueName);
            // console.log('1')
        } else if (active === "full") {
            fetchFullCancellations("", venueName);
            // console.log('2')

        } else if (active === "all") {

            // console.log('3')
            fetchAllCancellations("", venueName);
        } else {
            // console.log('4')
            // fallback
            fetchFullCancellations();
        }
    }, [selectedVenue, active]);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const getDaysArray = () => {
        const startDay = new Date(year, month, 1).getDay(); // Sunday = 0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        const offset = startDay === 0 ? 6 : startDay - 1;

        for (let i = 0; i < offset; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const calendarDays = getDaysArray();

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const isInRange = (date) => {
        if (!fromDate || !toDate || !date) return false;
        return date >= fromDate && date <= toDate;
    };

    const isSameDate = (d1, d2) => {
        if (!d1 || !d2) return false;
        const date1 = d1 instanceof Date ? d1 : new Date(d1);
        const date2 = d2 instanceof Date ? d2 : new Date(d2);
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };


    const handleDateClick = (date) => {
        if (!date) return;

        if (!fromDate) {
            setFromDate(date);
            setToDate(null); // reset second date
        } else if (!toDate) {
            // Ensure order (from <= to)
            if (date < fromDate) {
                setToDate(fromDate);
                setFromDate(date);
            } else {
                setToDate(date);
            }
        } else {
            // If both already selected, reset
            setFromDate(date);
            setToDate(null);
        }
    };

    const modalRef = useRef(null);
    const PRef = useRef(null);
    const stats = [
        {
            title: "Total Request",
            value: statsFreeTrial?.totalRequests?.value || "0",
            icon: "/DashboardIcons/🔢.png", // Replace with actual SVG if needed
            change: statsFreeTrial?.totalRequests?.change != null
                ? `${statsFreeTrial.totalRequests.change}`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F3FAF5]"
        },
        {
            title: "Avg.Tenure",
            value:
                statsFreeTrial?.avgTenure?.value || statsFreeTrial?.avgTenure?.value
                    ? `${statsFreeTrial?.avgTenure?.value ?? ""} `.trim()
                    : "0",
            subValue: `${statsFreeTrial?.avgTenure?.change ?? ""} `,
            icon: "/DashboardIcons/📊.png",
            color: "text-green-500",
            bg: "bg-[#F3FAFD]"
        },
        {
            title: "Most Request venue",
            value: statsFreeTrial?.mostRequestedVenue?.value || "0",
            icon: "/DashboardIcons/📍.png",
            change: statsFreeTrial?.mostRequestedVenue?.change != null
                ? `${statsFreeTrial.mostRequestedVenue.change}`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#F0F9F9]"
        }, {
            title: "Common Reason",
            value: statsFreeTrial?.commonReason?.value || "0",
            icon: "/DashboardIcons/💬.png",
            subValue: statsFreeTrial?.commonReason?.change != null
                ? `${statsFreeTrial.commonReason.change}`
                : "0%",
            color: "text-green-500",
            bg: "bg-[#FEF6FB]"
        },

        {
            title: "High Risk Age Group ",
            value:
                statsFreeTrial?.highestRiskAgeGroup?.value ? `${statsFreeTrial?.highestRiskAgeGroup?.value ?? ""}`.trim()
                    : "0",
            subValue: statsFreeTrial?.highestRiskAgeGroup?.change != null
                ? `${statsFreeTrial.highestRiskAgeGroup.change}`
                : "0%",
            icon: "/DashboardIcons/🎯.png",
            color: "text-green-500",
            bg: "bg-[#F3FAFD]"
        },
    ];
    const applyFilter = () => {
        const forAttend = checkedStatuses.request_to_cancel || "";
        const forNotAttend = checkedStatuses.cancelled || "";

        let forDateOkBookingTrial = "";
        let forDateOfTrial = "";
        let forOtherDate = "";

        const bookedDatesChecked = checkedStatuses.dateBooked;
        const trialDatesChecked = checkedStatuses.dateOfTrial;
        if ((fromDate && !toDate) || (!fromDate && toDate)) {
            showError("Missing Date", "Please select both Start Date and End Date.");
            return; // Stop further execution
        }
        if (fromDate && toDate) {
            if (bookedDatesChecked) {
                forDateOkBookingTrial = [fromDate, toDate];
            } else if (trialDatesChecked) {
                forDateOfTrial = [fromDate, toDate];
            } else {
                forOtherDate = [fromDate, toDate];
            }
        }
        setIsFilterApplied(true);
        const bookedByParams = savedAgent || [];
        if (active === "request") {
            fetchRequestToCancellations(
                "",
                "",
                forAttend,
                forNotAttend,
                forDateOkBookingTrial,
                forDateOfTrial,
                forOtherDate,
                bookedByParams
            );
        } else if (active === "full") {
            fetchFullCancellations(
                "",
                "",
                forAttend,
                forNotAttend,
                forDateOkBookingTrial,
                forDateOfTrial,
                forOtherDate,
                bookedByParams
            );
        } else if (active === "all") {
            fetchAllCancellations(
                "",
                "",
                forAttend,
                forNotAttend,
                forDateOkBookingTrial,
                forDateOfTrial,
                forOtherDate,
                bookedByParams
            );
        }
    };

    const getStatusBadge = (status) => {
        const s = status.toLowerCase();
        let styles =
            "bg-red-100 text-red-500"; // default fallback
        if (s === "attended" || s === "active")
            styles = "bg-yellow-100 text-yellow-600";
        else if (s === "pending") styles = "bg-yellow-100 text-yellow-600";
        else if (s === "frozen") styles = "bg-blue-100 text-blue-600";
        else if (s === "waiting list") styles = "bg-gray-200 text-gray-700";

        return (
            <div
                className={`flex text-center justify-center rounded-lg p-1 gap-2 ${styles} capitalize`}
            >
                {status}
            </div>
        );
    };

    const [showPopup, setShowPopup] = useState(false);
    const [tempSelectedAgent, setTempSelectedAgent] = useState(null);
    const [savedAgent, setSavedAgent] = useState([]);
    const popupRef = useRef(null);

    const agents = Array(6).fill({
        name: "Jaffar",
        avatar: "https://i.ibb.co/ZVPd9vJ/jaffar.png", // Replace with real image or asset
    });

    // Close popup if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
                setTempSelectedAgent(savedAgent); // Reset to saved
            }
        };

        if (showPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPopup, savedAgent]);

    const handleNext = () => {
        if (tempSelectedAgents.length > 0) {
            const selectedNames = tempSelectedAgents.map(
                (agent) => `${agent.id}`
            );
            setSavedAgent(selectedNames); // ✅ saves full names as strings
            // console.log("selectedNames", tempSelectedAgents);
        } else {
            setSavedAgent([]); // nothing selected → clear
        }
        setShowPopup(false);
    };
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Fetch data with search value (debounce optional)
        if (active === "request") {
            fetchRequestToCancellations(value);
        } else if (active === "full") {
            fetchFullCancellations(value);
        } else if (active === "all") {
            fetchAllCancellations(value);
        }
    };
    // console.log('statsFreeTrial', statsFreeTrial)
    const { checkPermission } = usePermission();

    const canServicehistory =
        checkPermission({ module: 'service-history', action: 'view-listing' })

    const fullCancellationTable = [
        {
            header: "Parent Name",
            key: "name",
            selectable: true, // ✅ checkbox + parent name
            render: (item) =>
                `${item.parents?.[0]?.parentFirstName || ""} ${item.parents?.[0]?.parentLastName || ""}`,
        },
        {
            header: "No. Of Students",
            render: (item) => item.totalStudents || item.students?.length || 0,
        },
        {
            header: "Venue",
            render: (item) => item.venue?.name || "-",
        },
        {
            header: "Membership Start Date",
            render: (item) =>
                item.startDate ? new Date(item.startDate).toLocaleDateString() : "-",
        },
        {
            header: "Membership End Date",
            render: (item) =>
                item.endDate ? new Date(item.endDate).toLocaleDateString() : "-",
        },

        {
            header: "Membership Plan",
            render: (item) => item.paymentPlan?.title || "-",
        },
        {
            header: "Life Cycle",
            render: (item) => {
                if (!item.paymentPlan) return "-";
                const { duration, interval } = item.paymentPlan;
                const intervalLabel = duration === 1 ? interval : `${interval}s`; // singular or plural
                return `${duration} ${intervalLabel}`;
            },
        },
        {
            header: "Reason",
            render: (item) => (
                <div
                    className={`flex text-center justify-center rounded-lg p-1 gap-2 ${item.status?.toLowerCase() === "cancelled"
                        ? "bg-yellow-100 text-yellow-600"
                        : item.status?.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-yellow-100 text-yellow-600"
                        } capitalize`}
                >
                    {item.cancelReason || 'Other'}
                </div>
            ),
        },
    ];
    const requestCancellationTable = [
        {
            header: "Parent Name",
            key: "name",
            selectable: true, // ✅ checkbox + parent name
            render: (item) =>
                `${item.parents?.[0]?.parentFirstName || ""} ${item.parents?.[0]?.parentLastName || ""}`,
        },
        {
            header: "No. Of Students",
            render: (item) => item.totalStudents || item.students?.length || 0,
        },
        {
            header: "Venue",
            render: (item) => item.venue?.name || "-",
        },
        {
            header: "Membership Start Date",
            render: (item) =>
                item.startDate
                    ? new Date(item.startDate).toLocaleDateString()
                    : new Date(item.createdAt).toLocaleDateString(),
        },
        {
            header: "Request Date",
            render: (item) =>
                item.cancelDate ? new Date(item.cancelDate).toLocaleDateString() : "-",
        },
        {
            header: "Membership Plan",
            render: (item) => item.paymentPlan?.title || "-",
        },
        {
            header: "Tenure",
            render: (item) => {
                if (!item.paymentPlan) return "-";
                const { duration, interval } = item.paymentPlan;
                const intervalLabel = duration === 1 ? interval : `${interval}s`; // singular or plural
                return `${duration} ${intervalLabel}`;
            },
        },
        {
            header: "Reason",
            render: (item) => (
                <div
                    className={`flex text-center justify-center rounded-lg p-1 gap-2 ${item.status?.toLowerCase() === "cancelled"
                        ? "bg-[#eda6001f] text-[#EDA600]"
                        : item.status?.toLowerCase() === "pending"
                            ? "bg-[#eda6001f] text-[#EDA600]"
                            : "bg-yellow-100 text-yellow-600"
                        } capitalize`}
                >
                    {item.cancelReason || 'Other'}
                </div>
            ),
        },
    ];
    const allCancellationTable = [
        {
            header: "Parent Name",
            key: "name",
            selectable: true, // ✅ checkbox + parent name
            render: (item) =>
                `${item.parents?.[0]?.parentFirstName || ""} ${item.parents?.[0]?.parentLastName || ""}`,
        },
        {
            header: "No. Of Students",
            render: (item) => item.totalStudents || item.students?.length || 0,
        },
        {
            header: "Venue",
            render: (item) => item.venue?.name || "-",
        },
        {
            header: "Membership Start Date",
            render: (item) =>
                item.startDate
                    ? new Date(item.startDate).toLocaleDateString()
                    : new Date(item.createdAt).toLocaleDateString(),
        },
        {
            header: "Request Date",
            render: (item) =>
                item.cancelDate ? new Date(item.cancelDate).toLocaleDateString() : "-",
        },
        {
            header: "Membership Plan",
            render: (item) => item.paymentPlan?.title || "-",
        },
        {
            header: "Tenure",
            render: (item) => {
                if (!item.paymentPlan) return "-";
                const { duration, interval } = item.paymentPlan;
                const intervalLabel = duration === 1 ? interval : `${interval}s`; // singular or plural
                return `${duration} ${intervalLabel}`;
            },
        },
        {
            header: "Reason",
            render: (item) => (
                <div
                    className={`flex text-center justify-center rounded-lg p-1 gap-2 ${item.status?.toLowerCase() === "cancelled"
                        ? "bg-yellow-100 text-yellow-600"
                        : item.status?.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-yellow-100 text-yellow-600"
                        } capitalize`}
                >
                    {item.cancelReason || 'Other'}
                </div>
            ),
        },
    ];

    useEffect(() => {
        if (isFilterApplied) {
            setIsFilterApplied(false)
        }
    })
    const currentColumns = useMemo(() => {
        if (active === "request") return requestCancellationTable;
        if (active === "full") return fullCancellationTable;
        if (active === "all") return allCancellationTable;
        return fullCancellationTable; // fallback
    }, [active]);

    let cancelType = "";

    if (active === "request") cancelType = "request to cancel";
    else if (active === "all") cancelType = "all cancel";
    else if (active === "full") cancelType = "full cancel";
    // console.log('myVenues',myVenues)

    return (
        <div className="pt-1 bg-gray-50 min-h-screen">

            <div className="md:flex w-full gap-4">
                <div className="md:w-8/12 transition-all duration-300">
                    <div className="flex flex-col md:flex-row py-6 pb-10 gap-4">
                        {buttons.map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => {
                                    setActive(btn.key);
                                    setSelectedStudents([]);
                                }}
                                className={`w-full md:w-auto flex gap-2 items-center px-3 py-2 rounded-xl text-sm text-[16px] transition ${active === btn.key
                                    ? "bg-[#237FEA] text-white" // active
                                    : "text-gray-700 font-semibold border border-gray-300" // inactive
                                    }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <Loader />
                    ) : (
                        <>
                            <StatsGrid stats={stats} variant="A" />
                            <div className="flex justify-between items-center ">
                                <h2 className='text-2xl font-semibold'>{active == "request" ? "Request to cancel" : "Full to cancel"}</h2>
                                <div className="bg-white min-w-[50px] min-h-[50px] p-2 rounded-full flex items-center justify-center ">
                                    <img onClick={() => navigate("/weekly-classes/find-a-class")}
                                        src="/DashboardIcons/user-add-02.png" alt="" className="cursor-pointer" />
                                </div>
                            </div>

                            <DynamicTable
                                columns={currentColumns}
                                data={bookFreeTrials}
                                selectedIds={selectedStudents}
                                setSelectedStudents={setSelectedStudents}
                                from={cancelType}
                                onRowClick={
                                    canServicehistory
                                        ? (item) =>
                                            navigate("/weekly-classes/cancellation/account-info/list", {
                                                state: {
                                                    itemId: item.id || item.bookingId,
                                                    cancelType: active,
                                                },
                                            })
                                        : undefined
                                }
                                isFilterApplied={isFilterApplied}
                            />
                        </>
                    )}

                </div>

                <div className="md:w-4/12 md:mt-0 mt-4 text-base space-y-5">
                    <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm ">
                        <h2 className="text-[24px] font-semibold">Search Now </h2>
                        <div className="">
                            <label htmlFor="" className="text-base font-semibold">Search Student</label>
                            <div className="relative mt-2">
                                <input
                                    type="text"
                                    placeholder="Search by student name"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                                />
                                <FiSearch className="absolute left-3 top-4 text-[20px]" />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label htmlFor="" className="text-base font-semibold">Venue</label>
                            <div className="relative mt-2 ">
                                <Select
                                    options={myVenues?.map((venue) => ({
                                        label: venue?.name, // or `${venue.name} (${venue.area})`
                                        value: venue?.id,
                                    }))}
                                    value={selectedVenue}
                                    onChange={(venue) => setSelectedVenue(venue)}
                                    placeholder="Choose venue"
                                    className="mt-2"
                                    classNamePrefix="react-select"
                                    isClearable={true} // 👈 adds cross button
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            borderRadius: "1.5rem",
                                            borderColor: state.isFocused ? "#ccc" : "#E5E7EB",
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
                    </div>

                    <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm ">
                        <div className="">
                            <div className="flex justify-between items-center mb-5 ">
                                <h2 className="text-[24px] font-semibold">Filter by Date </h2>
                                <button onClick={applyFilter} className="flex gap-2 items-center bg-[#237FEA] text-white px-3 py-2 rounded-lg text-sm text-[16px]">
                                    <img src='/DashboardIcons/filtericon.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                                    Apply filter
                                </button>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg w-full">
                                <div className="font-semibold mb-2 text-[18px]">Choose type</div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-semibold text-[16px]">

                                    {["Request to cancel", "Cancelled"].map((label, i) => (
                                        <label key={i} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={
                                                    label === "Request to cancel"
                                                        ? checkedStatuses.request_to_cancel
                                                        : label === "Cancelled"
                                                            ? checkedStatuses.cancelled
                                                            : label === "Date Booked"
                                                                ? checkedStatuses.dateBooked
                                                                : checkedStatuses.dateOfTrial
                                                }
                                                onChange={() => handleCheckboxChange(label)}
                                            />
                                            <span className="w-5 h-5 inline-flex text-gray-500 items-center justify-center border border-[#717073] rounded-sm bg-transparent peer-checked:text-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors">
                                                <Check className="w-4 h-4 transition-all" strokeWidth={3} />
                                            </span>
                                            <span>{label}</span>
                                        </label>
                                    ))}

                                </div>
                            </div>
                            {showPopup && (
                                <div
                                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                    onClick={() => {
                                        // click outside → reset everything
                                        setShowPopup(false);
                                        setSavedAgent([]);
                                        setTempSelectedAgents([]);
                                    }}
                                >
                                    <div
                                        ref={popupRef}
                                        className="bg-white rounded-2xl p-6 w-[300px] space-y-4 shadow-lg"
                                        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                                    >
                                        <h2 className="text-lg font-semibold">Select agent(s)</h2>
                                        <div className="space-y-3 max-h-72 overflow-y-auto">
                                            {bookedByAdmin.map((admin, index) => {
                                                const isSelected = tempSelectedAgents.some(
                                                    (a) => a.id === admin.id
                                                );

                                                return (
                                                    <label key={index} className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (isSelected) {
                                                                    setTempSelectedAgents((prev) =>
                                                                        prev.filter((a) => a.id !== admin.id)
                                                                    );
                                                                } else {
                                                                    setTempSelectedAgents((prev) => [
                                                                        ...prev,
                                                                        { id: admin.id, firstName: admin.firstName, lastName: admin.lastName },
                                                                    ]);
                                                                }
                                                            }}
                                                            className="hidden peer"
                                                        />
                                                        <span className="w-4 h-4 border rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center">
                                                            {isSelected && (
                                                                <svg
                                                                    className="w-3 h-3 text-white"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth={2}
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </span>
                                                        <img
                                                            src={admin.profile ? `${API_BASE_URL}${admin.profile}` : "/members/dummyuser.png"}
                                                            alt={`${admin.firstName} ${admin.lastName && admin.lastName !== 'null' ? ` ${admin.lastName}` : ''}`}
                                                            className="w-8 h-8 rounded-full"
                                                        />
                                                        <span>
                                                            {admin?.firstName || admin?.lastName
                                                                ? `${admin?.firstName ?? ""}${admin.lastName && admin.lastName !== 'null' ? ` ${admin.lastName}` : ''}`.trim()
                                                                : "N/A"}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        <button
                                            className="w-full bg-blue-600 text-white rounded-md py-2 font-medium"
                                            onClick={handleNext}
                                            disabled={tempSelectedAgents.length === 0}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="rounded p-4 mt-6 text-center text-base w-full max-w-md mx-auto">
                                {/* Header */}
                                <div className="flex justify-center gap-5 items-center mb-3">
                                    <button
                                        onClick={goToPreviousMonth}
                                        className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <p className="font-semibold text-[20px]">
                                        {currentDate.toLocaleString("default", { month: "long" })} {year}
                                    </p>
                                    <button
                                        onClick={goToNextMonth}
                                        className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Day Labels */}
                                <div className="grid grid-cols-7 text-xs gap-1 text-[18px] text-gray-500 mb-1">
                                    {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                                        <div key={day} className="font-medium text-center">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Weeks */}
                                <div className="flex flex-col  gap-1">
                                    {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                                        const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);


                                        return (
                                            <div
                                                key={weekIndex}
                                                className="grid grid-cols-7 text-[18px] h-12 py-1  rounded"
                                            >
                                                {week.map((date, i) => {
                                                    const isStart = isSameDate(date, fromDate);
                                                    const isEnd = isSameDate(date, toDate);
                                                    const isStartOrEnd = isStart || isEnd;
                                                    const isInBetween = date && isInRange(date);
                                                    const isExcluded = !date; // replace with your own excluded logic

                                                    let className =
                                                        " w-full h-12 aspect-square flex items-center justify-center transition-all duration-200 ";
                                                    let innerDiv = null;

                                                    if (!date) {
                                                        className += "";
                                                    } else if (isExcluded) {
                                                        className +=
                                                            "bg-gray-300 text-white opacity-60 cursor-not-allowed";
                                                    } else if (isStartOrEnd) {
                                                        // Outer pill connector background
                                                        className += ` bg-sky-100 ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""
                                                            }`;
                                                        // Inner circle but with left/right rounding
                                                        innerDiv = (
                                                            <div
                                                                className={`bg-blue-700 rounded-full text-white w-12 h-12 flex items-center justify-center font-bold
                                 
                                 `}
                                                            >
                                                                {date.getDate()}
                                                            </div>
                                                        );
                                                    } else if (isInBetween) {
                                                        // Middle range connector
                                                        className += "bg-sky-100 text-gray-800";
                                                    } else {
                                                        className += "hover:bg-gray-100 text-gray-800";
                                                    }

                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => date && !isExcluded && handleDateClick(date)}
                                                            className={className}
                                                        >
                                                            {innerDiv || (date ? date.getDate() : "")}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-5 justify-between">
                        <button

                            onClick={() => {
                                if (!selectedStudents || selectedStudents.length === 0) {
                                    showWarning("No students selected", "Please select at least one student before sending an email.");
                                    return;
                                }
                                if (active === "full") {
                                    sendFullTomail(selectedStudents);
                                    setSelectedStudents([]);
                                } else if (active === "request") {
                                    sendRequestTomail(selectedStudents);
                                    setSelectedStudents([]);
                                } else if (active === "all") {
                                    sendAllmail(selectedStudents);
                                    setSelectedStudents([]);
                                }
                            }}
                            className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]"
                        >
                            <img
                                src="/images/icons/mail.png"
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                alt="mail"
                            />
                            Send Email
                        </button>

                        <button className="flex gap-1 items-center justify-center bg-none border border-[#717073] text-[#717073] px-2 py-2 rounded-xl  text-[16px]">
                            <img src='/images/icons/sendText.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                            Send Text
                        </button>
                        <button onClick={exportFreeTrials} className="flex gap-1 items-center justify-center bg-[#237FEA] text-white px-2 py-2 rounded-xl  text-[16px]">
                            <img src='/images/icons/download.png' className='w-4 h-4 sm:w-5 sm:h-5' alt="" />
                            Export Data
                        </button>
                    </div>


                </div>



            </div>

        </div >
    )
}

export default CancellationList