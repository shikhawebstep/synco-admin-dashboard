import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { showWarning, showConfirm, showError } from "../../../../../../utils/swalHelper";
import { format } from "date-fns";
import { evaluate } from "mathjs";
import PhoneInput from "react-phone-input-2";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { ChevronDown, ChevronUp, Info, CheckCircle2 } from "lucide-react";

import PlanTabs from "../PlanTabs";
import Loader from "../../../contexts/Loader";
import { useVenue } from "../../../contexts/VenueContext";
import { usePayments } from "../../../contexts/PaymentPlanContext";
import { useClassSchedule } from "../../../contexts/ClassScheduleContent";
import { useBookFreeTrial } from "../../../contexts/BookAFreeTrialContext";

import "react-datepicker/dist/react-datepicker.css";
import "react-phone-input-2/lib/style.css";
import { useMembers } from "../../../contexts/MemberContext";
import { useNotification } from "../../../contexts/NotificationContext";

const List = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createBookMembership, createBookMembershipByfreeTrial, createBookMembershipByWaitingList, isBooked, setIsBooked } = useBookFreeTrial()
    const [expression, setExpression] = useState('');
    const [numberOfStudents, setNumberOfStudents] = useState('1');
    const { keyInfoData, fetchKeyInfo } = useMembers();
    const token = localStorage.getItem("adminToken");
    const { adminInfo, setAdminInfo } = useNotification();
    const [country, setCountry] = useState("uk"); // default country
    const [country2, setCountry2] = useState("uk"); // default country
    const [dialCode, setDialCode] = useState("+44"); // store selected code silently
    const [dialCode2, setDialCode2] = useState("+44");
    const [calculatedAmount, setCalculatedAmount] = useState(0);
    const [remainingLessons, setRemainingLessons] = useState(0);
    const [loadingData, setLoadingData] = useState(false);
    const [pricingBreakdown, setPricingBreakdown] = useState({
        pricePerClassPerChild: 0,
        numberOfLessonsProRated: 0,
        costOfProRatedLessons: 0,
        joiningFee: 0,
        totalAmount: 0
    });

    // store selected code silently
    const handleChange = (value, data) => {
        // When library fires onChange, just update the dial code
        setDialCode("+" + data.dialCode);
    };
    const handleChange2 = (value, data) => {
        // When library fires onChange, just update the dial code
        setDialCode("+" + data.dialCode);
    };

    const handleCountryChange = (countryData) => {
        setCountry(countryData.countryCode);
        setDialCode2("+" + countryData.dialCode);
    };
    const handleCountryChange2 = (countryData) => {
        setCountry2(countryData.countryCode);
        setDialCode2("+" + countryData.dialCode);
    };

    const [isOpenMembership, setIsOpenMembership] = useState(false);
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

    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };
    const [result, setResult] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { classId, TrialData, comesFrom, from_lead, leadId } = location.state || {};
    const popup1Ref = useRef(null);
    const popup2Ref = useRef(null);
    const popup3Ref = useRef(null);
    const img3Ref = useRef(null); // add a ref for the image
    const img1Ref = useRef(null); // add a ref for the image
    const img2Ref = useRef(null); // add a ref for the image
    console.log('comesFrom', comesFrom)
    const [showPopup, setShowPopup] = useState(false);
    const [directDebitData, setDirectDebitData] = useState([]);
    const [payment, setPayment] = useState({
        paymentType: "accesspaysuite",

        firstName: "",
        lastName: "",
        email: "",
        price: '',
        addressLine1: "",
        addressLine2: "",
        city: "",
        postalCode: "",

        account_number: "",
        branch_code: "",
        account_holder_name: "",
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
    // console.log('TrialData', TrialData)
    // console.log('classId', classId)
    const { fetchFindClassID, singleClassSchedulesOnly, loading } = useClassSchedule() || {};
    const [students, setStudents] = useState([
        {
            studentFirstName: '',
            studentLastName: '',
            dateOfBirth: null,
            age: '',
            gender: '',
            medicalInformation: '',
            selectedClassId: null,
            selectedClassData: null
            // Add other fields if needed
        },
    ]);
    // console.log('singleClassSchedulesOnly', singleClassSchedulesOnly)
    const [emergency, setEmergency] = useState({
        sameAsAbove: false,
        emergencyFirstName: "",
        emergencyLastName: "",
        emergencyPhoneNumber: "",
        emergencyRelation: "",
    });
    const [parents, setParents] = useState([
        {
            id: Date.now(),
            parentFirstName: '',
            parentLastName: '',
            parentEmail: '',
            parentPhoneNumber: '',
            relationToChild: '',
            howDidYouHear: ''

        }
    ]);
    const finalClassId = classId || TrialData?.classScheduleId || TrialData?.students?.[0]?.classSchedule?.id;
    const allPaymentPlans =
        singleClassSchedulesOnly?.venue?.paymentGroups[0]?.paymentPlans?.map((plan) => ({
            label: `${plan.title} (${plan.students} student${plan.students > 1 ? "s" : ""})`,
            value: plan.id,
            joiningFee: plan.joiningFee,
            all: plan,
        })) || [];

    const paymentPlanOptions = numberOfStudents
        ? allPaymentPlans.filter((plan) => plan.all?.students === Number(numberOfStudents))
        : allPaymentPlans;
    console.log('singleClassSchedulesOnly', singleClassSchedulesOnly)


    const classesWithCapacity = Array.isArray(singleClassSchedulesOnly?.venueClasses) ? singleClassSchedulesOnly?.venueClasses?.filter((cls) => {
        return cls.capacity > 0;
    }) : [];
    const handleStudentClassChange = (index, selectedOption) => {
        const selectedClass = classesWithCapacity?.find(
            (cls) => cls.id === selectedOption.value
        );

        setStudents((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                selectedClassId: selectedOption.value,
                selectedClassData: selectedClass
            };
            return updated;
        });
    };
    const venueClassOptions = classesWithCapacity?.map((cls) => ({
        value: cls.id,
        label: cls.className
    }));
    const handleNumberChange = (e) => {
        const val = e.target.value === "" ? "" : Number(e.target.value);
        if (val === "" || [1, 2, 3].includes(val)) {
            setNumberOfStudents(val);

            // If currently selected plan doesn't match new number, reset it
            if (membershipPlan && membershipPlan.all?.students !== val) {
                setMembershipPlan(null);
            }
        }
    };

    const handlePlanChange = (plan) => {
        setMembershipPlan(plan);
        if (plan) {
            setNumberOfStudents(plan.all?.students); // Update numberOfStudents to match plan
        }
    };
    useEffect(() => {
        setStudents((prevStudents) => {
            const n = Number(numberOfStudents) || 0; // safety for null/undefined

            // If count increases → add new blank students
            if (n > prevStudents.length) {
                const newStudents = Array.from({ length: n - prevStudents.length }).map(() => ({
                    studentFirstName: '',
                    studentLastName: '',
                    dateOfBirth: null,
                    age: '',
                    gender: '',
                    medicalInformation: '',
                    class: singleClassSchedulesOnly?.className || '',
                    time: singleClassSchedulesOnly?.startTime || '',
                }));
                return [...prevStudents, ...newStudents];
            }

            // If count decreases → trim array
            if (n < prevStudents.length) {
                return prevStudents.slice(0, n);
            }

            // Same number → just return as is
            return prevStudents;
        });
    }, [numberOfStudents]);


    useEffect(() => {
        if (TrialData) {
            // console.log('stp1')
            if (Array.isArray(TrialData.students) && TrialData.students.length > 0) {
                // console.log('stp2')
                setStudents(TrialData.students);
                setNumberOfStudents(TrialData?.totalStudents);
                console.log('comesfromtrialdaata', TrialData)
            }
            // console.log('stp3')
            if (Array.isArray(TrialData.parents) && TrialData.parents.length > 0) {
                setParents(
                    TrialData.parents.map((p, idx) => ({
                        id: idx + 1,
                        ...p,
                    }))
                );
            }
            if (Array.isArray(TrialData.emergency) && TrialData.emergency.length > 0) {
                setEmergency({
                    sameAsAbove: false,
                    ...TrialData.emergency[0],
                });
            }
        }
    }, [TrialData]);
    // console.log('TrialData', students)

    useEffect(() => {
        if (!finalClassId) {
            navigate("/weekly-classes/find-a-class", { replace: true });
        }
    }, [finalClassId, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            if (finalClassId) {
                setIsBooked(false);
                await fetchFindClassID(finalClassId);
                await fetchKeyInfo();
                await fetchComments();
            }
        };
        fetchData();
    }, [finalClassId, fetchFindClassID, fetchKeyInfo]);
    const [activePopup, setActivePopup] = useState(null);
    const togglePopup = (id) => {
        setActivePopup((prev) => (prev === id ? null : id));
    };
    const [openForm, setOpenForm] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedPlans, setSelectedPlans] = useState([]);
    const [congestionNote, setCongestionNote] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [membershipPlan, setMembershipPlan] = useState(null);
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fromDate, setFromDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 11));
    const [toDate, setToDate] = useState(null);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const hasInitialized = useRef(false);


    const [clickedIcon, setClickedIcon] = useState(null);
    const [selectedKeyInfo, setSelectedKeyInfo] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const { venues, isEditVenue, setIsEditVenue, deleteVenue, fetchVenues } = useVenue() || {};
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const isAllSelected = venues.length > 0 && selectedUserIds.length === venues.length;
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedUserIds([]);
        } else {
            const allIds = venues.map((user) => user.id);
            setSelectedUserIds(allIds);
        }
    };
    const handleDelete = (id) => {
        showConfirm(
            'Are you sure?',
            'This action will permanently delete the venue.',
            'Yes, delete it!'
        ).then((result) => {
            if (result.isConfirmed) {
                // console.log('DeleteId:', id);

                deleteVenue(id); // Call your delete function here

            }
        });
    };
    const isCardInvalid =
        payment.paymentType === "accesspaysuite" &&
        (
            !payment.account_holder_name ||
            !payment.firstName ||
            !payment.email ||
            !payment.addressLine1 ||
            !payment.city ||
            !payment.postalCode ||
            !payment.account_number ||
            !payment.branch_code
        );

    const isBankInvalid =
        payment.paymentType === "bank" &&
        (
            !payment.account_holder_name ||
            !payment.firstName ||
            !payment.account_number ||
            !payment.branch_code
        );
    console.log('isCardInvalid', isCardInvalid)
    console.log('isBankInvalid', isBankInvalid)
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`; // e.g., "2025-08-10"
    };

    const getDaysArray = () => {
        const startDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        const offset = startDay === 0 ? 6 : startDay - 1;

        for (let i = 0; i < offset; i++) days.push(null);
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

    const isSameDate = (d1, d2) => {
        const date1 = typeof d1 === "string" ? new Date(d1) : d1;
        const date2 = typeof d2 === "string" ? new Date(d2) : d2;

        return (
            date1 &&
            date2 &&
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };
    const handleCancel = () => {
        showConfirm(
            "Are you sure?",
            "Your changes will not be saved!",
            "Yes, leave"
        ).then((result) => {
            if (result.isConfirmed) {
                navigate("/weekly-classes/find-a-class");
            }
        });
    };

    const handleDateClick = (date) => {
        const formattedDate = formatLocalDate(date); // safe from timezone issues

        if (selectedDate === formattedDate) {
            setSelectedDate(null);
            calculateAmount(null);
        } else {
            setSelectedDate(formattedDate);
            calculateAmount(formattedDate);
        }
    };

    const modalRef = useRef(null);
    const PRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            const activeRef = clickedIcon === "group" ? modalRef : PRef;

            if (
                activeRef.current &&
                !activeRef.current.contains(event.target)
            ) {
                setShowModal(false); // Close the modal
            }
        }

        if (showModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showModal, clickedIcon, setShowModal]);


    const allTermRanges = Array.isArray(congestionNote)
        ? congestionNote.flatMap(group =>
            group.terms.map(term => ({
                start: new Date(term.startDate),
                end: new Date(term.endDate),
                exclusions: (Array.isArray(term.exclusionDates)
                    ? term.exclusionDates
                    : JSON.parse(term.exclusionDates || '[]')
                ).map(date => new Date(date)),
            }))
        )
        : [];
    // or `null`, `undefined`, or any fallback value

    // Usage inside calendar cell:
    const isInRange = (date) => {
        return allTermRanges.some(({ start, end }) =>
            date >= start && date <= end
        );
    };

    const isExcluded = (date) => {
        return allTermRanges.some(({ exclusions }) =>
            exclusions.some(ex => ex.toDateString() === date?.toDateString())
        );
    };
    const [dob, setDob] = useState('');
    const [age, setAge] = useState(null);
    const [time, setTime] = useState('');
    const [phone, setPhone] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [sameAsAbove, setSameAsAbove] = useState(false);

    // 🔁 Calculate Age Automatically
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



    // 🔁 Sync Emergency Contact



    const handleInputChange = (index, field, value) => {
        const updatedStudents = [...students];
        updatedStudents[index][field] = value;
        setStudents(updatedStudents);
    };




    console.log('membershipPlan', membershipPlan)

    const handleAddParent = () => {
        setParents((prev) => [
            ...prev,
            {
                id: Date.now(),
                parentFirstName: '',
                parentLastName: '',
                parentEmail: '',
                parentPhoneNumber: '',
                relationToChild: '',
                howDidYouHear: ''
            },
        ]);
    };

    const handleRemoveParent = (id) => {
        setParents((prev) => prev.filter((p) => p.id !== id));
    };

    const handleStudentChange = (index, field, value) => {
        const updated = [...students];
        updated[index][field] = value;

        // Calculate age if dateOfBirth
        if (field === "dateOfBirth") {
            const birth = new Date(value);
            const today = new Date();
            updated[index].age = today.getFullYear() - birth.getFullYear();
        }

        setStudents(updated);
    };
    const handleParentChange = (index, field, value) => {
        const updated = [...parents];
        updated[index][field] = value;
        setParents(updated);
    };

    const handleEmergencyChange = (studentIndex, field, value) => {
        const updated = [...students];
        updated[studentIndex].emergency[field] = value;
        setStudents(updated);
    };

    const handleSameAsAbove = (studentIndex) => {
        const updated = [...students];
        const primaryParent = updated[studentIndex].parents[0];
        if (primaryParent) {
            updated[studentIndex].emergency = {
                parentFirstName: primaryParent.parentFirstName,
                parentLastName: primaryParent.parentLastName,
                parentPhoneNumber: primaryParent.parentPhoneNumber,
                relationToChild: primaryParent.relationToChild?.label || "",
                sameAsAbove: true
            };
        }
        setStudents(updated);
    };
    const handlePhoneChange = (index, value) => {
        const updated = [...parents];
        updated[index].phone = value;
        setParents(updated);
    };


    useEffect(() => {
        if (emergency.sameAsAbove && parents.length > 0) {
            const firstParent = parents[0];
            setEmergency(prev => ({
                ...prev,
                emergencyFirstName: firstParent.parentFirstName || "",
                emergencyLastName: firstParent.parentLastName || "",
                emergencyPhoneNumber: firstParent.parentPhoneNumber || "",
                emergencyRelation: firstParent.relationToChild || "", // or whatever default you want
            }));
        }
    }, [emergency.sameAsAbove, parents]);



    const toDateOnly = (date) => {
        if (!date) return null;
        const d = new Date(date);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        // PURE DATE, NO TIMEZONE CONVERSION POSSIBLE
        return `${year}-${month}-${day}`;
    };
    const handleSubmit = async () => {
        if (!selectedDate) {
            showWarning("Trial Date Required", "Please select a trial date before submitting.");
            return;
        }

        const filteredPayment = Object.fromEntries(
            Object.entries(payment || {}).filter(
                ([, value]) => value !== null && value !== "" && value !== undefined
            )
        );

        // Transform payment fields
        const transformedPayment = { ...filteredPayment };

        // Handle expiry date
        if (transformedPayment.expiryDate || transformedPayment["expiry date"]) {
            const rawExpiry =
                transformedPayment.expiryDate || transformedPayment["expiry date"];
            transformedPayment.expiryDate = rawExpiry.replace("/", ""); // "12/12" -> "1212"
            delete transformedPayment["expiry date"]; // remove old key if exists
        }

        // Handle PAN
        if (transformedPayment.pan) {
            transformedPayment.pan = transformedPayment.pan.replace(/\s+/g, ""); // remove spaces
        }


        const missingClass = students.some(
            (s, i) => i !== 0 && !s.selectedClassData && !s?.classSchedule?.id
        );

        console.log('missingClass', students)

        if (missingClass) {
            showWarning("Class Required", "Please select class for all students");
            return;
        }
        setIsSubmitting(true);
        const amountToSend = calculateAmount(selectedDate);
        const payload = {
            venueId: singleClassSchedulesOnly?.venue?.id,

            startDate: selectedDate,
            totalStudents: students.length,
            keyInformation: selectedKeyInfo,

            students: students.map((s, index) => ({
                ...s,
                dateOfBirth: toDateOnly(s.dateOfBirth),
                classScheduleId:
                    index === 0 || comesFrom
                        ? singleClassSchedulesOnly?.id
                        : s.selectedClassData?.id
            })),

            parents: parents.map(({ id, ...rest }) => rest),

            emergency,

            paymentPlanId: membershipPlan?.value ?? null,

            ...(Object.keys(filteredPayment).length > 0 && {
                payment: {
                    ...filteredPayment,
                    price: pricingBreakdown.totalAmount, // ✅ added here
                }
            }),
        };

        console.log('payload', payload)

        try {
            if (comesFrom === "trials") {
                await createBookMembershipByfreeTrial(payload, TrialData.id);
            }
            else if (comesFrom === "waitingList") {
                await createBookMembershipByWaitingList(payload, TrialData.id);
            }
            else if (leadId) {
                await createBookMembership(payload, leadId);
            }
            else {
                await createBookMembership(payload);
            }
            setIsBooked(true);

        } catch (error) {
            console.error("Error while submitting:", error);
        } finally {
            setIsSubmitting(false);
        }

        // console.log("Final Payload:", JSON.stringify(payload, null, 2));
        // send to API with fetch/axios
    };

    const handleClick = (val) => {
        if (val === 'AC') {
            setExpression('');
            setResult('');
        } else if (val === '⌫') {
            setExpression((prev) => prev.slice(0, -1));
        } else if (val === '=') {
            try {
                const replacedExpr = expression
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/−/g, '-');
                const evalResult = evaluate(replacedExpr);
                setResult(evalResult.toLocaleString());
            } catch {
                setResult('Error');
            }
        } else if (val === '±') {
            if (result) {
                const toggled = parseFloat(result.replace(/,/g, '')) * -1;
                setExpression(toggled.toString());
                setResult(toggled.toLocaleString());
            } else if (expression) {
                // Match the last number in expression
                const match = expression.match(/(-?\d+\.?\d*)$/);
                if (match) {
                    const number = match[0];
                    const toggled = parseFloat(number) * -1;
                    setExpression((prev) =>
                        prev.replace(new RegExp(`${number}$`), toggled.toString())
                    );
                }
            }
        } else {
            setExpression((prev) => prev + val);
            setResult('');
        }
    };
    const renderExpression = () => {
        const tokens = expression.split(/([+\u2212×÷%])/g); // \u2212 is the unicode minus (−)
        return tokens.map((token, i) => {
            const isOperator = ['+', '−', '×', '÷', '%'].includes(token);
            return (
                <span key={i} className={isOperator ? 'text-[#F94D5C]' : ''}>
                    {token || 0}
                </span>
            );
        });
    };
    const handleClickOutside = (e) => {
        if (
            (activePopup === 1 && popup1Ref.current && !popup1Ref.current.contains(e.target) && img1Ref.current && !img1Ref.current.contains(e.target)) ||
            (activePopup === 2 && popup2Ref.current && !popup2Ref.current.contains(e.target) && img2Ref.current && !img2Ref.current.contains(e.target)) ||
            (activePopup === 3 && popup3Ref.current && !popup3Ref.current.contains(e.target) && img3Ref.current && !img3Ref.current.contains(e.target))
        ) {
            togglePopup(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activePopup]);
    useEffect(() => {
        if (singleClassSchedulesOnly?.venue?.paymentGroups?.length > 0) {
            const cleanedPlans = singleClassSchedulesOnly.venue.paymentGroups[0].paymentPlans.map(plan => ({
                id: plan.id,
                title: plan.title,
                price: plan.price,
                interval: plan.interval,
                students: plan.students,
                duration: plan.duration,
                joiningFee: plan.joiningFee,
                holidayCampPackage: plan.HolidayCampPackage,
                termsAndCondition: plan.termsAndCondition,
            }));
            // console.log('cleanedPlans', cleanedPlans);
            setSelectedPlans(cleanedPlans);
        } else {
            // console.log('cleanedPlans not found');
        }
    }, [singleClassSchedulesOnly]);

    // ✅ now it runs when data is fetched


    const buttons = [
        ['AC', '±', '%', '÷',],
        ["7", "8", "9", "×"],
        ["4", "5", "6", "−"],
        ["1", "2", "3", "+"],
        ["", "0", ".", "="],

    ];
    const relationOptions = [
        { value: "Mother", label: "Mother" },
        { value: "Father", label: "Father" },
        { value: "Guardian", label: "Guardian" },
    ];

    const hearOptions = [
        { value: "Google", label: "Google" },
        { value: "Facebook", label: "Facebook" },
        { value: "Instagram", label: "Instagram" },
        { value: "Friend", label: "Friend" },
        { value: "Flyer", label: "Flyer" },
    ];




    const fetchComments = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/list`, {
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
            showError(
                error.message || error.error || "Failed to fetch comments. Please try again later."
            );

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
            setLoadingComment(true);


            const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/create`, requestOptions);

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
    function stripHtml(html) {
        if (!html) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || "";
    }

    function htmlToHtmlArray(html) {
        if (!html) return [];
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        // 1. Try to find explicit list items and keep their inner HTML
        const liItems = Array.from(tempDiv.querySelectorAll("li"))
            .map(li => li.innerHTML.trim())
            .filter(h => h !== "");
        if (liItems.length > 0) return liItems;

        // 2. Try to split by common block elements
        const blockItems = Array.from(tempDiv.querySelectorAll("p, div"))
            .map(p => p.innerHTML.trim())
            .filter(h => h !== "");
        if (blockItems.length > 0) return blockItems;

        // 3. Fallback: split by newlines if it's just raw text
        const plainText = tempDiv.innerHTML.trim();
        if (plainText) {
            return plainText.split(/\n+/).map(t => t.trim()).filter(t => t !== "");
        }

        return [];
    }

    // Extract membership key info items
    const membershipKeyInfo = Array.isArray(keyInfoData)
        ? keyInfoData.find(item => item.serviceType === 'membership')?.keyInformationRaw
        : keyInfoData?.keyInformationRaw;

    console.log('membershipKeyInfo', membershipKeyInfo)

    const keyInfoArray = htmlToHtmlArray(membershipKeyInfo);

    // Map into dynamic options preserving HTML
    const keyInfoOptions = keyInfoArray.map((item) => ({
        value: item,
        label: item,
    }));

    console.log("keyInfoOptions", membershipKeyInfo)

    const genderOptions = [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
    ];
    const sessionDates = singleClassSchedulesOnly?.venue?.termGroups?.flatMap(group =>
        group.terms.flatMap(term =>
            term.sessionsMap.map(s => s.sessionDate)
        )
    ) || [];

    // console.log('keyInfoData', keyInfoData)
    const selectedLabel =
        keyInfoOptions.find((opt) => opt.value === selectedKeyInfo)?.label ||
        "Key Information";


    const sessionDatesSet = new Set(sessionDates);
    useEffect(() => {
        // Run only once, and only if there are session dates
        if (hasInitialized.current || !sessionDatesSet || sessionDatesSet.size === 0) return;

        const allDates = Array.from(sessionDatesSet)
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a - b);

        const earliestDate = allDates[0];

        setCurrentDate(
            new Date(
                earliestDate.getFullYear(),
                earliestDate.getMonth(),
                1
            )
        );

        hasInitialized.current = true; // ✅ mark as done
    }, [sessionDatesSet]);
    const calculateAmount = (startDate) => {
        if (!membershipPlan || !startDate) return;

        const pricePerLesson = membershipPlan.all?.priceLesson; // price per class per child
        const joiningFee = membershipPlan.all?.joiningFee;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selected = new Date(startDate);
        selected.setHours(0, 0, 0, 0);

        // 1️⃣ All available + future sessions
        const availableSessions = calendarDays
            .filter(Boolean)
            .map(d => new Date(d))
            .filter(d => {
                d.setHours(0, 0, 0, 0);
                const formatted = formatLocalDate(d);
                return sessionDatesSet.has(formatted) && d >= today;
            });

        // 2️⃣ Pro-rated lessons (from selected start date)
        const proRatedSessions = availableSessions.filter(d => d >= selected);

        const numberOfLessons = proRatedSessions.length;
        const costOfProRatedLessons = numberOfLessons * pricePerLesson;

        const totalAmount = costOfProRatedLessons + joiningFee;

        setRemainingLessons(numberOfLessons);
        setCalculatedAmount(totalAmount);

        // OPTIONAL: if you want all values separately
        setPricingBreakdown({
            pricePerClassPerChild: pricePerLesson,
            numberOfLessonsProRated: numberOfLessons,
            costOfProRatedLessons,
            joiningFee,
            totalAmount
        });
        return totalAmount;
    };


    const renderContent = (content) => {
        return (
            <div
                className="text-gray-800 prose prose-blue max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    };

    console.log('payment', payment)
    console.log('membershipPlan', membershipPlan)
    console.log('calendarDays', calendarDays)

    if (loading) return <Loader />;

    return (
        <div className="pt-1 bg-gray-50 min-h-screen">
            <div className={`flex pe-4 justify-between items-center mb-4 ${openForm ? 'md:w-3/4' : 'w-full'}`}>

                <h2 onClick={() => {
                    if (comesFrom && comesFrom.toLowerCase() === "trials") {
                        navigate("/weekly-classes/trial/list");
                    } else if (from_lead === "yes") {
                        navigate("/weekly-classes/central-leads");
                    } else if (from_lead === "leadDatabase") {
                        navigate("/weekly-classes/central-leads");
                    }
                    else {
                        navigate("/weekly-classes/find-a-class");
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
                        Book a Membership
                    </span>
                </h2>
                <div className="flex gap-3 relative items-center">
                    <img
                        ref={img1Ref}
                        src="/members/booktrial1.png"
                        className={` rounded-full  hover:bg-[#0DD180] transition cursor-pointer ${activePopup === 1 ? 'bg-[#0DD180]' : 'bg-gray-700'} `}
                        onClick={() => togglePopup(1)}
                    />
                    {activePopup === 1 && (
                        <div ref={popup1Ref} className="  absolute min-w-[850px] bg-opacity-30 flex right-2 items-center top-15 justify-center z-50">
                            <div className="flex items-center justify-center w-full px-2 py-6 sm:px-2 md:py-2">
                                <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E1E5] pb-4 mb-4 gap-2">
                                        <h2 className="font-semibold text-[20px] sm:text-[24px]">Payment Plan Preview</h2>
                                        <button className="text-gray-400 hover:text-black text-xl font-bold">
                                            <img src="/images/icons/cross.png" onClick={() => togglePopup(null)} alt="close" className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <PlanTabs selectedPlans={selectedPlans} />
                                </div>
                            </div>
                        </div>
                    )}
                    <img
                        ref={img2Ref}
                        onClick={() => togglePopup(2)}
                        src="/members/booktrial2.png"
                        className={` rounded-full  hover:bg-[#0DD180] transition cursor-pointer ${activePopup === 2 ? 'bg-[#0DD180]' : 'bg-gray-700'} `}
                        alt=""
                    />
                    {activePopup === 2 && (
                        <div ref={popup2Ref} className="absolute right-0 top-20 z-50 flex items-center justify-center min-w-[320px]">
                            <div className="bg-[#464C55] rounded-2xl p-4 w-[468px] shadow-2xl text-white">
                                {/* Display */}
                                <div className="text-right min-h-[80px] mb-4">
                                    <div className="text-[24px] text-gray-300 break-words">
                                        {renderExpression()}

                                    </div>
                                    <div className="text-[56px] font-bold text-white leading-snug">
                                        {result !== "" && result}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="grid grid-cols-4 gap-3">
                                    {buttons.flat().map((btn, i) => {
                                        const isOperator = ['÷', '±', '×', '−', '+', '%', '=', 'AC'].includes(btn);
                                        const iconMap = {
                                            '÷': '/calcIcons/divide.png',
                                            '%': '/calcIcons/percentage.png',
                                            '⌫': '/calcIcons/np.png',
                                            '×': '/calcIcons/multiply.png',
                                            '−': '/calcIcons/sub.png',
                                            '+': '/calcIcons/add.png',
                                            '=': '/calcIcons/equal.png',
                                            '±': '/calcIcons/NP.png',
                                        };

                                        const showRed = ['+', '−', '×', '÷', '%'].includes(btn) && expression.includes(btn);

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => btn && handleClick(btn)}
                                                className={`
                py-4 rounded-2xl text-[36px] font-semibold flex items-center justify-center h-16 transition-all duration-150
                ${isOperator ? 'bg-[#81858B] text-white' : 'bg-white text-black hover:bg-gray-100'}
                ${showRed ? 'text-[#F94D5C]' : ''}
                ${btn === '' ? 'opacity-0 pointer-events-none' : ''}
            `}
                                            >
                                                {iconMap[btn] ? (
                                                    <img src={iconMap[btn]} alt={btn} className="w-5 h-5 object-contain" />
                                                ) : (
                                                    btn
                                                )}
                                            </button>
                                        );
                                    })}

                                </div>

                            </div>
                        </div>

                    )}




                    <img ref={img3Ref}

                        src="/members/booktrial3.png"
                        alt=""
                        onClick={() => togglePopup(3)}
                        className={`rounded-full hover:bg-[#0DD180] transition cursor-pointer ${activePopup === 3 ? 'bg-[#0DD180]' : 'bg-gray-700'}`}
                    />
                    {activePopup === 3 && (
                        <div
                            ref={popup3Ref}
                            className="absolute top-full z-50 mt-2 right-0 w-[300px] p-4 bg-white rounded-2xl shadow-lg text-sm text-gray-700"
                        >
                            <div className="font-semibold mb-2 text-[18px]">Phone Script</div>
                            <textarea
                                readOnly
                                className="w-full min-h-[100px] resize-none text-[16px] leading-relaxed bg-transparent focus:outline-none"
                                defaultValue="In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface."
                            />
                        </div>
                    )}

                </div>
            </div>
            <div className="md:flex w-full gap-4">
                <div className="md:min-w-[508px] md:max-w-[508px] text-base space-y-5">
                    {/* Search */}
                    <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm ">
                        <h2 className="text-[24px] font-semibold">   Information</h2>
                        <div className="">
                            <label htmlFor="" className="text-base font-semibold">Venue</label>
                            <div className="relative mt-2 ">
                                <input
                                    type="text"
                                    placeholder="Select venue"
                                    value={singleClassSchedulesOnly?.venue?.name}
                                    readOnly
                                    className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"

                                />
                                <FiSearch className="absolute left-3 top-4 text-[20px]" />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label htmlFor="" className="text-base font-semibold">Number of students</label>
                            <div className="relative mt-2 ">

                                <input
                                    type="number"
                                    value={numberOfStudents}
                                    onChange={handleNumberChange}
                                    placeholder="Choose number of students"
                                    className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 focus:outline-none"
                                />

                            </div>
                        </div>
                        <div className="mb-5">
                            <label htmlFor="" className="text-base font-semibold">Membership Plan </label>
                            <div className="relative mt-2 ">

                                <Select
                                    options={paymentPlanOptions}
                                    value={membershipPlan}
                                    onChange={handlePlanChange}
                                    placeholder="Choose Plan"
                                    className="mt-2"
                                    classNamePrefix="react-select"
                                    isClearable
                                    isDisabled={!numberOfStudents}
                                />

                            </div>
                        </div>
                        <div className="mb-5">
                            <label htmlFor="" className="text-base font-semibold">Joining Fee</label>
                            <div className="relative mt-2 ">
                                <input
                                    type="text"
                                    placeholder="Choose Joining fee"
                                    value={membershipPlan?.joiningFee != null ? `£${membershipPlan?.joiningFee}` : ""}
                                    readOnly
                                    className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3  focus:outline-none"
                                />
                                {/* <Select
                                    options={[{ label: "None", value: "none" }]} // Replace with your relationOptions
                                    value={null}
                                    onChange={() => { }}
                                    placeholder="Choose Joining fee"
                                    className="mt-2"
                                    classNamePrefix="react-select"
                                /> */}

                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm ">
                        <div className="">
                            <h2 className="text-[24px] font-semibold">Select start date </h2>
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
                                <div className="flex flex-col gap-1">
                                    {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                                        const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);

                                        return (
                                            <div
                                                key={weekIndex}
                                                className="grid grid-cols-7 text-[18px] gap-1 py-1 rounded"
                                            >
                                                {week.map((date, i) => {
                                                    if (!date) {
                                                        return <div key={i} />;
                                                    }

                                                    const formattedDate = formatLocalDate(date);
                                                    const isAvailable = sessionDatesSet.has(formattedDate); // check if this date is valid session
                                                    console.log('isAvailable', isAvailable)
                                                    const isSelected = isSameDate(date, selectedDate);
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);

                                                    const current = new Date(date);
                                                    current.setHours(0, 0, 0, 0);
                                                    const isPastAvailable = isAvailable && current < today;

                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => isAvailable && handleDateClick(date)}
                                                            className={`w-8 h-8 flex text-[18px] items-center justify-center mx-auto text-base rounded-full
    ${isPastAvailable
                                                                    ? "bg-red-200 text-red-700 cursor-not-allowed"
                                                                    : isAvailable
                                                                        ? "cursor-pointer bg-sky-200"
                                                                        : "cursor-not-allowed opacity-40 bg-white"
                                                                }
    ${isSelected ? "selectedDate text-white font-bold" : ""}
  `}
                                                        >
                                                            {date.getDate()}
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

                    <div className="w-full max-w-xl mx-auto">
                        <button
                            type="button"
                            disabled={!membershipPlan}
                            onClick={() => setIsOpenMembership(!isOpenMembership)}
                            className={`bg-[#237FEA] text-white text-[18px]  font-semibold border w-full border-[#237FEA] px-6 py-3 rounded-lg flex items-center justify-center  ${membershipPlan
                                ? "bg-[#237FEA] border border-[#237FEA]"
                                : "bg-gray-400 border-gray-400 cursor-not-allowed"
                                }`}
                        >
                            Membership Plan Breakdown

                            <img
                                src={isOpenMembership ? "/members/dash.png" : "/members/add.png"}
                                alt={isOpenMembership ? "Collapse" : "Expand"}
                                className="ml-2 w-5 h-5 inline-block"
                            />

                        </button>

                        {isOpenMembership && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white mt-4 rounded-2xl shadow p-6   font-semibold  space-y-4 text-[16px]"
                            >
                                {/* <div className="mt-4 space-y-1 text-sm">
                                    <p>Remaining Lessons: <b>{remainingLessons}</b></p>
                                    <p>Joining Fee: <b>₹{membershipPlan?.all?.joiningFee}</b></p>
                                    <p className="text-lg font-bold">
                                        Total Amount: ₹{calculatedAmount}
                                    </p>
                                </div> */}
                                <div className="flex justify-between text-[#333]">
                                    <span>Membership Plan</span>
                                    <span>
                                        {membershipPlan?.all?.duration} {membershipPlan?.all?.interval}
                                        {membershipPlan?.all?.duration > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#333]">
                                    <span>Monthly Subscription Fee</span>
                                    <span>£{membershipPlan?.all?.priceLesson} p/m</span>
                                </div>
                                <div className="flex justify-between text-[#333]">
                                    <span>One-off Joining Fee</span>
                                    <span>£{membershipPlan?.all?.joiningFee}</span>
                                </div>
                                <div className="flex justify-between text-[#333]">
                                    <span>Number of lessons pro-rated</span>
                                    <span>{pricingBreakdown.numberOfLessonsProRated}</span>
                                </div>
                                <div className="flex justify-between text-[#333]">
                                    <span>Price per class per child</span>
                                    <span>£{pricingBreakdown.pricePerClassPerChild}</span>
                                </div>
                                <div className="flex justify-between text-[#000]">
                                    <span>Cost of pro-rated lessons</span>
                                    <span>£{pricingBreakdown.costOfProRatedLessons}</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-white transition-all duration-300">
                    <div className="max-w-full mx-auto bg-[#f9f9f9] px-6 ">

                        <div className="space-y-10">
                            {students.map((student, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="bg-white p-6 rounded-3xl shadow-sm space-y-6"
                                >
                                    <h2 className="text-[20px] font-semibold">
                                        Student {index > 0 ? `${index + 1} ` : ''}Information
                                    </h2>

                                    {/* Row 1 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">First name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter first name"
                                                value={student.studentFirstName}
                                                onChange={(e) =>
                                                    handleInputChange(index, 'studentFirstName', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Last name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter last name"
                                                value={student.studentLastName}
                                                onChange={(e) =>
                                                    handleInputChange(index, 'studentLastName', e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">
                                                Date of Birth
                                            </label>
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
                                                minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))} // Max age: 100 years
                                                placeholderText="Select date of birth"

                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Age</label>
                                            <input
                                                type="text"
                                                value={student.age}
                                                readOnly
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Automatic entry"
                                            />
                                        </div>
                                    </div>


                                    {/* Row 3 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Gender</label>

                                            <Select
                                                className="w-full mt-2 text-base"
                                                classNamePrefix="react-select"
                                                placeholder="Select gender"
                                                value={genderOptions.find((option) => option.value === student.gender) || null}
                                                onChange={(selectedOption) =>
                                                    handleInputChange(index, "gender", selectedOption ? selectedOption.value : "")
                                                }

                                                options={genderOptions}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">
                                                Medical information
                                            </label>

                                            <input
                                                type="text"
                                                placeholder="Enter medical info"
                                                value={student.medicalInformation || ""}
                                                onChange={(e) => handleInputChange(index, "medicalInformation", e.target.value)}
                                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />

                                        </div>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="flex gap-4">

                                        {/* CLASS */}
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Class</label>

                                            {index === 0 || comesFrom ? (
                                                <input
                                                    type="text"
                                                    value={singleClassSchedulesOnly?.className || ""}
                                                    readOnly
                                                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3"
                                                />
                                            ) : (
                                                <Select
                                                    className="w-full mt-2 text-base"
                                                    classNamePrefix="react-select"
                                                    placeholder="Select class"
                                                    options={venueClassOptions}
                                                    value={
                                                        venueClassOptions.find(
                                                            (opt) => opt.value === student.selectedClassId
                                                        ) || null
                                                    }
                                                    onChange={(option) =>
                                                        handleStudentClassChange(index, option)
                                                    }
                                                />
                                            )}
                                        </div>

                                        {/* TIME */}
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Time</label>

                                            <input
                                                type="text"
                                                readOnly
                                                value={
                                                    index === 0 || comesFrom
                                                        ? `${singleClassSchedulesOnly?.startTime || ""} - ${singleClassSchedulesOnly?.endTime || ""}`
                                                        : student.selectedClassData
                                                            ? `${student.selectedClassData.startTime} - ${student.selectedClassData.endTime}`
                                                            : ""
                                                }
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3"
                                                placeholder="Automatic entry"
                                            />
                                        </div>

                                    </div>


                                </motion.div>
                            ))}
                        </div>

                        <div className="space-y-6 ">
                            {parents.map((parent, index) => (
                                <motion.div
                                    key={parent.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className={`bg-white mb-10 p-6 rounded-3xl shadow-sm space-y-6 relative ${students.length < 1 ? "" : "mt-10"
                                        }`}
                                >
                                    {/* Top Header Row */}
                                    <div className="flex justify-between  items-start">
                                        <h2 className="text-[20px] font-semibold">
                                            {index === 0
                                                ? "Parent information"
                                                : `Parent ${index + 1} information`}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            {index === 0 && (
                                                <button
                                                    onClick={handleAddParent}
                                                    disabled={parents.length >= 3}
                                                    className="text-white text-[14px] px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    Add Parent
                                                </button>
                                            )}
                                            {index > 0 && (
                                                <button
                                                    onClick={() => handleRemoveParent(parent.id)}
                                                    className="text-gray-500 hover:text-red-600"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 1 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">First name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter first name"
                                                value={parent.parentFirstName}
                                                onChange={(e) => {
                                                    // Allow only alphabets and spaces
                                                    const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                                    handleParentChange(index, "parentFirstName", value);
                                                }}
                                                onKeyPress={(e) => {
                                                    if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault(); // block numbers & special chars
                                                }}
                                            />
                                        </div>

                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Last name</label>
                                            <input
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter last name"
                                                value={parent.parentLastName}
                                                onChange={(e) => {
                                                    // Allow only alphabets and spaces
                                                    const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                                    handleParentChange(index, "parentLastName", value);
                                                }}
                                                onKeyPress={(e) => {
                                                    if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault(); // block numbers & special chars
                                                }}
                                            />
                                        </div>
                                    </div>


                                    {/* Row 2 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Email</label>
                                            <input
                                                type="email"
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                placeholder="Enter email address"
                                                value={parent.parentEmail}
                                                onChange={(e) => handleParentChange(index, "parentEmail", e.target.value)}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Phone number</label>
                                            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2">
                                                {/* Flag Dropdown */}
                                                <PhoneInput
                                                    country="uk"
                                                    value={dialCode2}
                                                    onChange={handleChange2}
                                                    onCountryChange={handleCountryChange2}
                                                    disableDropdown={true}
                                                    disableCountryCode={true}
                                                    countryCodeEditable={false}
                                                    inputStyle={{
                                                        width: "0px",
                                                        maxWidth: '20px',
                                                        height: "0px",
                                                        opacity: 0,
                                                        pointerEvents: "none", // ✅ prevents blocking typing
                                                        position: "absolute",
                                                    }}
                                                    buttonClass="!bg-white !border-none !p-0"
                                                />
                                                <input

                                                    type="number"
                                                    value={parent.parentPhoneNumber}
                                                    onChange={(e) =>
                                                        handleParentChange(index, "parentPhoneNumber", e.target.value)
                                                    }
                                                    placeholder="Enter phone number"
                                                    className='border-none w-full focus:outline-none'
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">Relation to child</label>
                                            <Select
                                                options={relationOptions}
                                                placeholder="Select Relation"
                                                className="mt-2"
                                                classNamePrefix="react-select"
                                                value={relationOptions.find((o) => o.value === parent.relationToChild)}
                                                onChange={(selected) =>
                                                    handleParentChange(index, "relationToChild", selected.value)
                                                }
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-[16px] font-semibold">How did you hear about us?</label>
                                            <Select
                                                options={hearOptions}
                                                placeholder="Select from drop down"
                                                className="mt-2"
                                                classNamePrefix="react-select"
                                                value={hearOptions.find((o) => o.value === parent.howDidYouHear)}
                                                onChange={(selected) =>
                                                    handleParentChange(index, "howDidYouHear", selected.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-6">
                            <h2 className="text-[20px] font-semibold">Emergency contact details</h2>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={emergency.sameAsAbove}
                                    onChange={() =>
                                        setEmergency(prev => ({
                                            ...prev,
                                            sameAsAbove: !prev.sameAsAbove
                                        }))
                                    }
                                />
                                <label className="text-base font-semibold text-gray-700">
                                    Fill same as above
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">First name</label>
                                    <input
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        placeholder="Enter first name"
                                        value={emergency.emergencyFirstName}
                                        onChange={e =>
                                            setEmergency(prev => ({
                                                ...prev,
                                                emergencyFirstName: e.target.value
                                            }))
                                        }
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Last name</label>
                                    <input
                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                        placeholder="Enter last name"
                                        value={emergency.emergencyLastName}
                                        onChange={e =>
                                            setEmergency(prev => ({
                                                ...prev,
                                                emergencyLastName: e.target.value
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Phone number</label>
                                    <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2">
                                        {/* Flag Dropdown */}
                                        <PhoneInput
                                            country="uk"
                                            value={dialCode}
                                            onChange={handleChange}
                                            onCountryChange={handleCountryChange}
                                            disableDropdown={true}
                                            disableCountryCode={true}
                                            countryCodeEditable={false}
                                            inputStyle={{
                                                width: "0px",
                                                maxWidth: '20px',
                                                height: "0px",
                                                opacity: 0,
                                                pointerEvents: "none", // ✅ prevents blocking typing
                                                position: "absolute",
                                            }}
                                            buttonClass="!bg-white !border-none !p-0"
                                        />
                                        <input
                                            type="number"
                                            value={emergency.emergencyPhoneNumber}
                                            onChange={(e) =>
                                                setEmergency((prev) => ({
                                                    ...prev,
                                                    emergencyPhoneNumber: e.target.value,
                                                }))
                                            }
                                            className='border-none w-full focus:outline-none' placeholder="Enter phone number"
                                        />

                                    </div>
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-[16px] font-semibold">Relation to child</label>
                                    <Select
                                        options={relationOptions}
                                        value={relationOptions.find(option => option.value === emergency.emergencyRelation)}
                                        onChange={selectedOption =>
                                            setEmergency(prev => ({
                                                ...prev,
                                                emergencyRelation: selectedOption?.value || ""
                                            }))
                                        }
                                        placeholder="Select Relation"
                                        className="mt-2"
                                        classNamePrefix="react-select"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Premium Key Information Accordion */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full my-10 bg-white border border-blue-100 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full flex items-center justify-between p-8 hover:bg-blue-50/30 transition-colors duration-300 relative overflow-hidden group"
                            >
                                {/* Decorative background element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-500" />

                                <div className="flex items-center gap-3 relative text-left">
                                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                                        <Info className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-[24px] font-bold text-gray-900 leading-tight">Key Information</h2>
                                </div>

                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                    </motion.div>
                                </div>
                            </button>

                            {/* Accordion Content */}
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                    >
                                        <div className="p-8 pt-0 relative border-t border-gray-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative pt-6">
                                                {membershipKeyInfo ? (
                                                    renderContent(JSON.parse(membershipKeyInfo))

                                                ) : (
                                                    <div className="text-gray-500 italic py-4 col-span-2 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                        No key information available for this service.
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>


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
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-[16px] font-semibold outline-none"
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

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleCancel}

                                type="button"
                                className="flex items-center justify-center gap-1 border border-[#717073] text-[#717073] px-12 text-[18px]  py-2 rounded-lg font-semibold bg-none"
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={() => {
                                    if (!membershipPlan || !selectedDate) {
                                        let msg = "";
                                        if (!membershipPlan && !selectedDate) msg = "Please select Membership Plan and  Date";
                                        else if (!membershipPlan) msg = "Please select Membership Plan";
                                        else if (!selectedDate) msg = "Please select  Date";

                                        showError("Required Fields", msg);

                                        return;
                                    }

                                    // If both are selected, proceed
                                    setShowPopup(true);
                                }}
                                className={`text-white font-semibold text-[18px] px-6 py-3 rounded-lg ${isBooked
                                    ? "bg-green-600 border-green-600 cursor-default"
                                    : isSubmitting || membershipPlan && selectedDate
                                        ? "bg-[#237FEA] border border-[#237FEA]"
                                        : "bg-gray-400 border-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                {isBooked
                                    ? "Booked" : isSubmitting ? "Submitting..." : "Setup Direct Debit"}
                            </button>


                        </div>

                        {showPopup && (
                            <div className="fixed inset-0 bg-[#00000066] flex justify-center items-center z-50">
                                <div className="bg-white rounded-2xl max-w-[541px] min-w-[541px] max-h-[90%] overflow-y-scroll space-y-6 relative scrollbar-hide">
                                    <button
                                        className="absolute top-3 p-6 left-4 text-xl font-bold"
                                        onClick={() => setShowPopup(false)}
                                    >
                                        <img src="/images/icons/cross.png" alt="Close" />
                                    </button>

                                    <div className="text-center">
                                        <h2 className="font-semibold  text-[24px] mb-2 py-6  border-b border-gray-400 ">Direct Debit Details</h2>

                                    </div>
                                    <div className="text-left directDebitBg p-6 mb-4 m-6 rounded-2xl ">
                                        <p className="text-white text-[16px]">{membershipPlan?.label || ''}</p>
                                        <p className="font-bold text-white text-[24px]">
                                            £{pricingBreakdown.costOfProRatedLessons}
                                            <sup className="text-[12px] ml-1">(Price per lesson)</sup>
                                            {" + "}
                                            £{membershipPlan?.all?.joiningFee}
                                            <sup className="text-[12px] ml-1">(Joining Fee)</sup>
                                            {" = "}
                                            £{calculatedAmount}
                                        </p>

                                    </div>
                                    <div className="space-y-2 px-6 pb-6">

                                        {/* ================= Personal Details ================= */}
                                        <h3 className="font-semibold text-[20px]">Personal Details</h3>

                                        <div>
                                            <label className="block text-[16px] font-semibold">Email address</label>
                                            <input
                                                type="email"
                                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                value={payment.email}
                                                onChange={(e) => setPayment({ ...payment, email: e.target.value })}
                                            />
                                        </div>

                                        {/* ================= Payment Type ================= */}
                                        <h3 className="font-semibold text-[20px] pt-2">Bank Details</h3>

                                        <div className="flex gap-6 mt-3">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="paymentType"
                                                    value="bank"
                                                    checked={payment.paymentType === "bank"}
                                                    onChange={(e) => setPayment({ ...payment, paymentType: e.target.value })}
                                                />
                                                <span>Gocardless</span>
                                            </label>

                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="paymentType"
                                                    value="accesspaysuite"
                                                    checked={payment.paymentType === "accesspaysuite"}
                                                    onChange={(e) => setPayment({ ...payment, paymentType: e.target.value })}
                                                />
                                                <span>Access Pay Suite</span>
                                            </label>
                                        </div>

                                        {/* ================= BANK (GOCARDLESS) ================= */}
                                        {payment.paymentType === "bank" && (
                                            <div className="mt-4 space-y-4">

                                                {/* Account Holder Name (AUTO SPLIT) */}
                                                <div>
                                                    <label className="block text-[16px] font-semibold">Account Holder Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter full name (e.g. Saroj Singh)"
                                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        value={payment.account_holder_name}
                                                        onChange={(e) => {
                                                            const fullName = e.target.value;
                                                            const parts = fullName.trim().split(" ");

                                                            setPayment({
                                                                ...payment,
                                                                account_holder_name: fullName,
                                                                firstName: parts[0] || "",
                                                                lastName: parts.slice(1).join(" "),
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[16px] font-semibold">Account Number</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="Enter account number"
                                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                            value={payment.account_number}
                                                            onChange={(e) =>
                                                                setPayment({
                                                                    ...payment,
                                                                    account_number: e.target.value.replace(/\D/g, ""),
                                                                })
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[16px] font-semibold">Sort Code</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="Enter Sort code"
                                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                            value={payment.branch_code}
                                                            onChange={(e) =>
                                                                setPayment({
                                                                    ...payment,
                                                                    branch_code: e.target.value.replace(/\D/g, ""),
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ================= CARD (ACCESS PAY SUITE) ================= */}
                                        {payment.paymentType === "accesspaysuite" && (
                                            <div className="mt-5 space-y-4">

                                                {/* Account Holder Name (AUTO SPLIT) */}
                                                <div>
                                                    <label className="block text-[16px] font-semibold">
                                                        Account Holder Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Enter full name (e.g. Saroj Singh)"
                                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        value={payment.account_holder_name}
                                                        onChange={(e) => {
                                                            const fullName = e.target.value;
                                                            const parts = fullName.trim().split(" ");

                                                            setPayment({
                                                                ...payment,
                                                                account_holder_name: fullName,
                                                                firstName: parts[0] || "",
                                                                lastName: parts.slice(1).join(" "),
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                {/* Email */}
                                                {/* <div>
                                                    <label className="block text-[16px] font-semibold">Email</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="Enter email"
                                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        value={payment.email}
                                                        onChange={(e) =>
                                                            setPayment({ ...payment, email: e.target.value })
                                                        }
                                                    />
                                                </div> */}

                                                {/* Address Line 1 */}
                                                <div>
                                                    <label className="block text-[16px] font-semibold">
                                                        Address Line 1
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Street address"
                                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        value={payment.addressLine1}
                                                        onChange={(e) =>
                                                            setPayment({ ...payment, addressLine1: e.target.value })
                                                        }
                                                    />
                                                </div>

                                                {/* Address Line 2 */}
                                                <div>
                                                    <label className="block text-[16px] font-semibold">
                                                        Address Line 2
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Apartment, suite, etc."
                                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        value={payment.addressLine2}
                                                        onChange={(e) =>
                                                            setPayment({ ...payment, addressLine2: e.target.value })
                                                        }
                                                    />
                                                </div>

                                                {/* City & Postal Code */}
                                                <div className="flex gap-4">
                                                    <div className="w-full">
                                                        <label className="block text-[16px] font-semibold">City</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="City"
                                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                            value={payment.city}
                                                            onChange={(e) =>
                                                                setPayment({ ...payment, city: e.target.value })
                                                            }
                                                        />
                                                    </div>

                                                    <div className="w-full">
                                                        <label className="block text-[16px] font-semibold">
                                                            Postal Code
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Postal code"
                                                            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                            value={payment.postalCode}
                                                            onChange={(e) =>
                                                                setPayment({ ...payment, postalCode: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* Account Number */}
                                                <div>
                                                    <label className="block text-[16px] font-semibold">
                                                        Account Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        inputMode="numeric"
                                                        placeholder="Enter account number"
                                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        value={payment.account_number}
                                                        onChange={(e) =>
                                                            setPayment({
                                                                ...payment,
                                                                account_number: e.target.value.replace(/\D/g, ""),
                                                            })
                                                        }
                                                    />
                                                </div>

                                                {/* Branch Code */}
                                                <div>
                                                    <label className="block text-[16px] font-semibold">
                                                        Sort Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        inputMode="numeric"
                                                        placeholder="Enter Sort code"
                                                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                                        value={payment.branch_code}
                                                        onChange={(e) =>
                                                            setPayment({
                                                                ...payment,
                                                                branch_code: e.target.value.replace(/\D/g, ""),
                                                            })
                                                        }
                                                    />
                                                </div>

                                            </div>
                                        )}


                                        {/* ================= AUTHORISE ================= */}
                                        <div className="flex items-center space-x-2 pt-2">
                                            <label className="flex items-center space-x-2 cursor-pointer text-[16px] font-semibold">
                                                <input
                                                    type="checkbox"
                                                    checked={payment.authorise}
                                                    onChange={(e) =>
                                                        setPayment({ ...payment, authorise: e.target.checked })
                                                    }
                                                />
                                                <span>I can authorise Direct Debits on this account myself</span>
                                            </label>
                                        </div>

                                    </div>

                                    <div className="w-full mx-auto flex justify-center" >
                                        <button
                                            type="button"
                                            disabled={
                                                isSubmitting || // disable while submitting
                                                !payment.authorise ||
                                                (payment.paymentType === "bank" && isBankInvalid) ||
                                                (payment.paymentType === "accesspaysuite" &&
                                                    (isCardInvalid))
                                            }
                                            onClick={async () => {
                                                setIsSubmitting(true); // start loading
                                                try {
                                                    setDirectDebitData([...directDebitData, payment]);
                                                    setShowPopup(false);
                                                    await handleSubmit(payment); // await if handleSubmit is async
                                                } finally {
                                                    setIsSubmitting(false); // stop loading after submit
                                                }
                                            }}
                                            className={`w-full max-w-[90%] mx-auto my-3 text-white text-[16px] py-3 rounded-lg font-semibold
${isSubmitting ||
                                                    !payment.authorise ||
                                                    isCardInvalid ||
                                                    isBankInvalid
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-[#237FEA] cursor-pointer"
                                                }`}

                                        >
                                            {isSubmitting ? "Submitting..." : "Set up Direct Debit"}
                                        </button>

                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default List;
