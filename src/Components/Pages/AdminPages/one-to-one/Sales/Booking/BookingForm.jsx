import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
// import Create from './Create';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";

// import Loader from '../../../../contexts/Loader';
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { X } from "lucide-react"; // Optional: Use any icon or ✖️ if no icon lib
import { ChevronDown, ChevronUp } from "lucide-react";

import { evaluate } from 'mathjs';

import { FiSearch } from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import 'react-phone-input-2/lib/style.css';
import DatePicker from "react-datepicker";
import Select from "react-select";
import { useLocation } from 'react-router-dom';

import 'react-datepicker/dist/react-datepicker.css';
import 'react-phone-input-2/lib/style.css';
import PlanTabs from '../../../weekly-classes/find-a-class/PlanTabs';
import { useTermContext } from '../../../contexts/TermDatesSessionContext';
import { useBookFreeTrial } from '../../../contexts/BookAFreeTrialContext';
import Loader from '../../../contexts/Loader';
import { useClassSchedule } from '../../../contexts/ClassScheduleContent';
import { useMembers } from '../../../contexts/MemberContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { usePayments } from '../../../contexts/PaymentPlanContext';
import { useVenue } from '../../../contexts/VenueContext';
import { showConfirm, showError, showSuccess, showWarning } from '../../../../../../utils/swalHelper';

