import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from "react-router-dom";
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";


import { useNotification } from '../../../contexts/NotificationContext';
import { Check, Mail, MessageSquare, Search, Loader2 } from "lucide-react";
import { IoIosArrowDown } from "react-icons/io";
import { motion } from "framer-motion";
import { IoMdCheckmarkCircle } from "react-icons/io";
import Select from "react-select";
import DatePicker from "react-datepicker";
import PhoneInput from "react-phone-input-2";

import { useRecruitmentTemplate } from '../../../contexts/RecruitmentContext';
import { useVenue } from '../../../contexts/VenueContext';
import Loader from '../../../contexts/Loader';
import { showConfirm, showError } from '../../../../../../utils/swalHelper';
const dateOptions = [
  { value: "2025-01-01", label: "Jan 01 2025" },
  { value: "2025-01-02", label: "Jan 02 2025" },
];
const regionalManagerOptions = [
  { value: "manager1", label: "Manager 1" },
  { value: "manager2", label: "Manager 2" },
  { value: "manager3", label: "Manager 3" },
];
const payRateOptions = [
  { value: "10", label: "₹10 / hr" },
  { value: "20", label: "₹20 / hr" },
  { value: "30", label: "₹30 / hr" },
];




pdfMake.vfs = vfsFonts.vfs;
const CandidateInfo = ({ steps, setSteps }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [telephoneCallDelivery, setTelephoneCallDelivery] = useState({
    telePhoneCallDeliveryCommunicationSkill: null,
    telePhoneCallDeliveryPassionCoaching: null,
    telePhoneCallDeliveryExperience: null,
    telePhoneCallDeliveryKnowledgeOfSSS: null,
  });
  const [venueState, setVenueState] = useState("");

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [venueManager, setVenueManager] = useState(null);
  const [telephoneCall, setTelephoneCall] = useState({
    date: "",
    time: "",
    reminder: "",
    email: "",
    scores: {
      communication: null,
      passion: null,
      experience: null,
      knowledge: null,
    },
  });
  console.log('telephoneCallDelivery', telephoneCallDelivery)
  const [payload, setPayload] = useState({
    qualifyLead: null,

    telephoneCallSetupDate: null,
    telephoneCallSetupTime: null,
    telephoneCallSetupReminder: null,
    telephoneCallSetupEmail: null,

    telePhoneCallDeliveryCommunicationSkill: null,
    telePhoneCallDeliveryPassionCoaching: null,
    telePhoneCallDeliveryExperience: null,
    telePhoneCallDeliveryKnowledgeOfSSS: null,
  });
  const scoreKeyMap = {
    "Communication skill": "telePhoneCallDeliveryCommunicationSkill",
    "Passion for coaching": "telePhoneCallDeliveryPassionCoaching",
    "Experience": "telePhoneCallDeliveryExperience",
    "Knowledge of SSS": "telePhoneCallDeliveryKnowledgeOfSSS",
  };
  // console.log('telephoneCall', telephoneCall)
  const [rateOpen, setRateOpen] = useState(false);
  const [openCandidateStatusModal, setOpenCandidateStatusModal] = useState(false);
  const { fetchCoachRecruitmentById, fetchVenueManagerRecruitmentById, recuritmentDataById, fetchAllRecruitmentById, rejectCoach, sendCoachMail, createCoachRecruitmentById, createVenuManagerRecruitmentById } = useRecruitmentTemplate() || {};
  const { fetchVenueNames, venues, fetchAssignedVenueNames, assignedVenues } = useVenue() || {};

  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");   // 👉 this gives "7"
  const comesfrom = searchParams.get("comesfrom");   // 👉 this gives "7"

  // console.log("telephoneCallDelivery:", telephoneCallDelivery);

  const [openResultModal, setOpenResultModal] = useState(false);
  const [openOfferModal, setOpenOfferModal] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [comment, setComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5; // Number of comments per page
  const { adminInfo } = useNotification();

  // const [venues, setVenues] = useState([]);

  const getInitialForm = (data, parsedVenues = []) => {
    // ⛔ When API data is not ready
    if (!data) {
      return {
        firstName: "",
        surname: "",
        status: "",
        dob: "",
        age: "",
        email: "",
        phone: "",
        postcode: "",
        heardFrom: "Indeed",

        ageGroup: "",
        vehicle: "",
        qualification: "",
        experience: "",
        venues: [],
        coverNote: "",
      };
    }

    return {
      firstName: data.firstName || "",
      surname: data.lastName || "",
      status: data.status || "",
      dob: data.dob || "",
      age: data.age || "",
      email: data.email || "",
      phone: data.phoneNumber || "",
      postcode: data.postcode || "",
      heardFrom: data.candidateProfile?.howDidYouHear || "Indeed",

      ageGroup: data.candidateProfile?.ageGroupExperience || "",
      vehicle:
        data.candidateProfile?.accessToOwnVehicle === true
          ? "Yes"
          : data.candidateProfile?.accessToOwnVehicle === false
            ? "No"
            : "",
      qualification: data.candidateProfile?.whichQualificationYouHave || "",
      experience: data.candidateProfile?.footballExperience || "",
      venues: parsedVenues || [],
      coverNote: data.candidateProfile?.coverNote || "",
    };
  };
  const [form, setForm] = useState(() => getInitialForm(recuritmentDataById));
  useEffect(() => {
    if (recuritmentDataById) {
      setForm(getInitialForm(recuritmentDataById));
    }
  }, [recuritmentDataById]);


  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const selectedVenueNames = venues
    .filter(v => form.venues.includes(v.id))
    .map(v => v.id);
  const handleVenueChange = (id) => {
    setForm((prev) => ({
      ...prev,
      venues: prev.venues.includes(id)
        ? prev.venues.filter((x) => x !== id)
        : [...prev.venues, id],
    }));
  };


  useEffect(() => {
    if (!venueState) {
      setClassOptions([]);
      setSelectedClass(null);
      return;
    }

    // Find the selected venue
    const selectedVenue = venues.find((v) => v.id === parseInt(venueState));

    // Map classSchedules to react-select options
    if (selectedVenue && selectedVenue.classSchedules) {
      const options = selectedVenue.classSchedules.map((cls) => ({
        value: cls.id,
        label: cls.className,
      }));
      setClassOptions(options);
      setSelectedClass(null);
      setSelectedClass(
        options.find(opt => opt.value === recuritmentDataById?.candidateProfile?.bookPracticalAssessment?.[0].classId) || null
      ); // Reset previous selection
    } else {
      setClassOptions([]);
      setSelectedClass(null);
    }
  }, [venueState, venues]);
  const venueSlots = [
    "London Bridge / SAT 9 AM - 10 AM",
    "London Bridge / SAT 10 AM - 11 AM",
    "London Bridge / SAT 11 AM - 12 PM",
    "London Bridge / SAT 12 PM - 1 PM",
    "London Bridge / SAT 2 PM - 3 PM",
    "London Bridge / SAT 3 PM - 4 PM",
  ];
  // Pagination calculations
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(commentsList.length / commentsPerPage);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.max(0, Math.floor((now - past) / 1000));
    // in seconds

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

  const goToPage = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

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
      showError("Error", error.message || error.error || "Failed to fetch comments. Please try again later.");
    }
  }, []);

  const submitScorecard = () => {
    setPayload(prev => ({ ...prev, ...telephoneCallDelivery }));


    toggleStep(3, "completed");
    setRateOpen(false);
  };
  const handleSubmitComment = async (e) => {
    const token = localStorage.getItem("adminToken");
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
  const recruitedMode = form.status?.toLowerCase() === "recruited";


  // steps 

  console.log('steps', steps)
  const venueOptions = assignedVenues.map((v) => ({
    value: v.id,
    label: `${v.firstName} ${v.lastName}`.trim() || v.email, // fallback to email if no name
  }));

  const parseJSONSafe = (value, fallback = []) => {
    try {
      return Array.isArray(value)
        ? value
        : value
          ? JSON.parse(value)
          : fallback;
    } catch {
      return fallback;
    }
  };

  const getVenueOptions = (assignedVenues = []) =>
    assignedVenues.map(v => ({
      value: v.id,
      label: `${v.firstName} ${v.lastName}`.trim() || v.email,
    }));


  useEffect(() => {
    if (!id) return;

    const init = async () => {
      setLoading(true);

      const recruitmentPromise =
        comesfrom === "venueManager"
          ? fetchVenueManagerRecruitmentById(id)
          : comesfrom === "coach"
            ? fetchCoachRecruitmentById(id)
            : fetchAllRecruitmentById(id);

      await Promise.all([
        fetchAssignedVenueNames(),
        fetchVenueNames(),
        fetchComments(),
        recruitmentPromise,
      ]);

      setLoading(false);
    };

    init();
  }, [id, comesfrom]);


  useEffect(() => {
    if (!recuritmentDataById) {
      setForm(getInitialForm(null));
      setTelephoneCall({});
      setTelephoneCallDelivery({});
      setVenueState(null);
      setSelectedClass(null);
      setSelectedDate(null);
      setVenueManager(null);
      return;
    }

    const data = recuritmentDataById;
    const p = data.candidateProfile;

    const parsedVenues = parseJSONSafe(p?.availableVenueWork);
    const venueOptions = getVenueOptions(assignedVenues);

    setForm(getInitialForm(data, parsedVenues));

    setTelephoneCall({
      date: p?.telephoneCallSetupDate || "",
      time: p?.telephoneCallSetupTime || "",
      reminder: p?.telephoneCallSetupReminder || "",
      email: p?.telephoneCallSetupEmail || "",
      scores: {
        communication: p?.telePhoneCallDeliveryCommunicationSkill ?? null,
        passion: p?.telePhoneCallDeliveryPassionCoaching ?? null,
        experience: p?.telePhoneCallDeliveryExperience ?? null,
        knowledge: p?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
      },
    });

    setTelephoneCallDelivery({
      telePhoneCallDeliveryCommunicationSkill: p?.telePhoneCallDeliveryCommunicationSkill ?? null,
      telePhoneCallDeliveryPassionCoaching: p?.telePhoneCallDeliveryPassionCoaching ?? null,
      telePhoneCallDeliveryExperience: p?.telePhoneCallDeliveryExperience ?? null,
      telePhoneCallDeliveryKnowledgeOfSSS: p?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
    });

    const practical = p?.bookPracticalAssessment?.[0];

    setVenueState(practical?.venueId || null);
    setSelectedDate(practical?.date || null);
    setSelectedClass(
      classOptions.find(opt => opt.value === practical?.classId) || null
    );
    setVenueManager(
      venueOptions.find(opt => opt.value === practical?.assignToVenueManagerId) || null
    );

  }, [recuritmentDataById, assignedVenues]);


  useEffect(() => {
    const p = recuritmentDataById?.candidateProfile;
    console.log('ppppppppppp', p)
    if (!p) {
      setSteps(prev =>
        prev.map(step => ({
          ...step,
          status: "pending",
          resultPercent: undefined,
          resultStatus: undefined,
        }))
      );
      return;
    }

    setSteps(prev =>
      prev.map(step => {
        switch (step.id) {
          case 1:
            return { ...step, status: p.qualifyLead ? "completed" : "pending" };
          case 2:
            return {
              ...step,
              status: p.telephoneCallSetupDate ? "completed" : "pending",
              isEnabled: !p.telephoneCallSetupDate,
            };

          case 3:
            return {
              ...step,
              status: p.telePhoneCallDeliveryCommunicationSkill ? "completed" : "pending",
            };

          case 5:
            return p.result
              ? {
                ...step,
                status: "completed",
                resultPercent: recuritmentDataById.telephoneCallScorePercentage + "%",
                resultStatus: p.result === "passed" ? "Passed" : "Failed",
              }
              : step;

          default:
            return step;
        }
      })
    );
  }, [recuritmentDataById]);

  console.log('recuritmentDataByIdp', recuritmentDataById)
  const enableNextStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id + 1 ? { ...step, isEnabled: true } : step
      )
    );
  };
  const toggleStep = (id, status) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id
          ? { ...step, status }
          : step
      )
    );

    // ===== STEP-SPECIFIC DATA HANDLING =====

    // ✅ Qualify Lead
    if (id === 1) {
      setPayload(prev => ({
        ...prev,
        qualifyLead: status === "completed" ? true : null,
      }));
    }

    // ✅ Telephone Call Setup
    if (id === 2 && status === "skipped") {
      setPayload(prev => ({
        ...prev,
        telephoneCallSetupDate: null,
        telephoneCallSetupTime: null,
        telephoneCallSetupReminder: null,
        telephoneCallSetupEmail: null,
      }));
    }
    if (id === 3 && status === "skipped") {
      setPayload(prev => ({
        ...prev,
        telePhoneCallDeliveryCommunicationSkill: null,
        telePhoneCallDeliveryPassionCoaching: null,
        telePhoneCallDeliveryExperience: null,
        telePhoneCallDeliveryKnowledgeOfSSS: null,
      }));
    }

    // ✅ Enable next step when completed OR skipped
    if (status === "completed" || status === "skipped") {
      enableNextStep(id);
    }
  };

  const toggleOpenStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id ? { ...step, isOpen: !step.isOpen } : step
      )
    );
  };
  const confirmTelephoneCall = () => {
    setPayload(prev => ({
      ...prev,
      telephoneCallSetupDate: telephoneCall.date,
      telephoneCallSetupTime: telephoneCall.time,
      telephoneCallSetupReminder: telephoneCall.reminder,
      telephoneCallSetupEmail: telephoneCall.email,
    }));
    toggleOpenStep(2);
    toggleStep(2, "completed");
  };
  const handleRejectCandidate = async (id) => {
    showConfirm("Are you sure?", "Do you want to Reject this Candidate ?", "warning").then(async (result) => {
      if (result.isConfirmed) {
        await rejectCoach(id);
      }
    });


    if (result.isConfirmed) {
      await rejectCoach(id);

    }
  };

  const handleSubmitPracticalAssesment = (e) => {
    e.preventDefault();

    if (!venueState || !selectedClass || !selectedDate || !venueManager) {
      alert("Please fill all fields");
      return;
    }

    const payloadd = {

    };
    setPayload(prev => ({
      ...prev,
      bookPracticalAssessment: [
        {
          venueId: parseInt(venueState), // assuming input is numeric ID
          classId: selectedClass.value,
          date: selectedDate, // assuming dateOptions have `value` as YYYY-MM-DD
          assignToVenueManagerId: venueManager.value,
        },
      ],
    }));
    setOpenCandidateStatusModal(false)
    // console.log("Payload:", payloadd);
    // send payload to your API here
  };
  const handleSubmit = async () => {
    showConfirm("Are you sure?", "Once you submit this recruitment, you will not be able to edit or fill any fields again. Please carefully review all your entries before submitting. Only submit when everything is confirmed and correct.", "warning").then(async (result) => {
      if (result.isConfirmed) {
        await submitRecruitment(id);
      }
    });


    // If user cancels, stop execution
    if (!result.isConfirmed) return;

    if (comesfrom === "coach") {
      const payloadMain = {
        recruitmentLeadId: id,
        howDidYouHear: form.heardFrom,
        ageGroupExperience: form.ageGroup,
        accessToOwnVehicle: form.vehicle === "Yes",
        whichQualificationYouHave: form.qualification,
        footballExperience: form.experience,
        availableVenueWork: selectedVenueNames,
        coverNote: form.coverNote,
        qualifyLead: payload.qualifyLead,
        telephoneCallSetupDate: payload.telephoneCallSetupDate,
        telephoneCallSetupTime: payload.telephoneCallSetupTime,
        // "telephoneCallSetupReminder": 15,
        telephoneCallSetupEmail: payload.telephoneCallSetupEmail,
        telePhoneCallDeliveryCommunicationSkill: payload.telePhoneCallDeliveryCommunicationSkill,
        telePhoneCallDeliveryPassionCoaching: payload.telePhoneCallDeliveryPassionCoaching,
        telePhoneCallDeliveryExperience: payload.telePhoneCallDeliveryExperience,
        telePhoneCallDeliveryKnowledgeOfSSS: payload.telePhoneCallDeliveryKnowledgeOfSSS,
        bookPracticalAssessment: payload.bookPracticalAssessment,
      };
      await createCoachRecruitmentById(payloadMain);
      console.log("Submit Payload (coach):", payloadMain);
    }
    else if (comesfrom === "venueManager") {
      const payloadMain = {
        recruitmentLeadId: id,
        howDidYouHear: form.heardFrom,
        ageGroupExperience: form.ageGroup,
        accessToOwnVehicle: form.vehicle === "Yes",
        whichQualificationYouHave: form.qualification,
        footballExperience: form.experience,
        availableVenueWork: selectedVenueNames,
        coverNote: form.coverNote,
        qualifyLead: payload.qualifyLead,
        telephoneCallSetupDate: payload.telephoneCallSetupDate,
        telephoneCallSetupTime: payload.telephoneCallSetupTime,
        // "telephoneCallSetupReminder": 15,
        telephoneCallSetupEmail: payload.telephoneCallSetupEmail,
        telePhoneCallDeliveryCommunicationSkill: payload.telePhoneCallDeliveryCommunicationSkill,
        telePhoneCallDeliveryPassionCoaching: payload.telePhoneCallDeliveryPassionCoaching,
        telePhoneCallDeliveryExperience: payload.telePhoneCallDeliveryExperience,
        telePhoneCallDeliveryKnowledgeOfSSS: payload.telePhoneCallDeliveryKnowledgeOfSSS,
        bookPracticalAssessment: payload.bookPracticalAssessment,
      };
      await createVenuManagerRecruitmentById(payloadMain);
      console.log("Submit Payload (coach):", payloadMain);
    } else {
      const payloadMain = {
        recruitmentLeadId: id,
        howDidYouHear: form.heardFrom,
        ageGroupExperience: form.ageGroup,
        accessToOwnVehicle: form.vehicle === "Yes",
        whichQualificationYouHave: form.qualification,
        footballExperience: form.experience,
        availableVenueWork: selectedVenueNames,
        coverNote: form.coverNote,
        qualifyLead: payload.qualifyLead,
        telephoneCallSetupDate: payload.telephoneCallSetupDate,
        telephoneCallSetupTime: payload.telephoneCallSetupTime,
        // "telephoneCallSetupReminder": 15,
        telephoneCallSetupEmail: payload.telephoneCallSetupEmail,
        telePhoneCallDeliveryCommunicationSkill: payload.telePhoneCallDeliveryCommunicationSkill,
        telePhoneCallDeliveryPassionCoaching: payload.telePhoneCallDeliveryPassionCoaching,
        telePhoneCallDeliveryExperience: payload.telePhoneCallDeliveryExperience,
        telePhoneCallDeliveryKnowledgeOfSSS: payload.telePhoneCallDeliveryExperience,
        bookPracticalAssessment: payload.bookPracticalAssessment,
      };
      await createCoachRecruitmentById(payloadMain);
      console.log("Submit Payload (coach):", payloadMain);
    }
  };
  // console.log('payload', payload)
  const handleCoachMail = async (id) => {
    showConfirm("Are you sure?", "Do you want to send the mail?", "warning").then(async (result) => {
      if (result.isConfirmed) {
        await sendCoachMail([id]);
      }
    });


  };
  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "recruited":
        return "text-[#34AE56] bg-[#E5F2EA]";
      case "pending":
        return "text-[#B38F00] bg-[#FFF7CC]";   // yellow tone
      case "rejected":
        return "text-[#D11A2A] bg-[#FFE5E8]";   // red tone
      default:
        return "text-gray-600 bg-gray-200";
    }
  };

  const safe = (v) => v !== null && v !== undefined && v !== "";
  const handleDownload = () => {
    if (pdfLoading) return;
    setPdfLoading(true);

    try {
      const d = recuritmentDataById || {};
      const p = d.candidateProfile || {};

      const personalInfo = [];
      safe(d.email) && personalInfo.push(["Email", d.email]);
      safe(d.phoneNumber) && personalInfo.push(["Phone", d.phoneNumber]);
      safe(d.dob) && personalInfo.push(["DOB", d.dob]);
      safe(d.age) && personalInfo.push(["Age", String(d.age)]);
      safe(d.gender) && personalInfo.push(["Gender", d.gender]);
      safe(d.postcode) && personalInfo.push(["Postcode", d.postcode]);

      const professionalInfo = [];
      safe(d.managementExperience) &&
        professionalInfo.push(["Management Experience", d.managementExperience]);
      safe(p.footballExperience) &&
        professionalInfo.push(["Football Experience", p.footballExperience]);
      safe(p.whichQualificationYouHave) &&
        professionalInfo.push(["Qualification", p.whichQualificationYouHave]);
      safe(p.accessToOwnVehicle) &&
        professionalInfo.push([
          "Access to Own Vehicle",
          p.accessToOwnVehicle ? "Yes" : "No",
        ]);

      const assessmentInfo = [];
      safe(p.result) && assessmentInfo.push(["Result", p.result]);
      safe(d.telephoneCallScorePercentage) &&
        assessmentInfo.push([
          "Telephone Score",
          `${d.telephoneCallScorePercentage}%`,
        ]);

      const docDefinition = {
        pageSize: "A4",
        pageMargins: [40, 60, 40, 60],

        content: [
          {
            text: `${d.firstName || ""} ${d.lastName || ""}`,
            style: "header",
          },
          safe(d.appliedFor)
            ? { text: `Applied For: ${d.appliedFor}`, style: "subheader" }
            : {},

          personalInfo.length && {
            text: "Personal Information",
            style: "section",
          },
          personalInfo.length && {
            table: {
              widths: ["30%", "70%"],
              body: personalInfo,
            },
            layout: "lightHorizontalLines",
          },

          professionalInfo.length && {
            text: "Professional Details",
            style: "section",
            margin: [0, 15, 0, 5],
          },
          professionalInfo.length && {
            table: {
              widths: ["30%", "70%"],
              body: professionalInfo,
            },
            layout: "lightHorizontalLines",
          },

          safe(p.coverNote) && {
            text: "Cover Note",
            style: "section",
            margin: [0, 15, 0, 5],
          },
          safe(p.coverNote) && {
            text: p.coverNote,
            italics: true,
          },

          assessmentInfo.length && {
            text: "Assessment Summary",
            style: "section",
            margin: [0, 15, 0, 5],
          },
          assessmentInfo.length && {
            table: {
              widths: ["30%", "70%"],
              body: assessmentInfo,
            },
            layout: "lightHorizontalLines",
          },
        ].filter(Boolean),

        styles: {
          header: { fontSize: 20, bold: true },
          subheader: { fontSize: 11, margin: [0, 5, 0, 15] },
          section: { fontSize: 14, bold: true },
        },
      };

      pdfMake.createPdf(docDefinition).download(
        `${d.firstName || "Candidate"}_CV.pdf`
      );
    } catch (err) {
      console.error("CV generation failed", err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <button
        className={`p-3 capitalize font-bold px-10 absolute right-0 top-0 rounded-2xl ${getStatusStyles(form.status)}`}
      >
        {form.status}
      </button>

      {/* <button className="p-3 text-white font-bold bg-[#D95858] px-10 absolute right-0 top-0 rounded-2xl">
        Rejected
      </button> */}
      <div className='flex gap-8'>
        <div className="md:w-8/12">

          {/* Section: Candidate Information */}
          <div className="bg-white rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-[24px]">Candidate Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/** FIRST NAME */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">First Name</label>
                <input
                  type="text"
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Tom"
                />
              </div>

              {/** SURNAME */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Surname</label>
                <input
                  type="text"
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  value={form.surname}
                  onChange={(e) => handleChange("surname", e.target.value)}
                  placeholder="John"
                />
              </div>

              {/** DOB */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Date of Birth</label>
                <input
                  type="date"
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </div>

              {/** AGE */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Age</label>
                <input
                  type="number"
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  placeholder="25"
                />
              </div>

              {/** EMAIL */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Email</label>
                <input
                  type="email"
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@gmail.com"
                />
              </div>

              {/** PHONE */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Phone number</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3">
                  <PhoneInput
                    country="uk"
                    value="+44"
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
                    className="border-none w-full focus:outline-none"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91"
                  />
                </div>
              </div>

              {/** POSTCODE */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">London Postcode</label>
                <input
                  type="text"
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  value={form.postcode}
                  onChange={(e) => handleChange("postcode", e.target.value)}
                  placeholder="SW15 0AB"
                />
              </div>

              {/** HEARD FROM */}
              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">How did you hear about us?</label>
                <select
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  value={form.heardFrom}
                  onChange={(e) => handleChange("heardFrom", e.target.value)}
                >
                  <option value="Indeed">Indeed</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">Linked In</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>

            </div>
          </div>

          {/* Job Specifications */}
          <div className="bg-white rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-[24px]">Job Specifications</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Age Groups */}
              <div>
                <p className="font-semibold text-[18px] mb-2">Age groups experience</p>
                <div className="space-y-2">
                  {["4-6", "7-9", "10-12", "13-16"].map((age) => (
                    <label key={age} className="flex items-center gap-3 cursor-pointer select-none">

                      <input
                        type="radio"
                        name="ageGroup"
                        value={age}
                        checked={form.ageGroup === age}
                        onChange={(e) => handleChange("ageGroup", e.target.value)}
                        className="peer hidden"
                      />

                      <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white">
                        <Check className="p-[2px]" />
                      </span>

                      {age}
                    </label>
                  ))}
                </div>
              </div>

              {/* VEHICLE */}
              <div>
                <p className="font-semibold text-[18px] mb-2">Access to your own vehicle?</p>
                <div className="space-y-2">
                  {["Yes", "No"].map((v) => (
                    <label key={v} className="flex items-center gap-3 cursor-pointer select-none">

                      <input
                        type="radio"
                        value={v}
                        checked={form.vehicle === v}
                        onChange={(e) => handleChange("vehicle", e.target.value)}
                        className="peer hidden"
                      />

                      <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white">
                        <Check className="p-[2px]" />
                      </span>

                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* QUALIFICATIONS */}
              <div>
                <p className="font-semibold text-[18px] mb-2">Which qualifications do you have?</p>
                <div className="space-y-2">
                  {["Bachelor's Degree", "Level one in football", "Level two in football", "Higher level"].map((q) => (
                    <label key={q} className="flex items-center gap-3 cursor-pointer select-none">

                      <input
                        type="radio"
                        value={q}
                        checked={form.qualification === q}
                        onChange={(e) => handleChange("qualification", e.target.value)}
                        className="peer hidden"
                      />

                      <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white">
                        <Check className="p-[2px]" />
                      </span>

                      {q}
                    </label>
                  ))}
                </div>
              </div>

              {/* EXPERIENCE */}
              <div>
                <p className="font-semibold text-[18px] mb-2">How many years football coaching experience?</p>
                <div className="space-y-2">
                  {["0-1 year", "2 years", "3 years", "More than 3 years", "None"].map((ex) => (
                    <label key={ex} className="flex items-center gap-3 cursor-pointer select-none">

                      <input
                        type="radio"
                        value={ex}
                        checked={form.experience === ex}
                        onChange={(e) => handleChange("experience", e.target.value)}
                        className="peer hidden"
                      />

                      <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white">
                        <Check className="p-[2px]" />
                      </span>

                      {ex}
                    </label>
                  ))}
                </div>
              </div>

              {/* VENUES */}
              <div className="md:col-span-2">
                <p className="font-semibold text-[18px] mb-2">Which venues are you available for work?</p>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {venues.map((venue) => {
                      const checked = form.venues.includes(venue.id);

                      return (
                        <label
                          key={venue.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          {/* Hidden native checkbox */}
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleVenueChange(venue.id)}
                            className="sr-only"
                          />

                          {/* Custom checkbox */}
                          <div
                            className={`min-w-4.5 min-h-4.5 flex items-center justify-center rounded border
              ${checked
                                ? "bg-[#2563EB] border-[#2563EB]"
                                : "bg-white border-gray-300"
                              }`}
                          >
                            {checked && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Venue name */}
                          <span>{venue.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Further Details */}
          <div className="bg-white mt-4 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[24px]">Further Details</h2>

            <button
              onClick={handleDownload}
              disabled={pdfLoading}
              className={`px-4 py-2.5 rounded-lg text-sm text-white
        ${pdfLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#237FEA]"}`}
            >
              {pdfLoading ? "Generating CV..." : "Download CV"}
            </button>

            <textarea
              className="input border border-[#E2E1E5] bg-[#FAFAFA] rounded-xl w-full p-3 h-32 resize-none"
              value={form.coverNote}
              onChange={(e) => handleChange("coverNote", e.target.value)}
              placeholder="Cover Note"
            ></textarea>
          </div>

          {/* SUBMIT BUTTON */}
          {form.status !== 'recruited' && (!recuritmentDataById.candidateProfile || Object.keys(recuritmentDataById.candidateProfile).length === 0) && (
            <button
              onClick={handleSubmit}
              className='bg-[#237FEA] mt-2 p-3 ml-6 rounded-xl text-white hover:bg-[#237FEA]'
            >
              Submit
            </button>
          )}


          {/* comments */}

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
                    <p className="text-[#494949] text-[16px] font-semibold mb-1">{c.comment}</p>
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
                  <div className="flex justify-end items-center gap-2 mt-4">
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
                        className={`px-3 py-1 rounded-lg border ${currentPage === i + 1 ? 'bg-[#237FEA] text-white border-[#237FEA]' : 'border-gray-300 hover:bg-gray-100'}`}
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

        <div className="md:w-4/12  space-y-6">

          {/* MAIN CARD */}
          <div className="bg-white p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-semibold">Recruitment status</h2>

            <div className="relative pl-6 space-y-10">
              <div className="absolute left-[17px] top-1 bottom-6 border-l border-gray-300"></div>

              {steps.map(step => (
                <div
                  key={step.id}
                  className={`relative ps-[20px] ${recruitedMode
                    ? ""
                    : !step.isEnabled
                      ? "opacity-40 cursor-not-allowed pointer-events-none"
                      : ""
                    }`}
                >
                  {/* DOT */}
                  <div className="absolute -left-3 top-1 w-3 h-3 rounded-full bg-black"></div>

                  {/* HEADER */}
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{step.title}</p>

                    {step.status !== "completed" && (
                      <button
                        disabled={recruitedMode}
                        className="text-gray-400 text-sm"
                        onClick={() => toggleStep(step.id, "skipped")}
                      >
                        Skip
                      </button>
                    )}
                    {/* {step.status === "skipped" && step.isEnabled && (
                      <button
                        disabled={recruitedMode}
                        className="text-blue-600 text-sm mt-2"
                        onClick={() => toggleStep(step.id, "pending")}
                      >
                        Unskip
                      </button>
                    )} */}
                  </div>

                  {/* QUALIFY BUTTONS */}
                  {step.actionType === "buttons" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        className={`w-8 h-8 border rounded-lg ${step.status === "skipped"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-500"
                          }`}
                        onClick={() => !recruitedMode && toggleStep(step.id, "skipped")}
                      >
                        ✕
                      </button>
                      <button

                        disabled={recruitedMode}
                        className={`w-8 h-8 rounded-lg ${step.status === "completed"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                          }`}
                        onClick={() => !recruitedMode && toggleStep(step.id, "completed")}
                      >
                        ✓
                      </button>
                    </div>
                  )}

                  {/* BUTTON */}
                  {step.buttonText && (
                    <button
                      className={`mt-3 flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl `}
                      onClick={() => {

                        if (step.id === 2) toggleOpenStep(step.id);
                        if (step.id === 3) setRateOpen(true);
                        if (step.id === 4) setOpenCandidateStatusModal(true);

                      }}
                    >
                      {step.buttonText}
                      {step.id === 2 && <IoIosArrowDown />}
                    </button>
                  )}



                  {/* TELEPHONE CALL FORM */}
                  {step.id === 2 && step.isOpen && (
                    <div className="bg-gray-50 rounded-xl p-4 mt-3 space-y-3">
                      <input
                        type="date"
                        disabled={recruitedMode}
                        value={telephoneCall.date}
                        className="border mr-4 rounded-xl p-2"
                        onChange={(e) =>
                          setTelephoneCall({ ...telephoneCall, date: e.target.value })
                        }
                      />

                      <input
                        type="time" disabled={recruitedMode}
                        value={telephoneCall.time}
                        className="border rounded-xl p-2"

                        onChange={(e) =>
                          setTelephoneCall({ ...telephoneCall, time: e.target.value })
                        }
                      />

                      <input
                        type="email"
                        disabled={recruitedMode}
                        value={telephoneCall.email}
                        className="border rounded-xl p-2"
                        placeholder="Candidate email"

                        onChange={(e) =>
                          setTelephoneCall({ ...telephoneCall, email: e.target.value })
                        }
                      />

                      <button
                        disabled={recruitedMode}
                        className="w-full bg-blue-600 text-white py-2 rounded-xl"
                        onClick={confirmTelephoneCall}
                      >
                        Confirm Call
                      </button>
                    </div>
                  )}

                  {/* RESULT */}
                  {step.resultPercent && (
                    <div className="mt-3 flex gap-3">
                      <span className="bg-blue-600 text-white px-3 py-2 rounded-xl">
                        {step.resultPercent}
                      </span>
                      <span className="text-green-600 mt-2">
                        ✓ {step.resultStatus}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* SCORECARD MODAL */}
            {rateOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl w-full max-w-lg p-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Call Scorecard</h3>

                  {["communication", "passion", "experience", "knowledge"].map((key) => (
                    <div key={key} className="mb-4">
                      <p className="capitalize font-semibold mb-2">{key}</p>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className="mr-4">
                          <input
                            type="radio"
                            checked={telephoneCall.scores[key] === n}
                            onChange={() => {
                              // Update scores
                              setTelephoneCall((prev) => ({
                                ...prev,
                                scores: { ...prev.scores, [key]: n },
                              }));

                              // Map and save in delivery state
                              const mapping = {
                                communication: "telePhoneCallDeliveryCommunicationSkill",
                                passion: "telePhoneCallDeliveryPassionCoaching",
                                experience: "telePhoneCallDeliveryExperience",
                                knowledge: "telePhoneCallDeliveryKnowledgeOfSSS",
                              };
                              setTelephoneCallDelivery((prev) => ({
                                ...prev,
                                [mapping[key]]: n,
                              }));
                            }}
                          />{" "}
                          {n}
                        </label>
                      ))}
                    </div>
                  ))}

                  <button
                    className="w-full bg-blue-600 text-white py-2 rounded-xl"
                    onClick={() => {

                      toggleStep(3, "completed"); // mark step completed
                      setRateOpen(false);
                      // console.log("Saved delivery values:", telephoneCallDelivery);
                    }}
                  >
                    Submit Scorecard
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-white p-6 rounded-2xl  space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleCoachMail(id)} className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <Mail size={18} /> <span>Send Email</span>
              </button>

              <button className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <MessageSquare size={18} /> <span>Send Text</span>
              </button>
            </div>

            <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Invite to CoachPro
            </button>
            {/* onClick={() => setOpenCandidateStatusModal(true)} */}
            <button onClick={() => handleRejectCandidate(id)} className="w-full bg-[#237FEA] text-white py-3 rounded-xl">
              Reject Candidate
            </button>
            <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Add to Pathway Course
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Withdraw employment
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Rebook for practical assessment
            </button>

          </div>
        </div>


        {/* call rate modal */}
        {rateOpen && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-4xl shadow-xl  overflow-hidden "
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Interview Questions & Call Scorecard</h2>
                <button
                  onClick={() => setRateOpen(false)}
                  className="absolute top-0 right-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              {/* Left Section */}
              <div className='flex items-center justify-center'>
                <div className="md:w-8/12 h-[80vh] overflow-y-auto p-6 border-r border-gray-200">

                  {/* Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-[#E2E1E5]  pb-4">
                      <span className="text-[#237FEA]"><img src="/reportsIcons/rate.png" className='w-7' alt="" /></span> Title Name
                    </h3>
                    <ul className="mt-4 space-y-4">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <p className='font-semibold text-[16px]'>Check they are free and in a quiet space for the call</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Give them break down for the call</p>
                          <ul className=" list-disc text-gray-600 mt-2">
                            <li className='list-none'>(A) Explain 2 steps recruitment process</li>
                            <li className='list-none'>(B) Housekeeping</li>
                            <li className='list-none'>(C) Interview Q</li>
                            <li className='list-none'>(D) Address any question they have</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Process</p>
                          <span className="text-green-600">2 steps</span>
                          <ul className=" list-disc text-gray-600 mt-2">
                            <li className='list-none'>(A) Phone call</li>
                            <li className='list-none'>(B) Practical assessment - taking place next week and week after</li>
                          </ul>
                          <p className="text-black underline cursor-pointer mt-2">Any questions?</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>
                        <div>
                          <p className="font-semibold text-[16px]">Title Name</p>
                          <span className="text-green-600">2 steps</span>
                          <ul className=" list-disc text-gray-600 mt-2">
                            <li className='list-none'>(A) Phone call</li>
                            <li className='list-none'>(B) Practical assessment - taking place next week and week after</li>
                          </ul>
                          <p className="text-black underline cursor-pointer mt-2">Any questions?</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Section 2 */}
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-[#E2E1E5]  pb-4">
                      <span className="text-[#237FEA]"><img src="/reportsIcons/rate.png" className='w-7' alt="" /></span> Title Name
                    </h3>
                    <div className="mt-4">
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 text-xl"><IoMdCheckmarkCircle />
                        </span>

                        <div>
                          <span>Housekeeping</span>
                          <ul className=" list-disc p-0 text-gray-600 mt-2">
                            <li className='list-none'>(A) Check all info on their form is correct</li>
                            <li className='list-none'>(B) Go through venues and ask if they are available for any more if chosen are not available</li>
                          </ul>
                          <div className="mt-6">
                            <p className="font-semibold">Questions</p>
                            <p className="text-[#494949] mt-1">What do you know about SSS?</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Section - Scorecard */}
                <div className="w-4/12 h-[80vh] overflow-y-auto p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Call Scorecard</h3>

                    {["Communication skill", "Passion for coaching", "Experience", "Knowledge of SSS"].map((label) => (
                      <div key={label} className="mb-6">
                        <p className="font-semibold mb-2 text-[#494949]">{label}</p>
                        <div className="flex gap-4 text-[#494949]">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <label key={num} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={label}
                                value={num}
                                checked={telephoneCallDelivery[scoreKeyMap[label]] === num}
                                onChange={() =>
                                  setTelephoneCallDelivery(prev => ({
                                    ...prev,
                                    [scoreKeyMap[label]]: num
                                  }))
                                }
                              />{" "}
                              {num}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={submitScorecard}
                    className="bg-[#237FEA] text-white py-3 rounded-xl w-full font-semibold hover:bg-blue-700 transition-all">
                    Submit
                  </button>
                </div>
              </div>
              {/* Close Button */}

            </motion.div>
          </div >
        )}

        {/* reject/accept modal */}
        {openCandidateStatusModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-xl shadow-xl  overflow-hidden "
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Book Practical Assessment</h2>
                <button
                  onClick={() => setOpenCandidateStatusModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmitPracticalAssesment} className="p-6">
                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Venue</label>
                  <select
                    className="border border-[#E2E1E5] w-full rounded-2xl p-3"
                    value={venueState}
                    onChange={(e) => setVenueState(e.target.value)}
                  >
                    <option value="">Select Venue</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>

                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Class</label>
                  <Select
                    options={classOptions}
                    placeholder="Select Class"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    value={selectedClass}
                    onChange={setSelectedClass}
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Date</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholderText="Select Date"
                    className="border border-[#E2E1E5] w-full rounded-2xl p-3"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">Assign To Venue Manager</label>
                  <Select
                    options={venueOptions}
                    placeholder="Venue Manager"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    value={venueManager}
                    onChange={setVenueManager}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-12">
                  <button
                    type="button"
                    className="w-full p-3 border border-[#E2E1E5] text-[#717073] font-semibold rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full p-3 border border-[#E2E1E5] bg-[#237FEA] text-white font-semibold rounded-2xl"
                  >
                    Send Confirmation
                  </button>
                </div>
              </form>


            </motion.div>
          </div >
        )}

        {/* result modal */}
        {openResultModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Result</h2>
                <button
                  onClick={() => setOpenResultModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form action="" className='p-6'>
                <div className='mb-3'>
                  <label htmlFor="" className='text-black font-semibold text-[16px] mb-2 block'>Venue</label>
                  <input type="text" className='border border-[#E2E1E5]  w-full rounded-2xl p-3' />
                </div>



                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Class
                  </label>
                  <Select
                    options={classOptions}
                    placeholder="Select Class"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Date
                  </label>
                  <Select
                    options={dateOptions}
                    placeholder="Select Date"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Regional Manager
                  </label>

                  <Select
                    options={regionalManagerOptions}
                    placeholder="Select Regional Manager"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-6">Call Scorecard</h3>

                  {[
                    "Punctuality of the coach",
                    "Status of the campus",
                    "Punctuality of the coach"
                  ].map((label) => (
                    <div key={label} className="mb-6">
                      <p className="font-semibold mb-2 text-[#494949]">{label}</p>
                      <div className="flex gap-4 text-[#494949]">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <label key={num} className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name={label} value={num} /> {num}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Watch Video</button>
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Play Audio Summary</button>
                </div>
              </form>


            </motion.div>
          </div >
        )}
        {/* tick offer modal */}
        {openOfferModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Send Offer of Employment</h2>
                <button
                  onClick={() => setOpenOfferModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form action="" className='p-6'>
                <div className="mb-3 relative">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Venue
                  </label>

                  {/* Search Icon */}
                  <span className="absolute left-4 top-11 text-gray-400">
                    <Search />
                  </span>

                  <input
                    type="text"
                    placeholder="Search"
                    className="border border-[#E2E1E5]  w-full rounded-2xl p-3 pl-12"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Pay rate per hour
                  </label>

                  <Select
                    options={payRateOptions}
                    placeholder="Select pay rate"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-black font-semibold text-[16px] mb-2 block">
                    Start Date
                  </label>

                  <Select
                    options={dateOptions}
                    placeholder="Select Start Date"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className=" mt-8">
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Send Email Offer</button>
                </div>
              </form>


            </motion.div>
          </div >
        )}

      </div >
    </>
  )
}

export default CandidateInfo
