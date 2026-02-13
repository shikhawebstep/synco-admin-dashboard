import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from "lucide-react";
import { useMembers } from '../../../../contexts/MemberContext';
import Loader from '../../../../contexts/Loader';
import { usePermission } from '../../../../Common/permission';
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import { showSuccess, showError, showWarning } from '../../../../../../../utils/swalHelper';

const Feedback = ({ profile }) => {
  const { checkPermission } = usePermission();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔒 FIXED SERVICE TYPE
  const SERVICE_TYPE = "birthdayParty";
  const DISPLAY_SERVICE_TYPE = "weekly class trial";

  // const bookingId = searchParams.get("id");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const bookingId = profile?.id;
  // const bookingId = profile?.id;
  const { fetchMembers, loading } = useMembers();
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
  // ---------------- STATES ----------------
  const [feedbackData, setFeedbackData] = useState([]);
  const [agentAndClassesData, setAgentAndClassesData] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [resolveData, setResolveData] = useState('');

  const [selectedAgent, setSelectedAgent] = useState({
    id: resolveData?.assignedAgent?.id || null,
    name: resolveData?.assignedAgent
      ? `${resolveData.assignedAgent.firstName} ${resolveData.assignedAgent.lastName}`
      : "",
  }); const [showAgentModal, setShowAgentModal] = useState(false);
  const [openResolve, setOpenResolve] = useState(false);

  const [formData, setFormData] = useState({
    classScheduleId: null,
    agentId: null,
    feedbackType: "",
    category: "",
    notes: "",
  });

  const [selectedUserIds, setSelectedUserIds] = useState([]);




  // ---------------- FETCH FEEDBACK ----------------
  const fetchFeedback = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/feedback/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!result?.status) {
        showError("Error", result.message);
        return;
      }

      // 🎯 ONLY BIRTHDAY PARTY DATA
      setFeedbackData(result.data?.[DISPLAY_SERVICE_TYPE] || []);
    } catch (err) {
      showError("Error", err.message);
    }
  }, []);

  // ---------------- FETCH AGENTS & CLASSES ----------------
  const fetchAgentAndClasses = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/feedback/agent-classes/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!result?.status) {
        showError("Error", result.message);
        return;
      }

      setAgentAndClassesData(result.data || {});
    } catch (err) {
      showError("Error", err.message);
    }
  }, []);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    const load = async () => {
      await fetchMembers();
      await fetchFeedback();
      await fetchAgentAndClasses();
    };
    load();
  }, [fetchMembers, fetchFeedback, fetchAgentAndClasses]);

  // ---------------- OPTIONS ----------------
  const classOptions = useMemo(() => {
    return (agentAndClassesData?.classSchedules || []).map((cls) => ({
      value: cls.id,
      label: `${cls.className} (${cls.day} • ${cls.startTime} - ${cls.endTime})`,
    }));
  }, [agentAndClassesData]);

  const agentOptions = useMemo(() => {
    return (agentAndClassesData?.agents || []).map((agent) => ({
      value: agent.id,
      label: `${agent.firstName} ${agent.lastName}`,
    }));
  }, [agentAndClassesData]);
  const feedbackTypeOptions = [
    { value: "Positive", label: "Positive" },
    { value: "Negative", label: "Negative" },
  ];

  const categoryOptions = [
    { value: "Behavior", label: "Behavior" },
    { value: "Attendance", label: "Attendance" },
  ];
  // ---------------- HANDLERS ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const toggleCheckbox = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };
  const isAllSelected = feedbackData.length > 0 && selectedUserIds.length === feedbackData.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      const allIds = feedbackData.map((user) => user.id);
      setSelectedUserIds(allIds);
    }
  };
  // ---------------- CREATE FEEDBACK ----------------
  const handleSubmit = async () => {
    const { classScheduleId, agentId, feedbackType, category, notes } = formData;

    if (!classScheduleId || !agentId || !feedbackType || !category || !notes) {
      return showError("Error", "All fields are required");
    }
    // classScheduleId
    const payload = {
      bookingId,
      classScheduleId,
      serviceType: DISPLAY_SERVICE_TYPE,
      feedbackType,
      category,
      notes,
      agentAssigned: agentId,
    };

    // Loader skipped

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/feedback/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      showSuccess("Success", result.message);
      setOpenForm(false);
      setFormData({
        classScheduleId: null,
        agentId: null,
        feedbackType: "",
        category: "",
        notes: "",
      });

      fetchFeedback();
    } catch (err) {
      showError("Error", err.message);
    }
  };
  const handleSave = async (id, successCallback) => {
    if (!token) return showError("Error", "Token not found. Please login again.");
    if (!selectedAgent?.id) {
      return showWarning(
        "Agent Required",
        "Please select an agent before saving."
      );
    }
    const myHeaders = new Headers({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    });

    const payload = {
      agentAssigned: selectedAgent?.id,
    };

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: "follow",
    };

    try {
      // Show loading
      // Loader skipped

      const response = await fetch(`${API_BASE_URL}/api/admin/feedback/resolve/${id}`, requestOptions);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Something went wrong");
      }

      // Swal.close();
      showSuccess("Updated!", result?.message || "Information updated successfully.");
      fetchFeedback();
      setShowAgentModal(false)
      setOpenResolve(false);
      setSelectedAgent(null)
      setResolveData('');
      // Dynamic callback after success (e.g., refetch data)
      if (typeof successCallback === "function") {
        successCallback(result);
      }

      return result;
    } catch (error) {
      // Swal.close();
      console.error(error);
      showError("Failed!", error.message || "Something went wrong while updating.");
    }
  };

  useEffect(() => {
    if (openResolve && resolveData?.assignedAgent) {
      setSelectedAgent({
        id: resolveData.assignedAgent.id,
        name: `${resolveData.assignedAgent.firstName} ${resolveData.assignedAgent.lastName}`,
      });
    }
  }, [openResolve, resolveData]);



  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }

  return (
    <>
      <div className={`pt-1 bg-gray-50 min-h-screen md:px-4 ${openResolve ? 'hidden' : 'block'}`}>
        {/* {openResolve && ( */}
        <button
          onClick={() => setOpenForm(true)}
          className="bg-[#237FEA] md:absolute right-0 top-5 flex items-center gap-2 cursor-pointer text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm md:text-base font-semibold"
        >
          <img src="/members/add.png" className="w-5" alt="" />
          Add Feedback
        </button>
        {/* )} */}


        {checkPermission({ module: "account-information", action: "view-listing" }) ? (
          <div className="md:flex md:gap-6 md:mt-0 mt-5">

            <div className={`transition-all duration-300 w-full`}>

              {feedbackData.length > 0 ? (
                <div className="overflow-auto rounded-2xl bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                      <tr className="font-semibold text-[#717073]">
                        <th className="p-4">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={toggleSelectAll}
                              className="w-5 h-5 flex items-center justify-center rounded-md border-2 border-gray-500"
                            >
                              {isAllSelected && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                            </button>
                            Date Submmited
                          </div>
                        </th>
                        <th className="p-4">Type of Feedback</th>
                        <th className="p-4">Venue</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Reason</th>
                        <th className="p-4">Agent Assigned</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {feedbackData.map((user, idx) => {
                        const isChecked = selectedUserIds.includes(user.id);
                        return (
                          <tr key={idx} className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50">
                            <td className="p-4 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleCheckbox(user.id)}
                                  className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? 'border-gray-500' : 'border-gray-300'}`}
                                >
                                  {isChecked && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                                </button>

                                {formatDate(user.createdAt, false)}
                              </div>
                            </td>
                            <td className="p-4" >{user?.feedbackType || '-'}</td>
                            <td className="p-4" >{user?.venue?.name || '-'}</td>
                            <td className="p-4" >{user?.category || '-'}</td>
                            <td className="p-4" >{user?.notes || '-'}
                            </td>
                            <td className="p-4" >{user?.assignedAgent
                              ? `${user.assignedAgent.firstName} ${user.assignedAgent.lastName}`
                              : "-"}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <button className="text-[#EDA600] bg-[#FDF6E5] px-5 rounded-xl p-2">
                                  {user.status
                                    ?.replace(/_/g, " ")
                                    ?.toLowerCase()
                                    ?.replace(/\b\w/g, (char) => char.toUpperCase())}
                                </button>

                                <button onClick={() => {
                                  setOpenResolve(true);
                                  setResolveData(user)
                                }} className='bg-[#237FEA] rounded-xl p-2 px-5  text-white'>
                                  Resolve
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center p-4 border-dotted border rounded-md bg-white">No Data Found</p>
              )}
            </div>


          </div>
        ) : (
          <p className="text-center p-6 text-red-500 font-semibold">
            Not Authorized
          </p>
        )}

        {openForm && (
          <div className="fixed inset-0 bg-[#00000047] bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[95%] md:w-[420px] md:max-h-[90vh] overflow-auto shadow-lg relative">
              <div className="flex relative justify-center items-center border-b border-[#E2E1E5] px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">Add Feedback</h2>
                <button
                  onClick={() => setOpenForm(false)}
                  className="text-gray-500 absolute left-5 top-4  hover:text-gray-800 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Select Class */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Please select the classes you wish to add feedback for
                  </label>

                  <Select
                    options={classOptions}
                    placeholder="Select Class"
                    isSearchable
                    isClearable
                    value={
                      classOptions.find(
                        (opt) => opt.value === formData.classScheduleId
                      ) || null
                    }
                    onChange={(selected) => {
                      setFormData((prev) => ({
                        ...prev,
                        classScheduleId: selected?.value || null,
                      }));
                    }}
                    className="w-full"
                    classNamePrefix="react-select"
                  />

                </div>

                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Feedback type
                  </label>
                  <Select
                    name="feedbackType"
                    options={feedbackTypeOptions}
                    placeholder="Select Type"
                    isClearable
                    isSearchable
                    value={
                      feedbackTypeOptions.find(
                        (opt) => opt.value === formData.feedbackType
                      ) || null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        feedbackType: selected?.value || "",
                      }))
                    }
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-[#282829] mb-1">
                    Category
                  </label>
                  <Select
                    name="category"
                    options={categoryOptions}
                    placeholder="Select Category"
                    isClearable
                    isSearchable
                    value={
                      categoryOptions.find(
                        (opt) => opt.value === formData.category
                      ) || null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: selected?.value || "",
                      }))
                    }
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-[#282829] mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full border border-[#E2E1E5] rounded-xl p-3 h-24 resize-none"
                    placeholder="Write your notes here..."
                  />
                </div>

                {/* Assign Agent */}
                <div>
                  <label className="block text-sm font-semibold text-[#282829] mb-1">
                    Assign agent
                  </label>
                  <Select
                    name="agent"
                    options={agentOptions}
                    placeholder="Select Agent"
                    isClearable
                    isSearchable
                    value={
                      agentOptions.find(
                        (opt) => opt.value === formData.agentId
                      ) || null
                    }
                    onChange={(selected) => {
                      setFormData((prev) => ({
                        ...prev,
                        agentId: selected?.value || null,
                        agentName: selected?.label || "",
                      }));
                    }}
                    className="w-full"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setFormData({
                        className: "",
                        agentId: null,
                        classScheduleId: null,
                        feedbackType: "",
                        category: "",
                        notes: "",
                        agent: "",
                      });
                      setOpenForm(false);
                    }}
                    className="px-5 py-2 rounded-xl border"
                  >
                    Cancel
                  </button>


                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-[#237FEA] text-white rounded-xl"
                  >
                    Submit
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
      <div className={`min-h-screen bg-[#F9F9FB] flex flex-col  p-4 md:p-8 ${openResolve ? 'flex' : 'hidden'}`}>
        {/* Main Card */}
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-sm p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">


            <h2
              className='text-lg font-semibold text-gray-800 flex items-center gap-2 '
              onClick={() => {
                setOpenResolve(false);
                setResolveData('');
              }}>
              <img
                src="/images/icons/arrow-left.png"
                alt="Back"
                className="w-5 h-5 md:w-6 md:h-6"
              />
              Feedback
            </h2>
          </div>

          {/* Feedback Info Table */}
          <div className="divide-y divide-gray-200">
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Agent</span>
              <span className="text-gray-800 font-semibold">{`${resolveData?.assignedAgent?.firstName} ${resolveData?.assignedAgent?.lastName}`}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Date submitted</span>
              <span className="text-gray-800 font-semibold">{formatDate(resolveData?.createdAt, true)}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Venue</span>
              <span className="text-gray-800 font-semibold">{resolveData?.venue?.name}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Class details</span>
              <span className="text-gray-800 font-semibold">{`${resolveData?.classSchedule?.className} (${resolveData?.classSchedule?.day} • ${resolveData?.classSchedule?.startTime} - ${resolveData?.classSchedule?.endTime})`}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Feedback type</span>
              <span className="text-gray-800 font-semibold capitalize">{resolveData?.feedbackType}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-800 font-semibold capitalize">{resolveData?.category}</span>
            </div>
            <div className="flex justify-between py-3 text-sm md:text-base">
              <span className="text-gray-500">Notes</span>
              <span className="text-gray-800 font-semibold max-w-[60%] text-right">
                {resolveData?.notes}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned To Card */}
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-sm mt-6 p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-gray-800 font-semibold mb-3">Assigned to</h3>
            <div className="flex items-center gap-3">
              <img
                src={resolveData?.assignedAgent?.profile || '/members/dummyuser.png'}
                alt="Ethan"
                className="w-10 h-10 rounded-full"
              />
              <span className="text-gray-800 font-semibold">{`${resolveData?.assignedAgent?.firstName} ${resolveData?.assignedAgent?.lastName}`}</span>
            </div>
          </div>
          <button onClick={() => setShowAgentModal(true)} className="text-[#237FEA] font-semibold mt-3 md:mt-0 hover:underline">
            Change
          </button>
        </div>
        {showAgentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-gray-800 font-semibold mb-4">Assign Agent</h3>
              <Select
                options={agentOptions}
                placeholder="Select Agent"
                isClearable
                isSearchable
                value={agentOptions.find((opt) => opt.value === selectedAgent?.id) || null}
                onChange={(selected) => {
                  setSelectedAgent({
                    id: selected?.value || null,
                    name: selected?.label || "",
                  });
                }}
                className="w-full"
                classNamePrefix="react-select"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowAgentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => handleSave(resolveData.id)}                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Resolve Button */}
        <div className="w-full max-w-4xl flex justify-end mt-6">
          <button onClick={() => handleSave(resolveData.id)} className="bg-[#237FEA] hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded-xl">
            Resolve
          </button>
        </div>
      </div>

    </>

  );
};

export default Feedback;