const List = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createBookMembership, createBookLeads, createBookMembershipByfreeTrial } = useBookFreeTrial()
  const [expression, setExpression] = useState('');
  const [generalInfo, setGeneralInfo] = useState([]);
  const leadId = queryParams.get("leadId");
  const [selectedCoach, setSelectedCoach] = useState(null);
  // console.log("Lead ID:", selectedCoach);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [areasToWorkOn, setAreasToWorkOn] = useState("");

  const [numberOfStudents, setNumberOfStudents] = useState('1');
  const { keyInfoData, fetchKeyInfo } = useMembers();
  const token = localStorage.getItem("adminToken");
  const { adminInfo, setAdminInfo } = useNotification();
  const [country, setCountry] = useState("uk"); // default country
  const [country2, setCountry2] = useState("uk"); // default country
  const [dialCode, setDialCode] = useState("+44"); // store selected code silently
  const [dialCode2, setDialCode2] = useState("+44"); // store selected code silently
  const handleChange = (value, data) => {
    // When library fires onChange, just update the dial code
    setDialCode("+" + data.dialCode);
  };
  const handleChange2 = (value, data) => {
    // When library fires onChange, just update the dial code
    setDialCode("+" + data.dialCode);
  };
  const dateOptions = [
    { value: "1oct", label: "1 OCT " },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];
  const handleCountryChange = (countryData) => {
    setCountry(countryData.countryCode);
    setDialCode2("+" + countryData.dialCode);
  };
  const [locationValue, setLocationValue] = useState("");
  const [address, setAddress] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);

  // 🔹 Universal function to fetch suggestions from OpenStreetMap
  // const fetchSuggestions = async (query, setList) => {
  //   if (!query || query.length < 2) return setList([]);
  //   try {
  //     const res = await fetch(
  //       `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
  //     );
  //     const data = await res.json();
  //     setList(data);
  //   } catch (err) {
  //     console.error("Suggestion fetch failed:", err);
  //   }
  // };
  const handleCountryChange2 = (countryData) => {
    setCountry2(countryData.countryCode);
    setDialCode2("+" + countryData.dialCode);
  };
  const fetchGeneralInfo = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/one-to-one/getAllData`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setGeneralInfo(result.data || []);
    } catch (err) {
      console.error("Failed to fetch termGroup:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  // console.log('genralinfo', generalInfo)

  const [isOpenMembership, setIsOpenMembership] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
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

  const { classId, TrialData, comesFrom } = location.state || {};
  const popup1Ref = useRef(null);
  const popup2Ref = useRef(null);
  const popup3Ref = useRef(null);
  const img3Ref = useRef(null); // add a ref for the image
  const img1Ref = useRef(null); // add a ref for the image
  const img2Ref = useRef(null); // add a ref for the image
  // console.log('comesFrom', comesFrom)
  const [showPopup, setShowPopup] = useState(false);
  const [directDebitData, setDirectDebitData] = useState([]);
  const [payment, setPayment] = useState({
    firstName: "",
    lastName: "",
    email: "",
    billingAddress: "",
    iban: "",
    securityCode: "",
    expiryDate: "",
    cardNumber: "",
    authorise: false,
  });

  console.log("Payment data:", payment);

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
  //// console.log('TrialData', TrialData)
  //// console.log('classId', classId)
  const { fetchFindClassID, singleClassSchedulesOnly } = useClassSchedule() || {};
  const [students, setStudents] = useState([
    {
      studentFirstName: '',
      studentLastName: '',
      dateOfBirth: null,
      age: '',
      gender: '',
      medicalInfo: '',
      // Add other fields if needed
    },
  ]);
  //// console.log('singleClassSchedulesOnly', singleClassSchedulesOnly)
  const [emergency, setEmergency] = useState({
    sameAsAbove: false,
    emergencyFirstName: "",
    emergencyLastName: "",
    emergencyPhoneNumber: "",
    emergencyRelation: "",
    dialCode: dialCode,
  });
  const [parents, setParents] = useState([
    {
      id: Date.now(),
      parentFirstName: '',
      parentLastName: '',
      parentEmail: '',
      phoneNumber: '',
      relationChild: '',
      howDidHear: '',
      dialCode: dialCode,

    }
  ]);
  const finalClassId = classId || TrialData?.classScheduleId;
  const allPaymentPlans =
    singleClassSchedulesOnly?.venue?.paymentGroups[0]?.paymentPlans?.map((plan) => ({
      label: `${plan.title} (${plan.students} student${plan.students > 1 ? "s" : ""})`,
      value: plan.id,
      joiningFee: plan.joiningFee,
      all: plan,
    })) || [];

  const paymentPlanOptions = numberOfStudents
    ? allPaymentPlans.filter((plan) => plan.all.students === Number(numberOfStudents))
    : allPaymentPlans;
  //// console.log('singleClassSchedulesOnly', singleClassSchedulesOnly)


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
          medicalInfo: '',
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
      //// console.log('stp1')
      if (Array.isArray(TrialData.students) && TrialData.students.length > 0) {
        //// console.log('stp2')
        setStudents(TrialData.students);
      }
      //// console.log('stp3')
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

  //// console.log('TrialData', students)

  // useEffect(() => {
  //     if (!finalClassId) {
  //         navigate("/weekly-classes/find-a-class", { replace: true });
  //     }
  // }, [finalClassId, navigate]);

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

      showError("Fetch Failed", error.message || "Failed to fetch comments. Please try again later.");
      
    }
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchGeneralInfo();
        await fetchKeyInfo();
        await fetchComments();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [fetchGeneralInfo, fetchKeyInfo, fetchComments]);


  const [activePopup, setActivePopup] = useState(null);
  const togglePopup = (id) => {
    setActivePopup((prev) => (prev === id ? null : id));
  };
  const [openForm, setOpenForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [congestionNote, setCongestionNote] = useState(null);
  // const [selectedDate, setSelectedDate] = useState(null);
  const [membershipPlan, setMembershipPlan] = useState(null);
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 11));
  const [toDate, setToDate] = useState(null);

  const month = currentDate.getMonth();
  const [year, setYear] = useState(new Date().getFullYear());
  const hasInitialized = useRef(false);
  const { admins, paymentGroups, discounts } = generalInfo || [];


  const [clickedIcon, setClickedIcon] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
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
  

  const formatLocalDate = (date) => {
    if (!date) return null;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`; // ✅ 2022-12-09
  };

  // Time only (local time)
  const formatLocalTime = (time) => {
    if (!time) return null;

    const h = String(time.getHours()).padStart(2, "0");
    const m = String(time.getMinutes()).padStart(2, "0");

    return `${h}:${m}`; // ✅ 14:30
  };


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

  const handleCancel = () => {
    showConfirm({
      title: "Are you sure?",
      text: "Your changes will not be saved!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, leave",
      cancelButtonText: "Stay here",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/one-to-one");
      }
    });
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



  const [dob, setDob] = useState('');
  const [age, setAge] = useState(null);
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [sameAsAbove, setSameAsAbove] = useState(false);
  console.log('time', time);

  // 🔁 Calculate Age Automatically
  const handleDOBChange = (index, date) => {
    if (!date) return;

    // Normalize date (remove timezone shift)
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const today = new Date();
    let ageNow = today.getFullYear() - normalizedDate.getFullYear();
    const m = today.getMonth() - normalizedDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < normalizedDate.getDate())) {
      ageNow--;
    }

    const updatedStudents = [...students];
    updatedStudents[index].dateOfBirth = normalizedDate;
    updatedStudents[index].age = ageNow;

    setStudents(updatedStudents);
  };

  const formatDateOnlyLocal = (date) => {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };



  // 🔁 Sync Emergency Contact



  const handleInputChange = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index][field] = value;
    setStudents(updatedStudents);
  };





  const handleAddParent = () => {
    setParents((prev) => [
      ...prev,
      {
        id: Date.now(),
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        phoneNumber: '',
        relationChild: '',
        howDidHear: ''
      },
    ]);
  };

  const handleRemoveParent = (id) => {
    setParents((prev) => prev.filter((p) => p.id !== id));
  };


  const handleParentChange = (index, field, value) => {
    const updated = [...parents];
    updated[index][field] = value;
    setParents(updated);
  };





  useEffect(() => {
    if (emergency.sameAsAbove && parents.length > 0) {
      const firstParent = parents[0];
      setEmergency(prev => ({
        ...prev,
        emergencyFirstName: firstParent.parentFirstName || "",
        emergencyLastName: firstParent.parentLastName || "",
        emergencyPhoneNumber: firstParent.phoneNumber || "",
        emergencyRelation: firstParent.relationChild || "", // or whatever default you want
      }));
    }
  }, [emergency.sameAsAbove, parents]);


  function combineLocalDateTime(date, timeValue) {
    let hours, minutes;

    // If timeValue is a Date object
    if (timeValue instanceof Date) {
      hours = timeValue.getHours();
      minutes = timeValue.getMinutes();
    }

    // If timeValue is "HH:mm" string
    else if (typeof timeValue === "string" && timeValue.includes(":")) {
      [hours, minutes] = timeValue.split(":");
    }

    // Create date in **local timezone**
    const d = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // IMPORTANT: Do NOT use toISOString() (it converts to UTC!)
    // Use manual formatting:
    const pad = (n) => String(n).padStart(2, "0");

    const finalString =
      `${d.getFullYear()}-` +
      `${pad(d.getMonth() + 1)}-` +
      `${pad(d.getDate())}T` +
      `${pad(d.getHours())}:` +
      `${pad(d.getMinutes())}:00`;

    return finalString; // stays in local time
  }


  // Date only (no timezone)

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

    const transformedPayment = { ...filteredPayment };

    if (transformedPayment.expiryDate || transformedPayment["expiry date"]) {
      const rawExpiry =
        transformedPayment.expiryDate || transformedPayment["expiry date"];
      transformedPayment.expiryDate = rawExpiry.replace("/", "");
      delete transformedPayment["expiry date"];
    }

    if (transformedPayment.cardNumber) {
      transformedPayment.cardNumber =
        transformedPayment.cardNumber.replace(/\s+/g, "");
    }

    setIsSubmitting(true);

    // ✅ SAFE LOCAL DATE & TIME
    const formattedDate = formatLocalDate(selectedDate);
    const formattedTime = formatLocalTime(time);

    const payload = {
      leadId,
      coachId: selectedCoach,
      location: locationValue,
      address,
      date: formattedDate,   // ✅ YYYY-MM-DD
      time: formattedTime,   // ✅ HH:mm
      totalStudents: students.length,
      areaWorkOn: areasToWorkOn,
      paymentPlanId: selectedPackage,
      discountId: selectedDiscount,
      students: students.map((s) => ({
        ...s,
        dateOfBirth: formatLocalDate(s.dateOfBirth), // ✅ IMPORTANT
      })),
      parents,
      emergency,
      ...(Object.keys(transformedPayment).length > 0 && {
        payment: transformedPayment,
      }),
    };

    console.log("payload", payload);

    try {
      await createBookLeads(payload);
    } catch (error) {
      console.error("Error while submitting:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      //// console.log('cleanedPlans', cleanedPlans);
      setSelectedPlans(cleanedPlans);
    } else {
      //// console.log('cleanedPlans not found');
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



  console.log('selectedPackage', selectedPackage)


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
    setLoadingData(true);


      const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/comment/create`, requestOptions);

      const result = await response.json();

      if (!response.ok) {
        showError("Failed to Add Comment", result.message || "Something went wrong. Please try again.");
        
        return;
      }

showSuccess("Comment Added", result.message || "Comment has been added successfully!");
      


      setComment('');
      fetchComments();
    } catch (error) {
      console.error("Error creating member:", error);
      showError("Network Error", error.message || "An error occurred while submitting the form.");
       
    }finally {
      setLoadingData(false);
    }
  }
  // Function to convert HTML to plain text while preserving list structure
  function htmlToArray(html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const items = [];

    function traverse(node) {
      node.childNodes.forEach((child) => {
        if (child.nodeName === "LI") {
          const text = child.textContent.trim();
          if (text) items.push(text);
        } else if (child.nodeName === "OL" || child.nodeName === "UL") {
          traverse(child);
        } else if (child.nodeType !== 3) { // skip text nodes outside li
          traverse(child);
        }
      });
    }

    traverse(tempDiv);

    // If no <li> found, fallback to plain text
    if (items.length === 0) {
      const plainText = tempDiv.textContent.trim();
      if (plainText) items.push(plainText);
    }

    return items;
  }

  // Example usage:
  const keyInfoArray = htmlToArray(keyInfoData?.keyInformation);

  // Map into dynamic options
  const keyInfoOptions = keyInfoArray.map((item) => ({
    value: item,
    label: item,
  }));

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
  // console.log('genralinfo', generalInfo)

  //// console.log('keyInfoData', keyInfoData)
  const selectedLabel =
    keyInfoOptions.find((opt) => opt.value === selectedKeyInfo)?.label ||
    "Key Information";


  const sessionDatesSet = new Set(sessionDates);
  // console.log('generalInfo', generalInfo)


  useEffect(() => {
    // Run only once, and only if there are session dates
    if (hasInitialized.current || !sessionDatesSet || sessionDatesSet.size === 0) return;

    const allDates = Array.from(sessionDatesSet)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a - b);

    const earliestDate = allDates[0];

    setCurrentDate(new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1));
    setYear(earliestDate.getFullYear());

    hasInitialized.current = true; // ✅ mark as done
  }, [sessionDatesSet]);
  // console.log('admins', admins)
  const coachOptions = useMemo(
    () =>
      generalInfo.admins?.map((admin) => ({
        value: admin.id,
        label: `${admin.firstName} ${admin.lastName || ""}`.trim(),
      })),
    [admins]
  );

  // 2️⃣ Package options (filtered by selected coach)

  const packageOptions = useMemo(() => {
    // console.log("RUNNING packageOptions");

    if (!selectedCoach) {
      // console.log("⛔ selectedCoach is NULL → returning []");
      return [];
    }

    // console.log("selectedCoach.value =", selectedCoach.value);

    // console.log("paymentGroups received →", paymentGroups);

    // Step 1: Merge groups
    const mergedGroups = Object.values(
      paymentGroups.reduce((acc, group) => {
        const id = group.adminId;

        if (!acc[id]) {
          acc[id] = { ...group, paymentPlans: [] };
        }

        group.paymentPlans.forEach((plan) => {
          if (!acc[id].paymentPlans.some((p) => p.id === plan.id)) {
            acc[id].paymentPlans.push(plan);
          }
        });

        return acc;
      }, {})
    );

    // console.log("Merged groups result →", mergedGroups);

    // Step 2: Select correct group
    const selectedGroup = mergedGroups.find(
      (g) => g.adminId === selectedCoach
    );

    // console.log("Selected group →", selectedGroup);

    if (!selectedGroup) {
      // console.log("⛔ No group found for adminId =", selectedCoach);
      return [];
    }

    if (!selectedGroup.paymentPlans?.length) {
      // console.log("⛔ selectedGroup.paymentPlans is EMPTY");
      return [];
    }

    // console.log("Final Payment Plans →", selectedGroup.paymentPlans);

    return selectedGroup.paymentPlans.map((plan) => ({
      value: plan.id,
      label: plan.title,
      ...plan,
    }));
  }, [selectedCoach, paymentGroups, numberOfStudents]);


  // console.log('packageOptions', packageOptions)
  // 3️⃣ Discount options
  const discountOptions = useMemo(
    () =>
      generalInfo?.discounts?.map((disc) => ({
        value: disc.id, // save the ID internally
        label: `${disc.code} (${disc.value}${disc.valueType === "percentage" ? "%" : ""})`, // show code + value
        code: disc.code, // keep code for display if needed elsewhere
      })) || [],
    [generalInfo?.discounts]
  );
  const selectedPackages = packageOptions.find(pkg => pkg.id === selectedPackage);

  // selectedPackage = ID (ex: 94)
  // packageOptions = array of all plans (your full array)
  const finalPaymentPreview = (paymentGroups || []).find(group =>
    Array.isArray(group.paymentPlans) &&
    group.paymentPlans.some(plan => plan.id === selectedPackage)
  );

  const filteredPackages = packageOptions.filter(
    (pkg) => Number(numberOfStudents) === pkg.students
  );
  if (loading) return <Loader />;

  return (
    <div className="pt-1 bg-gray-50 min-h-screen">
      <div className={`flex pe-4 justify-between items-center mb-4 ${openForm ? 'md:w-3/4' : 'w-full'}`}>

        <h2 onClick={() => {
          if (comesFrom && comesFrom.toLowerCase() === "trials") {
            navigate("/one-to-one");
          } else {
            navigate("/one-to-one");
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
                  <PlanTabs selectedPlans={finalPaymentPreview?.paymentPlans} />
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
            <h2 className="text-[24px] font-semibold">General Information</h2>
            <div className="space-y-6">
              {/* 🔸 Location Input */}
              <div className="">
                <label className="text-base font-semibold">Location</label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder="Search"
                    value={locationValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocationValue(val);
                      // fetchSuggestions(val, setLocationSuggestions);
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                  />
                  <FiSearch className="absolute left-3 top-4 text-[20px]" />

                  {/* 🔹 Dropdown suggestions */}
                  {locationSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl mt-1 max-h-56 overflow-y-auto w-full shadow-md">
                      {locationSuggestions.map((s, i) => (
                        <li
                          key={i}
                          onClick={() => {
                            setLocationValue(s.display_name);
                            setLocationSuggestions([]);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                        >
                          {s.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* 🔸 Address Input */}
              <div className="">
                <label className="text-base font-semibold">Address</label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder="Search Address"
                    value={address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAddress(val);
                      // fetchSuggestions(val, setAddressSuggestions);
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                  />
                  <FiSearch className="absolute left-3 top-4 text-[20px]" />

                  {/* 🔹 Dropdown suggestions */}
                  {addressSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl mt-1 max-h-56 overflow-y-auto w-full shadow-md">
                      {addressSuggestions.map((s, i) => (
                        <li
                          key={i}
                          onClick={() => {
                            setAddress(s.display_name);
                            setAddressSuggestions([]);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                        >
                          {s.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full">
              <label className="block text-[16px] font-semibold">Date</label>
              <DatePicker
                withPortal
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                showYearDropdown
                scrollableYearDropdown
                dateFormat="dd/MM/yyyy"
                placeholderText="Select date"
              />
            </div>
            <div className="">
              <label htmlFor="" className="text-base font-semibold">Time </label>
              <div className="relative mt-2 ">
                <DatePicker
                  withPortal
                  selected={time}
                  onChange={(date) => setTime(date)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  placeholderText="Select time"
                  className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                />

              </div>
            </div>
            <div className="mb-5">
              <label htmlFor="" className="text-base font-semibold">Students</label>
              <div className="relative mt-2 ">

                <input
                  type="number"
                  value={numberOfStudents}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if ([1, 2, 3].includes(val) || e.target.value === "") {
                      setNumberOfStudents(e.target.value);
                    }
                    // Do nothing if invalid
                  }}
                  placeholder="Choose number of students"
                  className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 focus:outline-none"
                />

              </div>
            </div>
            <div className="">
              <label htmlFor="" className="text-base font-semibold">Areas To Work On </label>
              <div className="relative mt-2">
                <textarea
                  placeholder=""
                  value={areasToWorkOn}
                  onChange={(e) => setAreasToWorkOn(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 focus:outline-none resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-[16px] font-semibold">Select a Coach </label>
              <Select
                className="w-full mt-2 text-base"
                classNamePrefix="react-select"
                placeholder="Select a Coach"
                value={Array.isArray(coachOptions) ? coachOptions.find((opt) => opt.value === selectedCoach) || null : null}
                onChange={(opt) => {
                  setSelectedCoach(opt?.value || null);
                  setSelectedPackage(null); // reset package if coach changes
                }}
                options={coachOptions}
              />
            </div>
            <div className="w-full">
              <label className="block text-[16px] font-semibold">Package</label>
              <Select
                className="w-full mt-2 text-base"
                classNamePrefix="react-select"
                placeholder={selectedCoach ? "Select a Package" : "Select a Coach first"}
                isDisabled={!selectedCoach}
                value={filteredPackages.find((opt) => opt.value === selectedPackage) || null}
                onChange={(opt) => setSelectedPackage(opt?.value || null)}
                options={filteredPackages}
              />
            </div>
            <div className="w-full">
              <label className="block text-[16px] font-semibold">Apply discount</label>
              <Select
                className="w-full mt-2 text-base"
                classNamePrefix="react-select"
                placeholder="Select a Discount code"
                // find option by ID
                isClearable
                value={discountOptions.find((opt) => opt.value === selectedDiscount) || null}
                onChange={(opt) => setSelectedDiscount(opt?.value || null)}
                options={discountOptions}
              />
            </div>
          </div>
          <div className="w-full max-w-xl mx-auto">
            <button
              type="button"
              disabled={!selectedPackages}
              onClick={() => setIsOpenMembership(!isOpenMembership)}
              className={`bg-[#237FEA] text-white text-[18px]  font-semibold border w-full border-[#237FEA] px-6 py-3 rounded-lg flex items-center justify-center  ${selectedPackages
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
                <div className="flex justify-between text-[#333]">
                  <span>Membership Plan</span>
                  <span>
                    {selectedPackages?.duration} {selectedPackages.interval}
                    {selectedPackages.duration > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>Monthly Subscription Fee</span>
                  <span>£{selectedPackages.priceLesson} p/m</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>One-off Joining Fee</span>
                  <span>£{selectedPackages.joiningFee}</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>Number of lessons pro-rated</span>
                  <span>2</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>Price per class per child</span>
                  <span>£11.33</span>
                </div>
                <div className="flex justify-between text-[#000]">
                  <span>Cost of pro-rated lessons</span>
                  <span>£23.66</span>
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
                        value={student.medicalInfo || ""}
                        onChange={(e) => handleInputChange(index, "medicalInfo", e.target.value)}
                        className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          disabled={parents.length === 3}
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
                          value={parent.phoneNumber}
                          onChange={(e) =>
                            handleParentChange(index, "phoneNumber", e.target.value)
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
                        value={relationOptions.find((o) => o.value === parent.relationChild)}
                        onChange={(selected) =>
                          handleParentChange(index, "relationChild", selected.value)
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
                        value={hearOptions.find((o) => o.value === parent.howDidHear)}
                        onChange={(selected) =>
                          handleParentChange(index, "howDidHear", selected.value)
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
            <div className="w-full my-10">
              {/* Placeholder (acts like a select box) */}
              <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between text-[20px] p-3 border border-gray-200 rounded-xl cursor-pointer bg-white shadow-md hover:border-gray-400 transition"
              >
                <span
                  className={`${selectedKeyInfo ? "font-medium text-gray-900" : "text-gray-500"
                    }`}
                >
                  {selectedLabel}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {/* Options (bullet style) */}
              {isOpen && (
                <div className="mt-3 space-y-2 e sha rounded-xl p-3 bo0">
                  {keyInfoOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition 
                                 ${selectedKeyInfo === option.value
                          ? ""
                          : "hover:bg-gray-50 border border-transparent"
                        }`}
                    //    onClick={() => {
                    //        setSelectedKeyInfo(option.value);
                    //        // close after select
                    //    }}
                    >
                      {/* Custom Bullet */}
                      <span
                        className={`w-3 h-3 rounded-full bg-gradient-to-r 
                                   ${selectedKeyInfo === option.value
                            ? "from-blue-500 to-blue-400 shadow-sm"
                            : "from-gray-400 to-gray-300"
                          }`}
                      ></span>

                      {/* Label */}
                      <span
                        className={`${selectedKeyInfo === option.value
                          ? "font-semibold text-blue-700"
                          : "text-gray-700"
                          }`}
                      >
                        {option.label || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-[16px] font-semibold outline-none"
                />
                <button
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
                            <p className="font-semibold text-[#237FEA] text-[16px]">{c?.bookedByAdmin?.firstName} {c?.bookedByAdmin?.lastName} </p>
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
                  const parentEmail = parents?.[0]?.parentEmail || "";

                  console.log("parentEmail:", parentEmail);

                  if (!selectedPackage || !selectedDate || !parentEmail) {
                    let msg = "";
                    if (!selectedPackage && !selectedDate) msg = "Please select Package and Date";
                    else if (!selectedPackage) msg = "Please select package";
                    else if (!parentEmail) msg = "Please enter Parent email";
                    else if (!selectedDate) msg = "Please select Date";

                    showWarning("Required Fields", msg);
                    return;
                  }

                  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim());
                  if (!isValidEmail) {
                    showWarning("Invalid Email", "Please enter a valid email address");
                    
                    return;
                  }

                  setShowPopup(true);
                }}
                disabled={
                  isSubmitting ||
                  !selectedPackage ||
                  !selectedDate ||
                  !parents?.[0]?.parentEmail
                }
                className={`text-white font-semibold text-[18px] px-6 py-3 rounded-lg ${!isSubmitting &&
                  selectedPackage &&
                  selectedDate &&
                  parents?.[0]?.parentEmail
                  ? "bg-[#237FEA] border border-[#237FEA]"
                  : "bg-gray-400 border-gray-400 cursor-not-allowed"
                  }`}
              >
                {isSubmitting ? "Submitting..." : "Make Payment"}
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
                    <p className="text-white text-[16px]">One to One Package ( {selectedPackages?.label || ''} )</p>
                    <p className="font-semibold text-white text-[24px]">
                      {selectedPackages?.price != null && `£${selectedPackages?.price}`}
                    </p>
                  </div>
                  <div className="space-y-2 px-6 pb-0">
                    <h3 className="font-semibold text-[20px]">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[16px] font-semibold">First name</label>
                        <input
                          className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                          type="text"
                          value={payment.firstName}
                          onChange={(e) => setPayment({ ...payment, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[16px] font-semibold">Last name </label>
                        <input
                          type="text"
                          className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                          value={payment.lastName}
                          onChange={(e) => setPayment({ ...payment, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[16px] font-semibold">Email address </label>
                      <input
                        type="email"
                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                        value={payment.email}
                        onChange={(e) => setPayment({ ...payment, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[16px] font-semibold">Billing Address</label>
                      <input
                        type="text"
                        required={payment.paymentType === "card"}
                        placeholder=""
                        className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                        value={payment.billingAddress}
                        onChange={(e) =>
                          setPayment({
                            ...payment,
                            billingAddress: e.target.value, // allow full text input
                          })
                        }
                      />
                    </div>

                    <h3 className="font-semibold text-[20px] pt-2">Bank Details</h3>



                    <div className="mt-5 space-y-4">
                      {/* Card Holder Name */}
                      <div>
                        <label className="block text-[16px] font-semibold">Card Number</label>
                        <input
                          type="text"
                          required={payment.paymentType === "card"}
                          inputMode="numeric"
                          placeholder="**** **** **** ****"
                          maxLength={19}
                          className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base tracking-widest"
                          value={payment.cardNumber}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ""); // only digits
                            value = value.replace(/(.{4})/g, "$1 ").trim(); // format as XXXX XXXX XXXX XXXX
                            setPayment({ ...payment, cardNumber: value });
                          }}
                        />
                      </div>

                      <div className="w-full">
                        <label className="block text-[16px] font-semibold">Expiry Date</label>
                        <input
                          required={payment.paymentType === "card"}
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                          value={payment.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ""); // only digits
                            if (value.length >= 3) {
                              value = value.slice(0, 2) + "/" + value.slice(2, 4);
                            }
                            setPayment({ ...payment, expiryDate: value });
                          }}
                        />
                      </div>

                      {/* PAN (Card Number) */}
                      <div className="w-full">
                        <label className="block text-[16px] font-semibold">Security Code</label>
                        <input
                          required={payment.paymentType === "card"}
                          type="password"
                          inputMode="numeric"
                          placeholder="123"
                          maxLength={4}
                          className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                          value={payment.securityCode}
                          onChange={(e) =>
                            setPayment({
                              ...payment,
                              securityCode: e.target.value.replace(/\D/g, ""), // only digits
                            })
                          }
                        />
                      </div>

                      {/* Billing Address */}

                    </div>



                  </div>
                  <div className="w-full mx-auto flex justify-center" >
                    <button
                      type="button"
                      disabled={
                        isSubmitting ||
                        !payment.expiryDate ||
                        !payment.securityCode ||
                        !payment.cardNumber ||
                        !payment.billingAddress
                      }
                      onClick={async () => {
                        if (
                          !payment.expiryDate ||
                          !payment.securityCode ||
                          !payment.cardNumber ||
                          !payment.billingAddress
                        ) {
                          return;
                        }

                        setIsSubmitting(true);
                        try {
                          setDirectDebitData((prev) => [...prev, payment]);
                          setShowPopup(false);
                          await handleSubmit(payment);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className={`w-full max-w-[90%] mx-auto my-3 text-white text-[16px] py-3 rounded-lg font-semibold transition-colors duration-200
    ${isSubmitting ||
                          !payment.expiryDate ||
                          !payment.securityCode ||
                          !payment.cardNumber ||
                          !payment.billingAddress
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#237FEA] hover:bg-[#1a6edc] cursor-pointer"
                        }`}
                    >
                      {isSubmitting ? "Submitting..." : "Make Payment"}
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
