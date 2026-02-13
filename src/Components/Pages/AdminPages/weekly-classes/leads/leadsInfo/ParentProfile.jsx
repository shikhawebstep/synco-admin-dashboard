import React, { useEffect, useState, useCallback } from "react";
import PhoneInput from "react-phone-input-2";
import { useLocation } from 'react-router-dom';

import "react-phone-input-2/lib/style.css";
import { useNotification } from "../../../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Mail, MessageSquare, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../../../../../../utils/swalHelper";
const ParentProfile = (fetchedData) => {
  const { adminInfo } = useNotification();
  const location = useLocation();
  const [showFreeTrialPopup, setShowFreeTrialPopup] = useState(false);
  const [showMembershipPopup, setShowMembershipPopup] = useState(false);
  const [showAddtoWaitingPoppup, setShowAddtoWaitingPoppup] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("adminToken");
  const [loadingComment, setLoadingComment] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [studentsData, setStudentsData] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const queryParams = new URLSearchParams(location.search);
  const leadId = queryParams.get("id");
  console.log('leadId', leadId)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    postalCode: "",
    childAge: "",
  });

  console.log('fetchedData', fetchedData);

  useEffect(() => {
    if (fetchedData?.fetchedformData) {
      setFormData(fetchedData.fetchedformData);
    }
    const bookings = fetchedData?.leadData?.bookings;

    if (Array.isArray(bookings)) {
      const allStudents = bookings.flatMap(b =>
        (b?.students || []).map(student => ({
          ...student,
          bookingType: b?.bookingType || "unknown", // attach paid/free
          bookingVenue: b?.venue.name || "Venue", // attach paid/free
          bookingId: b?.bookingId,
          bookingScheduleId: b?.classScheduleId
        }))
      );

      setStudents(allStudents);
    }
  }, [fetchedData]);

  const navigate = useNavigate();
  const [country, setCountry] = useState("uk");
  const [commentsList, setCommentsList] = useState([]);
  const [comment, setComment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5;
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleBookFreeTrial = (classId, leadId) => {
    console.log("leadId", leadId);
    navigate("/weekly-classes/find-a-class/book-a-free-trial", {
      state: {
        classId,
        from_lead: "leadDatabase",
        leadId: leadId, // pass dynamically (fallback for safety)
      },
    });
  };

  const handleBookMembership = (classId, leadId) => {
    // Adjust this route if needed
    navigate("/weekly-classes/find-a-class/book-a-membership", {
      state: { classId, from_lead: "leadDatabase", leadId },
    });
  };
  const handleAddToWaitingList = (classId, leadId) => {
    if (!classId || !leadId) {
      console.warn("Missing classId or leadId for adding to waiting list");
      return;
    }

    navigate("/weekly-classes/find-a-class/add-to-waiting-list", {
      state: { classId, from_lead: "leadDatabase", leadId },
    });
  };

  const hasWaitingListClasses = fetchedData?.leadData?.nearestVenues?.some(venue =>
    venue.classSchedules?.some(cls => cls.capacity === 0)
  );
  const handlePhoneChange = (value, data) => {
    setDialCode("+" + data.dialCode);
    setCountry(data.countryCode);
    setFormData((prev) => ({ ...prev, mobile: value.replace(data.dialCode, "").trim() }));
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.floor((now - past) / 1000); // in seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

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
      const response = await fetch(`${API_BASE_URL}/api/admin/lead/comment/list`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      setCommentsList(result?.data || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      showError("Error", error.message || "Failed to fetch comments.");
    }
  }, []);



  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (!token || !comment.trim()) return;

    try {
      /* Loading state handled by UI or we can add a specific loader if needed, 
         but for now we'll skip the Swal loading popup and rely on non-blocking UI updates or let the user wait.
         The original code used Swal.showLoading which is blocking. 
         If blocking is desired, we might need a showLoading helper, but for now we'll stick to error/success. */
      setLoadingComment(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/lead/comment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment }),
      });

      const result = await response.json();

      if (!response.ok) {
        showError("Failed to Add Comment", result.message || "Something went wrong.");
        return;
      }

      // showSuccess("Comment Created", "Comment has been added successfully!");

      setComment("");
      fetchComments();
    } catch (error) {
      console.error("Error creating comment:", error);
      showError("Network Error", error.message || "An error occurred while submitting.");
    } finally {
      setLoadingComment(false)
    }
  };

  const handleSendEmail = useCallback(async (bookingIds, type) => {
    setLoading(true);
    const mybookingIds = [bookingIds];
    const endpoints = {
      paid: "/api/admin/book-membership/send/email",
      free: "/api/admin/book/free-trials/send-email",
      waiting_list: "/api/admin/waiting-list/send-email",
    };

    try {
      const res = await fetch(API_BASE_URL + endpoints[type], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ bookingIds: mybookingIds }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setLoading(false);


      showSuccess("Success!", json.message);
      return json;

    } catch (e) {
      showError("Error", e.message);
      throw e;

    } finally {
      setLoading(false);
      setShowEmailPopup(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);


  const renderPopup = useCallback(
    (title, onClose, onBookClick) => (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-[90%] max-w-md max-h-[80vh] p-6 overflow-y-auto shadow-2xl border border-gray-100 animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition text-xl"
            >
              ✕
            </button>
          </div>

          {/* Venue List */}
          {fetchedData?.leadData?.nearestVenues?.length ? (
            fetchedData.leadData.nearestVenues.map((venue) => {
              const availableClasses = venue.classSchedules?.filter(
                (cls) => cls.id !== 0 && cls.capacity !== 0
              );

              if (!availableClasses?.length) return null;

              return (
                <div
                  key={venue.id}
                  className="mb-6 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                >
                  {/* Venue Name */}
                  <h3 className="text-lg font-bold text-[#237FEA] mb-3">
                    {venue.name}
                  </h3>

                  {/* Class List */}
                  <ul className="space-y-3">
                    {availableClasses.map((cls) => (
                      <li
                        key={cls.id}
                        className="flex justify-between items-center border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 hover:shadow-md transition group"
                      >
                        <span className="font-medium text-gray-700 group-hover:text-[#237FEA] transition">
                          {cls.className}
                        </span>

                        <button
                          type="button"
                          onClick={() => onBookClick(cls.id, leadId)}
                          className="bg-[#237FEA] hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded-lg transition font-medium"
                        >
                          {title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-4">
              No nearest venues found.
            </p>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    ),
    []
  );

  const grouped = studentsData.reduce((acc, student) => {
    const venue = student.bookingVenue;
    if (!acc[venue]) acc[venue] = [];
    acc[venue].push(student);
    return acc;
  }, {});


  function EmailPopup({ loading, grouped, handleSendEmail, close }) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
        <div className={`
        bg-white rounded-2xl w-[90%] md:w-[600px] shadow-2xl border border-gray-100 
        max-h-[80vh] overflow-y-auto p-6 animate-scaleIn
        ${loading ? "opacity-50 pointer-events-none select-none" : ""}
      `}>

          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-800">Send Email</h2>
            <button
              onClick={close}
              className="text-gray-500 hover:text-red-500 transition text-xl"
            >✕</button>
          </div>

          {/* Venue groups */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([venue, students]) => (
              <div
                key={venue}
                className="border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-bold text-[#237FEA] mb-3">{venue}</h3>

                <div className="space-y-3">
                  {students.map((stu, idx) => {
                    const type =
                      stu.bookingType === "waiting list"
                        ? "waiting_list"
                        : stu.bookingType;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendEmail(stu.bookingTrialId, type)}
                        className="w-full p-4 rounded-xl border border-gray-200 hover:bg-gray-50 
                        transition flex flex-col text-left group"
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-800 group-hover:text-[#237FEA] transition capitalize">
                            {stu.studentFirstName} {stu.studentLastName}
                          </p>

                          <span className="bg-[#237FEA] hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded-lg transition font-medium">
                            {type === "paid"
                              ? "Send Membership Email"
                              : type === "free"
                                ? "Send Free Trial Email"
                                : "Send Waiting List Email"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Age {stu.age} • {stu.gender}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const renderAddtoWaiting = (title, onClose, onAddToWaitingList) => (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[90%] max-w-md max-h-[80vh] p-6 overflow-y-auto shadow-2xl border border-gray-100 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition text-xl"
          >
            ✕
          </button>
        </div>

        {/* Venue + Waiting Classes */}
        {fetchedData?.leadData?.nearestVenues?.length ? (
          fetchedData.leadData.nearestVenues.map((venue) => {
            // Only classes fully booked
            const waitingListClasses = venue.classSchedules?.filter(
              (cls) => cls.id && cls.capacity === 0
            );

            if (!waitingListClasses?.length) return null;

            return (
              <div
                key={venue.id}
                className="mb-6 border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                {/* Venue Name */}
                <h3 className="text-lg font-bold text-[#237FEA] mb-3">
                  {venue.name}
                </h3>

                {/* Waiting List Classes */}
                <ul className="space-y-3">
                  {waitingListClasses.map((cls) => (
                    <li
                      key={cls.id}
                      className="flex justify-between items-center border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 hover:shadow-md transition group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-[#237FEA] transition">
                        {cls.className}
                      </span>

                      <button
                        type="button"
                        onClick={() => onAddToWaitingList(cls.id, leadId)}
                        className="bg-[#237FEA] hover:bg-blue-700 text-white px-4 py-1.5 text-sm rounded-lg transition font-medium"
                      >
                        {title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-4">
            No nearest venues found.
          </p>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );



  return (
    <>


      <div className="flex">
        <div className="md:w-[66%] ">

          <div className="bg-white p-6 rounded-xl mt-5">
            <h3 className="font-bold text-[20px] pb-4">Lead Information</h3>

            {/* Name Fields */}
            <div className="md:flex gap-6 mb-4">
              <div className="md:w-1/2">
                <label className="block text-[16px] font-semibold">First Name</label>
                <input
                  name="firstName"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="md:w-1/2">
                <label className="block text-[16px] font-semibold">Last Name</label>
                <input
                  name="lastName"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div className="md:flex gap-6 mb-4">
              <div className="md:w-1/2">
                <label className="block text-[16px] font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="md:w-1/2">
                <label className="block text-[16px] font-semibold">Phone</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-3 mt-1">
                  <PhoneInput
                    country="uk"
                    value="+44"
                    onChange={handlePhoneChange}
                    disableDropdown={true}
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
                    type="number"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter number"
                    className="border-none w-full focus:outline-none flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Postal Code + Age */}
            <div className="md:flex gap-6 mb-3">
              <div className="md:w-1/2">
                <label className="block text-[16px] font-semibold">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Enter postal code"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3"
                />
              </div>
              <div className="md:w-1/2">
                <label className="block text-[16px] font-semibold">Age of Child</label>
                <input
                  type="number"
                  name="childAge"
                  value={formData.childAge}
                  onChange={handleInputChange}
                  placeholder="Enter age"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3"
                />
              </div>
            </div>
          </div>

          <div className="bg-white my-10 rounded-3xl p-6 space-y-4">
            <h2 className="text-[24px] font-semibold">Comment</h2>

            <div className="flex items-center gap-2">
              <img
                src={adminInfo?.profile || "/members/dummyuser.png"}
                alt="User"
                className="w-14 h-14 rounded-full object-cover"
              />
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-[16px] font-semibold outline-none"
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
                  <img src="/images/icons/sent.png" alt="Send" />
                )}
              </button>
            </div>


            {commentsList.length > 0 ? (
              <div className="space-y-4">
                {currentComments.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p className="text-gray-700 text-[16px] font-semibold mb-1">{c.comment}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            c?.bookedByAdmin?.profile ||
                            "/members/dummyuser.png"
                          }
                          alt={c?.bookedByAdmin?.firstName || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <p className="font-semibold text-[#237FEA] text-[16px]">
                          {c?.bookedByAdmin?.firstName} {c?.bookedByAdmin?.lastName}
                        </p>
                      </div>
                      <span className="text-gray-400 text-[16px]">
                        {formatTimeAgo(c.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        type="button"
                        key={i}
                        className={`px-3 py-1 rounded-lg border ${currentPage === i + 1
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-300 hover:bg-gray-100"
                          }`}
                        onClick={() => goToPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
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
        <div className="md:w-[34%]">
          <div className="md:max-w-[510px]">
            {/* Status Header */}


            {/* Details Section */}
            <div className="bg-[#363E49] text-white rounded-4xl p-6 space-y-3">

              <div className="text-white rounded-2xl p-4 relative overflow-hidden" style={{
                backgroundImage: fetchedData?.leadData?.bookings?.[0]?.status === "cancelled"
                  ? "url('/frames/Cancelled.png')"
                  : fetchedData?.leadData?.bookings?.[0]?.status === "frozen"
                    ? "url('/frames/Frozen.png')"
                    : fetchedData?.leadData?.bookings?.[0]?.status === "active"
                      ? "url('/frames/Active.png')"
                      : fetchedData?.leadData?.bookings?.[0]?.status === "request_to_cancel"
                        ? "url('/frames/reqCancel.png')"
                        : fetchedData?.leadData?.bookings?.[0]?.status === "waiting list"
                          ? "url('/frames/Waiting.png')"
                          : "url('/frames/Pending.png')",


                backgroundSize: "cover",
              }}>

                <p className="text-[20px] text-black font-bold relative z-10">Account Status</p>
                <p className="text-sm text-black relative capitalize z-10"> {fetchedData?.leadData?.bookings?.[0]?.status || fetchedData?.leadData?.status || "N/A"}</p>
              </div>
              <div className="border-b border-[#495362] pb-3 flex items-center gap-5">
                <div><img src="/members/user2.png" alt="" /></div>
                <div>  <h3 className="text-lg font-semibold">Assigned Agent</h3>
                  <p className="text-gray-300 text-sm">{fetchedData?.leadData?.assignedAgent?.firstName} {fetchedData?.leadData?.assignedAgent?.lastName}</p></div>
              </div>

              <div className="border-b border-[#495362] pb-3">
                <p className="text-white text-[18px] font-semibold">Nearest Venue</p>
                {fetchedData?.leadData?.nearestVenues?.map((v, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-md mt-1 mr-1"
                  >
                    {v.name}
                  </span>
                ))}

              </div>

              <div className="border-b border-[#495362] pb-3">
                <p className="text-white text-[18px] font-semibold">Date lead was added</p>

                <p className="text-[16px] mt-1 text-[#BDC0C3]">{fetchedData?.leadData?.createdAt
                  ? new Date(fetchedData.leadData.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                  : ""}</p>
              </div>

              <div className="border-b border-[#495362] pb-3">
                <p className="text-white text-[18px] font-semibold">Source</p>
                <p className="text-[16px] mt-1 text-[#BDC0C3]">{fetchedData?.leadData?.status || 'N/A'}</p>
              </div>

              <div className="border-b border-[#495362] pb-3">
                <p className="text-white text-[18px] font-semibold">Last Contact Date</p>
                <p className="text-[16px] mt-1 text-[#BDC0C3]">{fetchedData?.leadData?.updatedAt
                  ? new Date(fetchedData.leadData.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                  : ""}</p>
              </div>

              <div>
                <p className="text-white text-[18px] font-semibold">Current status</p>
                <p className="text-[16px] mt-1 text-[#BDC0C3] font-semibold">{fetchedData?.leadData?.bookings?.[0]?.status || fetchedData?.leadData?.status || 'N/A'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 flex flex-col bg-white rounded-3xl mt-5 items-center space-y-3">
              <div className="flex w-full justify-between gap-2">
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2 justify-center border border-[#717073] text-[#717073] rounded-xl font-semibold py-3 text-[18px] hover:bg-gray-50 transition"
                  onClick={() => {
                    setStudentsData(students);   // your array
                    setShowEmailPopup(true);
                  }}
                >
                  <Mail className="w-4 h-4 mr-1" /> Send Email
                </button>
                <button type="button" className="flex-1 flex items-center gap-2 justify-center border border-[#717073] rounded-xl font-semibold py-3 text-[18px] text-[#717073]  hover:bg-gray-50 transition">
                  <MessageSquare className="w-4 h-4 mr-1" /> Send Text
                </button>
              </div>

              <button
                type="button"
                className="w-full bg-[#237FEA] text-white my-3 text-[18px] py-3 rounded-xl font-medium hover:bg-blue-600 transition flex items-center justify-center"
                onClick={() => setShowFreeTrialPopup(true)}
              >
                Book A Free Trial
              </button>
              {showFreeTrialPopup &&
                renderPopup(
                  "Book a Free Trial",
                  () => setShowFreeTrialPopup(false),
                  handleBookFreeTrial
                )}
              {showMembershipPopup &&
                renderPopup(
                  "Book a Membership",
                  () => setShowMembershipPopup(false),
                  handleBookMembership
                )}
              {showAddtoWaitingPoppup &&
                renderAddtoWaiting(
                  "Add to Waiting List",
                  () => setShowAddtoWaitingPoppup(false),
                  handleAddToWaitingList
                )}
              {showEmailPopup && (
                EmailPopup({
                  loading: loading,
                  grouped: grouped,
                  handleSendEmail: handleSendEmail,
                  close: () => setShowEmailPopup(false)
                })
              )}

              <button
                type="button"
                className="w-full bg-[#237FEA] text-white my-3 text-[18px] py-3 rounded-xl font-medium hover:bg-blue-600 transition flex items-center justify-center"
                onClick={() => setShowMembershipPopup(true)}
              >
                Book A Membership
              </button>
              <button
                type="button"
                className={`w-full my-3 text-[18px] py-3 rounded-xl font-medium flex items-center justify-center transition
    ${hasWaitingListClasses
                    ? "bg-[#237FEA] text-white hover:bg-blue-600 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
  `}
                onClick={() => {
                  if (hasWaitingListClasses) setShowAddtoWaitingPoppup(true);
                }}
                disabled={!hasWaitingListClasses}
              >
                Add To Waiting List
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ParentProfile;
