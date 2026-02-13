import React, { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { FaPlus } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import { RxCross2 } from "react-icons/rx";
import { useAccountsInfo } from "../../contexts/AccountsInfoContext";
import { FaSave, FaEdit } from "react-icons/fa";
import { useNotification } from "../../contexts/NotificationContext";

import { showError, showSuccess, showWarning } from "../../../../../utils/swalHelper";

const StudentProfile = () => {
  const [editStudent, setEditStudent] = useState({});
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const { students, setStudents, handleUpdateHoliday, mainId } = useAccountsInfo();

  const { adminInfo } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  const [newStudent, setNewStudent] = useState({
    studentFirstName: "",
    studentLastName: "",
    dateOfBirth: null,
    age: "",
    gender: "",
    medicalInformation: "",
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

  // --- Input handlers ---
  // --- modal input change only updates newStudent ---
  const handleModalChange = (field, value) => {
    setNewStudent((prev) => ({ ...prev, [field]: value }));
  };

  // --- DOB change inside modal ---
  const handleDOBChange = (index, date, isModal = false) => {
    const today = new Date();
    let age = "";
    if (date) {
      const diff = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      age =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? diff - 1
          : diff;
    }

    if (isModal) {
      setNewStudent((prev) => ({ ...prev, dateOfBirth: date, age }));
    } else {
      const updated = [...students];
      updated[index] = { ...updated[index], dateOfBirth: date, age };
      setStudents(updated);
    }
  };

  const fetchComments = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/comment/list`, {
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
      showError("Failed to fetch comments", error.message || error.error || "Please try again later.");

    }
  }, []);



  useEffect(() => {
    fetchComments();
  }, [])

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


      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/comment/create`, requestOptions);

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
  const formatLocalDate = (date) => {
    if (!date) return null;
    const local = new Date(date);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset()); // adjust to local
    return local.toISOString().split("T")[0]; // yyyy-mm-dd, stays same as selected
  };

  // --- Add Student ---
  const handleAddStudent = () => {
    if (!newStudent.studentFirstName && !newStudent.studentLastName) {
      showWarning("Missing Name", "Please enter at least first or last name.");

      return;
    }
    if (!newStudent.medicalInformation) {
      showWarning("Medical Information Missing", "Please enter Medical Information.");

      return;
    }
    if (!newStudent.dateOfBirth) {
      showWarning("Date of Birth Missing", "Please select date of birth.");

      return;
    }

    // Age
    if (!newStudent.age) {
      showWarning("Age Missing", "Please enter age.");

      return;
    }

    // Gender
    if (!newStudent.gender) {
      showWarning("Gender Missing", "Please select gender.");
      return;
    }
    // Create the updated students array
    const updatedStudents = [
      ...students,
      {
        ...newStudent,
        dateOfBirth: formatLocalDate(newStudent.dateOfBirth)
      }
    ];
    // Update local state
    setStudents(updatedStudents);

    // Call API update
    handleUpdateHoliday('students', updatedStudents);

    // Reset modal
    setShowModal(false);
    setNewStudent({
      studentFirstName: "",
      studentLastName: "",
      dateOfBirth: null,
      age: "",
      gender: "",
      medicalInformation: "",
    });
  };


  const handleInputChange = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  const handleEditStudents = () => {
    handleUpdateHoliday('students', students)
  }

  return (
    <div className="space-y-10  p-6">
      {/* Add Student Button */}
      <div className="flex justify-end mb-6">
        {students.length < 3 && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-[#237FEA] md:absolute right-0 -top-0 text-sm px-4 py-3 rounded-xl text-white hover:bg-[#1e6fd2] flex items-center gap-2 transition"
          >
            Add Student <FaPlus />
          </button>
        )}
      </div>

      {/* Student List */}
      {students.length === 0 && (
        <p className="text-gray-500 italic text-sm">No student added yet.</p>
      )}

      {students.map((student, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="bg-white mb-10 p-6 rounded-3xl shadow-sm space-y-6"
        >
          <h2
            className="text-xl font-bold text-[#282829] flex items-center gap-3 cursor-pointer"
            onClick={() =>
              setEditStudent((prev) => ({
                ...prev,
                [index]: !prev[index],
              }))
            }
          >
            {editStudent?.[index]
              ? `Editing Student ${index + 1}`
              : `Student ${index + 1} Information`}

            {editStudent?.[index] ? (
              <div
                className="relative group"
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering h2 click
                  handleEditStudents(index);
                }}
              >
                <FaSave className=" hover:text-green-700 cursor-pointer transition" />
                <span className="absolute whitespace-nowrap bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  Click to save
                </span>
              </div>
            ) : (
              <div
                className="relative group"
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering h2 click
                  setEditStudent((prev) => ({
                    ...prev,
                    [index]: true,
                  }));
                }}
              >
                <FaEdit className="hover:text-blue-700 cursor-pointer transition" />
                <span className="absolute whitespace-nowrap bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  Click to edit
                </span>
              </div>
            )}
          </h2>


          {/* Row 1: Names */}
          <div className="flex gap-4">
            <div className="md:w-1/2">
              <label className="block text-[16px] font-semibold">First name</label>
              <input
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Enter first name"
                value={student.studentFirstName}
                onChange={(e) =>
                  handleInputChange(index, "studentFirstName", e.target.value)
                }
                readOnly={!editStudent?.[index]}
              />
            </div>
            <div className="md:w-1/2">
              <label className="block text-[16px] font-semibold">Last name</label>
              <input
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Enter last name"
                value={student.studentLastName}
                onChange={(e) =>
                  handleInputChange(index, "studentLastName", e.target.value)
                }
                readOnly={!editStudent?.[index]}
              />
            </div>
          </div>

          {/* Row 2: DOB + Age */}
          <div className="flex gap-4">
            <div className="md:w-1/2">
              <label className="block text-[16px] font-semibold">Date of birth</label>
              <DatePicker
                withPortal
                selected={student.dateOfBirth}
                onChange={(date) => handleDOBChange(index, date)}
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                dateFormat="dd/MM/yyyy"
                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 3))}
                minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                placeholderText="Select date of birth"
                isClearable
                disabled={!editStudent?.[index]}
              />
            </div>

            <div className="md:w-1/2">
              <label className="block text-[16px] font-semibold">Age</label>
              <input
                type="text"
                value={student.age}
                readOnly
                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-50"
                placeholder="Automatic entry"
              />
            </div>
          </div>

          {/* Row 3: Gender + Medical Info */}
          <div className="flex gap-4">
            <div className="md:w-1/2">
              <label className="block text-[16px] font-semibold">Gender</label>
              <Select
                className="w-full mt-2 text-base"
                classNamePrefix="react-select"
                placeholder="Select gender"
                value={genderOptions.find((option) => option.value === student.gender.toLowerCase()) || null}
                onChange={(selectedOption) =>
                  handleInputChange(index, "gender", selectedOption ? selectedOption.value : "")
                }
                options={genderOptions}
                isDisabled={!editStudent?.[index]}
              />
            </div>

            <div className="md:w-1/2">
              <label className="block text-[16px] font-semibold">Medical information</label>
              <input
                type="text"
                placeholder="Enter medical info"
                value={student.medicalInformation || ""}
                onChange={(e) =>
                  handleInputChange(index, "medicalInformation", e.target.value)
                }
                readOnly={!editStudent?.[index]}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl text-base"
              />
            </div>
          </div>
        </motion.div>
      ))}

      {/* --- Modal for adding new student --- */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0202025c] bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[95%] max-w-lg shadow-lg relative max-h-[90vh] overflow-auto">
            <div className=" gap-7 relative  border-b border-gray-300 pb-3">

              <h3 className="text-xl font-semibold text-center text-[#282829]">Add Student</h3>
              <button
                className="p-2 border-none absolute left-3 top-0"
                onClick={() => setShowModal(false)}
              >
                <RxCross2 />
              </button>
            </div>

            {/* Row 1 */}
            <div className="  mb-4">
              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">First name</label>
                <input
                  type="text"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3 text-base"
                  value={newStudent.studentFirstName}
                  onChange={(e) => handleModalChange("studentFirstName", e.target.value)}
                />
              </div>
              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Surname</label>
                <input
                  type="text"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3 text-base"
                  value={newStudent.studentLastName}
                  onChange={(e) => handleModalChange("studentLastName", e.target.value)}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className=" mb-4">
              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Date of birth</label>
                <DatePicker
                  withPortal
                  selected={newStudent.dateOfBirth}
                  onChange={(date) => handleDOBChange(null, date, true)} // index is null, isModal = true
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3 text-base"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 3))}
                  minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                  isClearable
                />

              </div>
              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Age</label>
                <input
                  type="text"
                  value={newStudent.age}
                  readOnly
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3 text-base bg-gray-50"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className=" mb-6">
              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Gender</label>
                <Select
                  className="mt-1"
                  classNamePrefix="react-select"
                  value={genderOptions.find((o) => o.value === newStudent.gender) || null}
                  onChange={(selected) => handleModalChange("gender", selected ? selected.value : "")}
                  options={genderOptions}
                />
              </div>
              <div className="mt-3">
                <label className="block text-[15px] mb-1 font-semibold">Medical Info</label>
                <input
                  type="text"
                  className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-3 text-base"
                  value={newStudent.medicalInformation}
                  onChange={(e) => handleModalChange("medicalInformation", e.target.value)}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3">

              <button
                className="px-6 py-3 bg-[#237FEA] text-white rounded-xl hover:bg-[#1e6fd2] transition"
                onClick={handleAddStudent}
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment list */}
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
  );
};

export default StudentProfile;
