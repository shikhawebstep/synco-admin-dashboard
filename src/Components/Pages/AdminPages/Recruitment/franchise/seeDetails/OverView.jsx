import { useState, useCallback, useEffect } from 'react'
import { useNotification } from '../../../contexts/NotificationContext';
import { Check, Mail, MessageSquare, Search, X, Loader2 } from "lucide-react";
import { IoIosArrowDown } from "react-icons/io";
import { motion } from "framer-motion";
import { IoMdCheckmarkCircle } from "react-icons/io";
import Select from "react-select";
import { useSearchParams } from "react-router-dom";
import PhoneInput from "react-phone-input-2";

import { useRecruitmentTemplate } from '../../../contexts/RecruitmentContext';
import { useVenue } from '../../../contexts/VenueContext';
import Loader from '../../../contexts/Loader';
import { showConfirm, showError, showSuccess } from '../../../../../../utils/swalHelper';
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
const venueOptions = [
  { value: "venue1", label: "Venue 1" },
  { value: "venue2", label: "Venue 2" },
];


const classOptions = [
  { value: "class1", label: "Class 1" },
  { value: "class2", label: "Class 2" },
];

const stats = [
  { label: "Work ethic", value: 70 },
  { label: "Funds", value: 45 },
  { label: "Passion", value: 85 },
  { label: "Funds", value: 25 },
  { label: "Work ethic", value: 70 },
  { label: "Funds", value: 10 },
];
const OverView = ({ steps, setSteps }) => {
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
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
  const [recruitmentData, setRecruitmentData] = useState({
    recruitmentLeadId: 13,
    howDidYouHear: "",
    coverNote: "",
    qualifyLead: false,

    telephoneCallSetupDate: "",
    telephoneCallSetupTime: "",
    telephoneCallSetupReminder: "",
    telephoneCallSetupEmail: "",

    telePhoneCallDeliveryCommunicationSkill: "",
    telePhoneCallDeliveryPassionCoaching: "",
    telePhoneCallDeliveryExperience: "",
    telePhoneCallDeliveryKnowledgeOfSSS: "",

    location: "",
    capitalAvailable: "",
    discoveryDay: [],
  });


  const { fetchCoachRecruitmentById, fetchFranchiseRecruitmentById, recuritmentDataById, sendOfferMail, sendFranchiseMail, rejectFranchise, createFranchiseRecruitmentById } = useRecruitmentTemplate() || {};
  const { fetchVenueNames, venues } = useVenue() || {};
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const comesfrom = searchParams.get("comesfrom");

  const [openCandidateStatusModal, setOpenCandidateStatusModal] = useState(false);
  const [openResultModal, setOpenResultModal] = useState(false);
  const [openOfferModal, setOpenOfferModal] = useState(false);
  const [openDiscoverDayModal, setOpenDiscoverDayModal] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [comment, setComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5; // Number of comments per page
  const { adminInfo } = useNotification();
  const discoveryDayRaw = recuritmentDataById?.candidateProfile?.discoveryDay;

  // Convert string → array
  const getInitialForm = (data) => {
    if (!data) return {
      firstName: "",
      surname: "",
      status: "",
      dob: "",
      age: "",
      email: "",
      phone: "",
      discoveryDayDate: "",
      discoveryDayTime: "",
      postcode: "",
      howDidYouHear: "Indeed",
      location: "",
      capitalAvailable: "",
      ageGroup: "",
      vehicle: "",
      qualification: "",
      experience: "",
      venues: [],
      coverNote: "",
    };

    const discoveryDayRaw = data.candidateProfile?.discoveryDay;
    let discoveryDayArray = [];
    if (typeof discoveryDayRaw === "string") {
      try { discoveryDayArray = JSON.parse(discoveryDayRaw); } catch { discoveryDayArray = []; }
    } else if (Array.isArray(discoveryDayRaw)) {
      discoveryDayArray = discoveryDayRaw;
    }

    const venueWorkRaw = data.candidateProfile?.availableVenueWork;
    let parsedVenues = [];
    try {
      parsedVenues = Array.isArray(venueWorkRaw)
        ? venueWorkRaw
        : venueWorkRaw
          ? JSON.parse(venueWorkRaw)
          : [];
    } catch { parsedVenues = []; }

    return {
      firstName: data.firstName || "",
      surname: data.lastName || "",
      status: data.status || "",
      dob: data.dob || "",
      age: data.age || "",
      email: data.email || "",
      phone: data.phoneNumber || "",
      discoveryDayDate: discoveryDayArray?.[0]?.day || "",
      discoveryDayTime: discoveryDayArray?.[0]?.time || "",
      postcode: data.postcode || "",
      howDidYouHear: data.candidateProfile?.howDidYouHear || "Indeed",
      location: data.candidateProfile?.location || "",
      capitalAvailable: data.candidateProfile?.capitalAvailable || "",
      ageGroup: data.candidateProfile?.ageGroupExperience || "",
      vehicle:
        data.candidateProfile?.accessToOwnVehicle === true
          ? "Yes"
          : data.candidateProfile?.accessToOwnVehicle === false
            ? "No"
            : "",
      qualification: data.candidateProfile?.whichQualificationYouHave || "",
      experience: data.candidateProfile?.footballExperience || "",
      venues: parsedVenues,
      coverNote: data.candidateProfile?.coverNote || "",
    };
  };

  // Initialize
  const [form, setForm] = useState(getInitialForm(recuritmentDataById));

  // Update whenever candidate changes
  useEffect(() => {
    setForm(getInitialForm(recuritmentDataById));
  }, [recuritmentDataById]);


  const recruitedMode = form.status?.toLowerCase() === "recruited";


  // Pagination calculations
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(commentsList.length / commentsPerPage);

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
      showError("Error", "Failed to fetch comments. Please try again later.");

    }
  }, []);


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
        showError("Error", "Failed to Add Comment");

        return;
      }


      // showSuccess("Comment Created", " Comment has been  added successfully!");
      setComment('');
      fetchComments();
    } catch (error) {
      console.error("Error creating member:", error);
      showError("Error", "Network Error");
    } finally {
      setLoadingComment(false);
    }
  }
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleDateChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedVenueNames = venues
    .filter(v => form.venues.includes(v.id))
    .map(v => v.name);
  const handleVenueChange = (id) => {
    setForm((prev) => ({
      ...prev,
      venues: prev.venues.includes(id)
        ? prev.venues.filter((x) => x !== id)
        : [...prev.venues, id],
    }));
  };

  // steps 



  const enableNextStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id + 1
          ? { ...step, isEnabled: true }
          : step
      )
    );
  };

  const updateStepStatus = (id, status) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.id === id) {
          return {
            ...step,
            status,
            isOpen: false,
          };
        }
        return step;
      })
    );

    enableNextStep(id);
  };


  useEffect(() => {
    setSteps(prev =>
      prev.map(step => {
        // 1️⃣ Edit mode OFF → everything disabled
        if (!editMode) {
          // console.log(`🔒 Step ${step.id} disabled → editMode is OFF`);
          return { ...step, isEnabled: false };
        }

        // 2️⃣ Step 1 is always enabled in edit mode
        if (step.id === 1) {
          // console.log(`✅ Step 1 enabled → base step in editMode`);
          return { ...step, isEnabled: true };
        }

        // 3️⃣ Completed or skipped steps remain enabled
        if (step.status === "completed" || step.status === "skipped") {
          // console.log(
          //   `✅ Step ${step.id} enabled → status is ${step.status}`
          // );
          return { ...step, isEnabled: true };
        }

        // 4️⃣ All other steps disabled
        // console.log(
        //   `⛔ Step ${step.id} disabled → not completed/skipped`,
        //   { status: step.status }
        // );

        return { ...step, isEnabled: false };
      })
    );
  }, [editMode]);



  const [telephoneCallDelivery, setTelephoneCallDelivery] = useState({
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
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchComments();
      await fetchFranchiseRecruitmentById(id);
      await fetchVenueNames();
      setLoading(false);
    };


    if (id) init();
  }, [id, fetchFranchiseRecruitmentById, fetchComments, fetchVenueNames]);
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

  useEffect(() => {
    // If no candidate, reset to empty/defaults
    if (!recuritmentDataById) {
      setForm({
        firstName: "",
        surname: "",
        status: "",
        dob: "",
        age: "",
        email: "",
        phone: "",
        discoveryDayDate: "",
        discoveryDayTime: "",
        postcode: "",
        howDidYouHear: "Indeed",
        location: "",
        capitalAvailable: "",
        ageGroup: "",
        vehicle: "",
        qualification: "",
        experience: "",
        venues: [],
        coverNote: "",
      });
      return;
    }

    // Parse venues safely
    const venueWorkRaw = recuritmentDataById?.candidateProfile?.availableVenueWork;
    let parsedVenues = [];
    try {
      parsedVenues = Array.isArray(venueWorkRaw)
        ? venueWorkRaw
        : venueWorkRaw
          ? JSON.parse(venueWorkRaw)
          : [];
    } catch (e) {
      parsedVenues = [];
    }

    // Parse discovery day safely
    const discoveryDayRaw = recuritmentDataById?.candidateProfile?.discoveryDay;
    let discoveryDayArray = [];
    if (typeof discoveryDayRaw === "string") {
      try { discoveryDayArray = JSON.parse(discoveryDayRaw); } catch { discoveryDayArray = []; }
    } else if (Array.isArray(discoveryDayRaw)) {
      discoveryDayArray = discoveryDayRaw;
    }

    setForm({
      firstName: recuritmentDataById.firstName || "",
      surname: recuritmentDataById.lastName || "",
      status: recuritmentDataById.status || "",
      dob: recuritmentDataById.dob || "",
      age: recuritmentDataById.age || "",
      email: recuritmentDataById.email || "",
      phone: recuritmentDataById.phoneNumber || "",
      discoveryDayDate: discoveryDayArray?.[0]?.day || "",
      discoveryDayTime: discoveryDayArray?.[0]?.time || "",
      postcode: recuritmentDataById.postcode || "",
      howDidYouHear: recuritmentDataById?.candidateProfile?.howDidYouHear || "Indeed",
      location: recuritmentDataById?.candidateProfile?.location || "",
      capitalAvailable: recuritmentDataById?.candidateProfile?.capitalAvailable || "",
      ageGroup: recuritmentDataById?.candidateProfile?.ageGroupExperience || "",
      vehicle:
        recuritmentDataById?.candidateProfile?.accessToOwnVehicle === true
          ? "Yes"
          : recuritmentDataById?.candidateProfile?.accessToOwnVehicle === false
            ? "No"
            : "",
      qualification: recuritmentDataById?.candidateProfile?.whichQualificationYouHave || "",
      experience: recuritmentDataById?.candidateProfile?.footballExperience || "",
      venues: parsedVenues,
      coverNote: recuritmentDataById?.candidateProfile?.coverNote || "",
    });
    setTelephoneCall({
      date: recuritmentDataById?.candidateProfile?.telephoneCallSetupDate || "",
      time: recuritmentDataById?.candidateProfile?.telephoneCallSetupTime || "",
      reminder: recuritmentDataById?.candidateProfile?.telephoneCallSetupReminder || "",
      email: recuritmentDataById?.candidateProfile?.telephoneCallSetupEmail || "",
      scores: {
        telePhoneCallDeliveryCommunicationSkill: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryCommunicationSkill ?? null,
        telePhoneCallDeliveryPassionCoaching: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryPassionCoaching ?? null,
        telePhoneCallDeliveryExperience: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryExperience ?? null,
        telePhoneCallDeliveryKnowledgeOfSSS: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
      },
    });
    setRecruitmentData({
      telephoneCallSetupDate: recuritmentDataById?.candidateProfile?.telephoneCallSetupDate || "",
      telephoneCallSetupTime: recuritmentDataById?.candidateProfile?.telephoneCallSetupTime || "",
      telephoneCallSetupReminder: recuritmentDataById?.candidateProfile?.telephoneCallSetupReminder || "",
      telephoneCallSetupEmail: recuritmentDataById?.candidateProfile?.telephoneCallSetupEmail || "",
    });

    setTelephoneCallDelivery({
      telePhoneCallDeliveryCommunicationSkill: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryCommunicationSkill ?? null,
      telePhoneCallDeliveryPassionCoaching: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryPassionCoaching ?? null,
      telePhoneCallDeliveryExperience: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryExperience ?? null,
      telePhoneCallDeliveryKnowledgeOfSSS: recuritmentDataById?.candidateProfile?.telePhoneCallDeliveryKnowledgeOfSSS ?? null,
    });
  }, [recuritmentDataById]);
  // ✅ will re-run if data changes
  useEffect(() => {
    const p = recuritmentDataById?.candidateProfile;

    if (!p) {
      // Reset all steps to pending & disabled
      setSteps(prev =>
        prev.map(step => ({
          ...step,
          status: "pending",
          isEnabled: false,
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
            return { ...step, status: p.qualifyLead ? "completed" : "pending", isEnabled: true };
          case 2:
            return { ...step, status: p.telephoneCallSetupDate?.trim() ? "completed" : "pending", isEnabled: !!p.telephoneCallSetupDate?.trim() };
          case 3:
            return { ...step, status: p.telePhoneCallDeliveryCommunicationSkill ? "completed" : "pending", isEnabled: true };
          case 4:
            return { ...step, status: "completed", isEnabled: true };
          case 5:
            if (p.result) {
              return {
                ...step,
                status: "completed",
                resultPercent: recuritmentDataById.telephoneCallScorePercentage + "%",
                resultStatus: p.result === "passed" ? "Passed" : "Failed",
                isEnabled: true,
              };
            } else {
              return { ...step, status: "pending", isEnabled: false };
            }
          default:
            return step;
        }
      })
    );
  }, [recuritmentDataById]);

  const handleSendOfferMail = async (id) => {
    await sendOfferMail(id);
    setOpenOfferModal(false);
  };
  const handleSendFranchiseMail = async (id) => {
    const result = await showConfirm("Are you sure?", "Do you want to send the franchise mail?");
    if (result.isConfirmed) {
      await sendFranchiseMail(id);
    }

  };
  const handleRejectFranchise = async (id) => {
    const result = await showConfirm("Are you sure?", "Do you want to Reject this Candidate ?");

    if (result.isConfirmed) {
      await rejectFranchise(id);

    }
  };
  const submitScorecard = () => {
    setPayload(prev => ({ ...prev, ...telephoneCallDelivery }));

    updateStepStatus(3, "completed");
    toggleStep(3, "completed");
    setRateOpen(false);
  };
  const updateRecruitment = (key, value) => {
    setRecruitmentData(prev => ({ ...prev, [key]: value }));
  };

  // Toggle completion on click
  const toggleStep = (id, newStatus) => {
    setSteps((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((s) => s.id === id);

      updated[index].status = newStatus;

      // enable next step only when current is completed
      if (newStatus === "completed" && updated[index + 1]) {
        updated[index + 1].isEnabled = true;
      }

      // if skipped — block next step
      if (newStatus === "skipped" && updated[index + 1]) {
        updated[index + 1].isEnabled = false;
      }

      // if unskip, go back to pending
      if (newStatus === "pending") {
        if (index > 0) {
          updated[index].isEnabled = updated[index - 1].status === "completed";
        }
      }
      if (id === 1) {
        setPayload(prev => ({
          ...prev,
          qualifyLead: newStatus === "completed" ? true : null,
        }));
      }
      return updated;
    });
  };

  //steps
  const toggleOpenStep = (id) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === id
          ? { ...step, isOpen: !step.isOpen }
          : step
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
  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      console.log("Submit Payload:", form);

      if (comesfrom === "franchise") {
        const payloadMain = {
          recruitmentLeadId: id,
          howDidYouHear: form.howDidYouHear,
          location: form.location,
          capitalAvailable: form.capitalAvailable,
          coverNote: form.coverNote,
          qualifyLead: payload.qualifyLead,

          telephoneCallSetupDate: recruitmentData.telephoneCallSetupDate,
          telephoneCallSetupTime: recruitmentData.telephoneCallSetupTime,
          telephoneCallSetupReminder: recruitmentData.telephoneCallSetupReminder,

          telePhoneCallDeliveryCommunicationSkill:
            payload.telePhoneCallDeliveryCommunicationSkill,
          telePhoneCallDeliveryPassionCoaching:
            payload.telePhoneCallDeliveryPassionCoaching,
          telePhoneCallDeliveryExperience:
            payload.telePhoneCallDeliveryExperience,
          telePhoneCallDeliveryKnowledgeOfSSS:
            payload.telePhoneCallDeliveryKnowledgeOfSSS,

          discoveryDay: [
            {
              day: form.discoveryDayDate,
              time: form.discoveryDayTime,
            },
          ],
        };

        await createFranchiseRecruitmentById(payloadMain);
      } else {
        console.log("Submit Payload in else:", form);
      }
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  console.log("form data steps", steps);
  if (loading) return <Loader />;

  return (
    <>
      {/* <button className="p-3 text-[#34AE56] font-bold bg-[#E5F2EA] px-10 absolute right-0 top-0 rounded-2xl">
        Recruited
      </button> */}
      {/* <button className="p-3 text-white font-bold bg-[#D95858] px-10 absolute right-0 top-0 rounded-2xl">
        Rejected
      </button> */}
      <div className='flex gap-8'>
        <div className="md:w-8/12">

          {/* Section: Candidate Information */}
          <div className="bg-white  rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-[24px]">Candidate Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">First Name</label>
                <input type="text"
                  disabled={!!form.firstName}
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="Tom" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Surname</label>
                <input type="text"
                  disabled={!!form.surname}
                  value={form.surname}
                  onChange={(e) => handleChange("surname", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="John" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Date of Birth</label>
                <input type="date"
                  disabled={!!form.dob}
                  value={form.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Age</label>
                <input type="number"
                  disabled={!!form.age}
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="25" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Email</label>
                <input type="email"
                  disabled={!!form.email}
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="email@gmail.com" />
              </div>

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
                  <input type="number"
                    disabled={!!form.phone}
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="border-none w-full focus:outline-none" placeholder="+91" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">London Postcode</label>
                <input type="text"
                  disabled={!!form.postcode}
                  value={form.postcode}
                  onChange={(e) => handleChange("postcode", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="SW15 0AB" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">How did you hear about us?</label>
                <select value={form.howDidYouHear}
                  disabled={!!form.howDidYouHear}
                  onChange={(e) => handleChange("howDidYouHear", e.target.value)}
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3">
                  <option value="Google">Google</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Friend">Friend</option>
                  <option value="Flyer">Flyer</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section: Job Specifications */}

          <div className="bg-white my-5 rounded-2xl p-6 ">

            <h2 className="font-semibold text-[24px] pb-3">Franchise specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Location</label>
                <input type="text"
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="input border border-[#E2E1E5]  rounded-xl w-full p-3" placeholder="Chelesa" />
              </div>

              <div className="space-y-1">
                <label className="text-[16px] font-semibold block">Capital available</label>
                <input
                  type="text"
                  value={form.capitalAvailable ? `£${Number(form.capitalAvailable).toLocaleString()}` : ""}
                  onChange={(e) => handleChange("capitalAvailable", e.target.value.replace(/[£,]/g, ""))}
                  className="input border border-[#E2E1E5] rounded-xl w-full p-3"
                  placeholder="£123,123"
                />
              </div>

            </div>
          </div>


          {/* Section: Further Details */}
          <div className="bg-white  rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[24px]">Details</h2>

            <label className="font-semibold text-sm">
              Cover Note
            </label>

            <textarea
              name="coverNote" value={form.coverNote}
              onChange={(e) => handleChange("coverNote", e.target.value)} className="input mt-1 border border-[#E2E1E5]   bg-[#FAFAFA] rounded-xl w-full p-3 h-32 resize-none"
              placeholder="Cover Note"
            ></textarea>
          </div>
          {form.status !== 'recruited' && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`bg-[#237FEA] mt-2 p-3 rounded-xl text-white hover:bg-[#237FEA] ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
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
                type="button"
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

            {/* TIMELINE */}
            <div className="relative pl-6 space-y-10">
              <div className="absolute left-[17px] top-1 bottom-6 border-l border-gray-300" />

              {steps.map((step) => {
                const disabled =
                  !recruitedMode && !step.isEnabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "";

                return (
                  <div key={step.id} className={`relative ps-[20px] ${disabled}`}>
                    {/* DOT */}
                    <div
                      className={`absolute -left-3 top-1 w-3 h-3 rounded-full ${step.status === "completed" ? "bg-black" : "bg-gray-300"
                        }`}
                    />

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

                      {step.status === "skipped" && step.isEnabled && (
                        <button
                          disabled={recruitedMode}
                          className="text-blue-600 text-sm"
                          onClick={() => toggleStep(step.id, "pending")}
                        >
                          Unskip
                        </button>
                      )}
                    </div>

                    {/* ACTION BUTTONS (QUALIFY STEP) */}
                    {step.actionType === "buttons" && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          disabled={recruitedMode}
                          className={`w-8 h-8 border rounded-lg ${step.status === "skipped"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-500"
                            }`}
                          onClick={() => toggleStep(step.id, "skipped")}
                        >
                          ✕
                        </button>

                        <button
                          disabled={recruitedMode}
                          className={`w-8 h-8 rounded-lg ${step.status === "completed"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                          onClick={() => toggleStep(step.id, "completed")}
                        >
                          ✓
                        </button>
                      </div>
                    )}

                    {/* PRIMARY STEP BUTTON */}
                    {step.buttonText && (
                      <button
                        disabled={recruitedMode}
                        className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm"
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

                    {/* STEP 2 — TELEPHONE CALL */}
                    {step.id === 2 && step.isOpen && step.isEnabled && (
                      <div className="bg-gray-50 rounded-xl p-4 mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            disabled={recruitedMode}
                            value={telephoneCall.date}
                            className="border rounded-xl p-2"
                            onChange={(e) =>
                              setTelephoneCall({ ...telephoneCall, date: e.target.value })
                            }
                          />

                          <input
                            type="time"
                            disabled={recruitedMode}
                            value={telephoneCall.time}
                            className="border rounded-xl p-2"
                            onChange={(e) =>
                              setTelephoneCall({ ...telephoneCall, time: e.target.value })
                            }
                          />
                        </div>

                        <input
                          type="email"
                          disabled={recruitedMode}
                          value={telephoneCall.email}
                          className="border rounded-xl p-2 w-full"
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

                    {/* RESULTS */}
                    {step.resultPercent && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm">
                          {step.resultPercent}
                        </span>

                        <span className="text-green-600 font-semibold text-sm">
                          ✓ {step.resultStatus}
                        </span>

                        <button
                          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm"
                          onClick={() => setOpenResultModal(true)}
                        >
                          See Results
                        </button>

                        <button
                          className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm"
                          onClick={() => setOpenOfferModal(true)}
                        >
                          Send Offer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
                              setTelephoneCall(prev => ({
                                ...prev,
                                scores: { ...prev.scores, [key]: n },
                              }));

                              const map = {
                                communication: "telePhoneCallDeliveryCommunicationSkill",
                                passion: "telePhoneCallDeliveryPassionCoaching",
                                experience: "telePhoneCallDeliveryExperience",
                                knowledge: "telePhoneCallDeliveryKnowledgeOfSSS",
                              };

                              setTelephoneCallDelivery(prev => ({
                                ...prev,
                                [map[key]]: n,
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
                      toggleStep(3, "completed");
                      setRateOpen(false);
                    }}
                  >
                    Submit Scorecard
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl ">
            <h2 className="font-semibold mb-4 text-[22px] text-gray-800">
              Recruitment status
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {stats.map((item, index) => (
                <Circle key={index} label={item.label} value={item.value} />
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl  space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleSendFranchiseMail(id)} className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <Mail size={18} /> <span>Send Email</span>
              </button>

              <button className="flex items-center justify-center gap-2 border border-[#717073] rounded-xl py-3">
                <MessageSquare size={18} /> <span>Send Text</span>
              </button>
            </div>

            {/* <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Invite to CoachPro
            </button> */}
            {/* onClick={() => setOpenCandidateStatusModal(true)} */}
            {form.status !== "rejected" && (
              <button
                onClick={() => handleRejectFranchise(id)}
                className="w-full bg-[#237FEA] text-white py-3 rounded-xl"
              >
                Reject Candidate
              </button>
            )}

            {/* <button className="w-full border border-[#E2E1E5]  rounded-xl py-3 text-[#494949]">
              Add to Pathway Course
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Withdraw employment
            </button>
            <button className="w-full bg-[#D95858] text-white py-3 rounded-xl">
              Rebook for practical assessment
            </button> */}

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

                  <button disabled={form.status == 'recruited'} onClick={submitScorecard}
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
                <div className='mb-3'>
                  <label htmlFor="" className='text-black font-semibold text-[16px] mb-2 block'>Assign To Venue Manager</label>
                  <Select
                    options={venueOptions}
                    placeholder="Venue Manager"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-12">
                  <button type='button' className='w-full p-3 border border-[#E2E1E5]  text-[#717073] font-semibold rounded-2xl'>Cancel</button>
                  <button type='submit' className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Send Confirmation</button>
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
              className="bg-white rounded-2xl w-full p-5 max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Send Franchise Provisional Offer</h2>
                <button
                  onClick={() => setOpenOfferModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <h5 className="text-center py-5 font-semibold">Send a provision offer to prospect lead.</h5>


              <button type='submit' onClick={() => handleSendOfferMail(id)}
                className='w-full p-3 border border-[#E2E1E5]  bg-[#237FEA] text-white font-semibold rounded-2xl'>Send Email Offer</button>




            </motion.div>
          </div >
        )}
        {openDiscoverDayModal && (
          <div className="fixed inset-0 bg-black/60 flex  justify-center items-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl"
            >
              <div className="relative mt-6 border-b  border-[#E2E1E5]  pb-5">
                <h2 className="text-xl font-semibold  text-center">Discovery day</h2>

                <button
                  onClick={() => setOpenDiscoverDayModal(false)}
                  className="absolute top-0 left-4 text-black hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateStepStatus(4, "completed");
                  setOpenDiscoverDayModal(false);
                }}
                className="p-6"
              >
                <fieldset disabled={form.status === "recruited"}>
                  <div className="mb-3 relative">
                    <label className="text-black font-semibold text-[16px] mb-2 block">
                      Date
                    </label>
                    <input
                      type="date"
                      name="discoveryDayDate"          // 👈 add this
                      value={form.discoveryDayDate}
                      onChange={(e) => handleDateChange("discoveryDayDate", e.target.value)}
                      className="border border-[#E2E1E5] w-full rounded-2xl p-3"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-black font-semibold text-[16px] mb-2 block">
                      Time
                    </label>
                    <input
                      type="time"
                      name="discoveryDayTime"          // 👈 add this
                      value={form.discoveryDayTime}
                      onChange={(e) => handleDateChange("discoveryDayTime", e.target.value)}

                      className="border border-[#E2E1E5] w-full rounded-2xl p-3"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => setOpenDiscoverDayModal(false)}
                      className="w-full p-3 border border-[#E2E1E5] text-[#717073] font-semibold rounded-2xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full p-3 border border-[#E2E1E5] bg-[#237FEA] text-white font-semibold rounded-2xl"
                    >
                      Book
                    </button>
                  </div>
                </fieldset>
              </form>



            </motion.div>
          </div >
        )}

      </div >
    </>
  )
}

export default OverView
const Circle = ({ label, value }) => {
  return (
    <div className="flex flex-col items-center my-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#1A73E8 ${value * 3.6}deg, #E5E7EB 0deg)`
        }}
      >
        <div className="w-14 h-14 bg-white rounded-full"></div>
      </div>

      <p className="mt-2 text-gray-600 text-sm">{label}</p>
      <p className="text-lg font-semibold">{value}%</p>
    </div>
  );
};