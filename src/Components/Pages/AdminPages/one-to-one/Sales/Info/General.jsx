import { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useNotification } from "../../../contexts/NotificationContext";
import { useMembers } from "../../../contexts/MemberContext";
import { Mail, MessageSquare, AlertTriangle } from "lucide-react";
import { useAccountsInfo } from "../../../contexts/AccountsInfoContext";
import { useLocation } from "react-router-dom";
import { showConfirm, showError, showSuccess, showWarning } from "../../../../../../utils/swalHelper";
const General = () => {
    const { oneToOneData, fetchOneToOneMembers } = useAccountsInfo();
    const location = useLocation();
    const [loadingData, setLoadingData] = useState(false);
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("id"); // <-- this will be "9"  console.log('id',id)
    const [formData, setFormData] = useState({
        student: {
            firstName: oneToOneData?.booking?.students?.[0]?.studentFirstName || "",
            lastName: oneToOneData?.booking?.students?.[0]?.studentLastName || "",
            dob: oneToOneData?.booking?.students?.[0]?.dateOfBirth
                ? new Date(oneToOneData.booking.students[0].dateOfBirth)
                : null,
            age: oneToOneData?.booking?.students?.[0]?.age || "",
            medical: oneToOneData?.booking?.students?.[0]?.medicalInfo || "",
            ability: oneToOneData?.booking?.students?.[0]?.ability || "",
        },
        parent: oneToOneData?.booking?.parents?.map((p) => ({
            firstName: p?.parentFirstName || "",
            lastName: p?.parentLastName || "",
            email: p?.parentEmail || "",
            phone: p?.phoneNumber || "",
            referral: p?.howDidHear || "",
        })) || [{}],
    });
    const [bookingId, setBookingId] = useState([]);

    useEffect(() => {
        if (oneToOneData?.booking?.leadId) {
            setBookingId(prev => [...prev, oneToOneData.booking.leadId]);
        }
    }, [oneToOneData]);


    const [selectedKeyInfo, setSelectedKeyInfo] = useState(null);
    const { sendOnetoOneMail } = useAccountsInfo();
    const [isOpen, setIsOpen] = useState(false);

    const { keyInfoData, fetchKeyInfo } = useMembers();
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
    const keyInfoOptions = keyInfoArray.map((item) => ({
        value: item,
        label: item,
    }));

    // console.log('keyInfoData', keyInfoData)
    const selectedLabel =
        keyInfoOptions.find((opt) => opt.value === selectedKeyInfo)?.label ||
        "Key Information";

    const [isOpenMembership, setIsOpenMembership] = useState(false);
    const [membershipPlan, setMembershipPlan] = useState(null);
    const token = localStorage.getItem("adminToken");
    const { adminInfo } = useNotification();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [sameAsAbove, setSameAsAbove] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

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

    const handleChange = (section, name, value, index = null) => {
        setFormData((prev) => {
            if (section === "parent" && index !== null) {
                const updatedParents = [...prev.parent];
                updatedParents[index] = { ...updatedParents[index], [name]: value };
                return { ...prev, parent: updatedParents };
            }
            return {
                ...prev,
                [section]: { ...prev[section], [name]: value },
            };
        });
    };


    const [paymentData, setPaymentData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        billingAddress: "",
        cardNumber: "",
        expiryDate: "",
        securityCode: "",
    });

    const handlePaymentChange = (e) => {
        setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Payment Data:", paymentData);
        // Add payment processing logic here
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
            showError("Fetch Failed", error.message || "Failed to fetch comments. Please try again later.");

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
                showError("Failed to Add Comment", result.message || "Something went wrong while adding the comment.");

                return;
            }

            showSuccess("Comment Created", result.message || "Comment has been added successfully!");



            setComment('');
            fetchComments();
        } catch (error) {
            console.error("Error creating member:", error);
            showError("Failed to Add Comment", error.message || "An error occurred while adding the comment. Please try again.");
            setLoadingComment(false);
        } finally {
            setLoadingComment(false);
        }
    }

    useEffect(() => {
        fetchComments();
    }, [])

    const status =
        oneToOneData?.status ||
        oneToOneData?.booking?.payment?.paymentStatus ||
        "N/A";

    const getBg = () => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "/frames/Pending.png";
            case "active":
                return "/frames/Active.png";
            case "completed":
                return "/frames/Completed.png";
            case "cancelled":
                return "/frames/Cancelled.png";
            default:
                return "/frames/Default.png"; // fallback if needed
        }
    };




    const hearOptions = [
    { value: "Google", label: "Google" },
    { value: "Facebook", label: "Facebook" },
    { value: "Instagram", label: "Instagram" },
    { value: "Friend", label: "Friend" },
    { value: "Flyer", label: "Flyer" },
  ];
    const studentInputs = [
        { name: "firstName", placeholder: "Enter First Name", type: "text", label: "First Name" },
        { name: "lastName", placeholder: "Enter Last Name", type: "text", label: "Last Name" },
        { name: "dob", placeholder: "Date of Birth", type: "date", label: "Date Of Birth" },
        { name: "age", placeholder: "Automatic Entry", type: "text", label: "Age" },
        { name: "medical", placeholder: "Enter Medical Information", type: "text", label: "Medical Information" },
        { name: "ability", placeholder: "", type: "select", options: ["Select Ability Level"], label: "Ability Levels" },
    ];

    const parentInputs = [
        { name: "firstName", placeholder: "Enter First Name", type: "text", label: "First Name" },
        { name: "lastName", placeholder: "Enter Last Name", type: "text", label: "Last Name" },
        { name: "email", placeholder: "Enter Email", type: "email", label: "Email" },
        { name: "phone", placeholder: "Phone Number", type: "phone", label: "Phone Number" },
        { name: "referral", placeholder: "How did you hear about us?", type: "select", options: hearOptions, label: "How Did You Hear About Us" },
    ];

    const renderInputs = (inputs, section, index = null) => (
        <div className={`grid ${section === "general" ? "md:grid-cols-1" : "md:grid-cols-2"} gap-4`}>
            {inputs.map((input, idx) => (
                <div key={idx}>
                    <label className="block text-[16px] font-semibold">{input.label}</label>

                    {/* TEXT / EMAIL / NUMBER / TEXTAREA */}
                    {["text", "email", "number", "textarea"].includes(input.type) &&
                        (input.type === "textarea" ? (
                            <textarea
                                placeholder={input.placeholder}

                                value={
                                    section === "parent"
                                        ? formData.parent[index]?.[input.name] || ""
                                        : formData[section]?.[input.name] || ""
                                }
                                onChange={(e) => handleChange(section, input.name, e.target.value, index)}
                                className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                            />
                        ) : (
                            <div
                                className={`flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2 ${input.name === "location" || input.name === "address" ? "gap-2" : ""
                                    }`}
                            >
                                {(input.name === "location" || input.name === "address") && (
                                    <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                )}
                                <input
                                    type={input.type}
                                    placeholder={input.placeholder}
                                    disabled={input.name == "age"}
                                    value={
                                        section === "parent"
                                            ? formData.parent[index]?.[input.name] || ""
                                            : formData[section]?.[input.name] || ""
                                    }
                                    onChange={(e) => handleChange(section, input.name, e.target.value, index)}
                                    className="w-full text-base border-none focus:outline-none bg-transparent"
                                />
                            </div>
                        ))}

                    {/* SELECT */}
                    {input.type === "select" && (
                        <Select
                            options={input.options.map((opt) => ({ value: opt, label: opt }))}
                            value={
                                section === "parent"
                                    ? formData.parent[index]?.[input.name]
                                        ? { value: formData.parent[index][input.name], label: formData.parent[index][input.name] }
                                        : null
                                    : formData[section]?.[input.name]
                                        ? { value: formData[section][input.name], label: formData[section][input.name] }
                                        : null
                            }
                            onChange={(selected) =>
                                handleChange(section, input.name, selected?.value || "", index)
                            }
                            className="mt-2"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    borderRadius: "12px",
                                    padding: "5px",
                                    borderColor: "#d1d5db",
                                }),
                            }}
                        />
                    )}

                    {/* DATE */}
                    {input.type === "date" && (
                        <div className="mt-2">
                            <DatePicker
                                withPortal
                                selected={

                                    section === "parent"
                                        ? formData.parent[index]?.[input.name]
                                            ? new Date(formData.parent[index][input.name])
                                            : null
                                        : formData[section]?.[input.name]
                                            ? new Date(formData[section][input.name])
                                            : null
                                }
                                onChange={(date) => handleChange(section, input.name, date, index)}
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
                    )}

                    {/* PHONE */}
                    {input.type === "phone" && (
                        <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2">
                            <PhoneInput
                                country={"uk"}
                                value={
                                    section === "parent"
                                        ? formData.parent[index]?.dialCode || ""
                                        : formData[section]?.dialCode || ""
                                }
                                onChange={(val, data) => {
                                    handleChange(section, "dialCode", val, index);
                                    handleChange(section, "country", data?.countryCode, index);
                                }}
                                disableDropdown={true}
                                disableCountryCode={true}
                                countryCodeEditable={false}
                                inputStyle={{ display: "none" }}
                                buttonClass="!bg-white !border-none !p-0"
                            />
                            <input
                                type="number"
                                placeholder="Enter phone number"
                                value={
                                    section === "parent"
                                        ? formData.parent[index]?.[input.name] || ""
                                        : formData[section]?.[input.name] || ""
                                }
                                onChange={(e) => handleChange(section, input.name, e.target.value, index)}
                                className="border-none w-full focus:outline-none flex-1"
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const handleCancelPackage = async () => {
        const result = await showConfirm(
            "Cancel this package?",
            "This will cancel the selected package for the user."
        );

        if (!result?.isConfirmed) return;

        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Admin token not found. Please login again.");
            return;
        }

        try {
            setLoa(true);

            const response = await fetch(
                `${API_BASE_URL}/api/admin/one-to-one/cancel/${id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Something went wrong");
            }

            showSuccess(data?.message || "Package cancelled successfully.");

            // refresh data
            fetchOneToOneMembers(id);
            // router.refresh();

        } catch (error) {
            showError(error?.message || "Unable to cancel the package.");
        } finally {
            setLoadingData(false);
        }
    };

    const handleRenewPackage = () => {
        showConfirm("Renew this package?", "This will renew the selected package for the user.").then((result) => {

            if (!result.isConfirmed) return;

            const token = localStorage.getItem("adminToken");
            if (!token) {
                showError("Admin token not found. Please login again.");
                return;
            }

            setLoadingData(true);

            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);

            fetch(`${API_BASE_URL}/api/admin/one-to-one/renew/${id}`, {
                method: "PUT",
                headers: myHeaders,
                redirect: "follow",
            })
                .then(async (response) => {
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data?.message || "Something went wrong");
                    }

                    showSuccess(data?.message || "Package renewed successfully.");

                    // Optional refresh
                    fetchOneToOneMembers(id);
                })
                .catch((error) => {
                    showError(error.message || "Unable to renew the package.");
                });
        });
    };






    return (
        <>
            <div className="flex">
                <div className="md:w-[66%] pe-4">
                    <section className="bg-white rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-[#282829] pb-4">Student Information</h3>
                        {renderInputs(studentInputs, "student")}
                    </section>

                    <section className="bg-white rounded-2xl p-4 mt-5">
                        <div className="flex justify-between items-center pb-4">
                            <h3 className="text-xl font-bold text-[#282829]">Parent Information</h3>

                        </div>
                        {formData.parent.map((_, index) => (
                            <div key={index} className="rounded-xl p-4 mb-4 ">
                                {renderInputs(parentInputs, "parent", index)}
                            </div>
                        ))}
                    </section>

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
                <div className="md:w-[34%]">
                    <div className="md:max-w-[510px]">
                        {/* Status Header */}


                        {/* Details Section */}
                        <div className="bg-[#363E49] text-white rounded-4xl p-6 space-y-3">

                            {/* Status */}
                            <div
                                className="text-white rounded-2xl p-4 relative overflow-hidden"
                                style={{
                                    backgroundImage: `url('${getBg()}')`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            >
                                <p className="text-[20px] text-black font-bold relative z-10">Status</p>
                                <p className="text-sm text-black relative z-10 capitalize">
                                    {status}
                                </p>
                            </div>


                            {/* Coach */}
                            <div className="border-b border-[#495362] pb-3 flex items-center gap-5">
                                <div>
                                    <img src="/members/user2.png" alt="Coach" className="w-10 h-10 rounded-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Coach</h3>
                                    <p className="text-gray-300 text-sm">
                                        {oneToOneData?.booking?.coach
                                            ? `${oneToOneData.booking.coach.firstName} ${oneToOneData.booking.coach.lastName}`
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Venue */}
                            <div className="border-b border-[#495362] pb-3">
                                <p className="text-white text-[18px] font-semibold">Venue</p>
                                <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-md mt-1">
                                    {oneToOneData?.booking?.location || "N/A"}
                                </span>
                            </div>

                            {/* Parent */}
                            <div className="border-b border-[#495362] pb-3">
                                <p className="text-white text-[18px] font-semibold">Parent Name</p>
                                <p className="text-[16px] mt-1 text-[#BDC0C3]">
                                    {oneToOneData?.booking?.parents?.[0]
                                        ? `${oneToOneData.booking.parents[0].parentFirstName} ${oneToOneData.booking.parents[0].parentLastName}`
                                        : oneToOneData?.parentName || "N/A"}
                                </p>
                            </div>

                            {/* Date of Class */}
                            <div className="border-b border-[#495362] pb-3">
                                <p className="text-white text-[18px] font-semibold">Date of Class</p>
                                <p className="text-[16px] mt-1 text-[#BDC0C3]">
                                    {oneToOneData?.booking?.date
                                        ? new Date(oneToOneData.booking.date).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })
                                        : "N/A"}
                                </p>
                            </div>

                            {/* Package */}
                            <div className="border-b border-[#495362] pb-3">
                                <p className="text-white text-[18px] font-semibold">Package</p>
                                <p className="text-[16px] mt-1 text-[#BDC0C3]">
                                    {oneToOneData?.booking?.paymentPlan?.title || oneToOneData?.packageInterest || "N/A"}
                                </p>
                            </div>

                            {/* Source */}
                            <div className="border-b border-[#495362] pb-3">
                                <p className="text-white text-[18px] font-semibold">Source</p>
                                <p className="text-[16px] mt-1 text-[#BDC0C3]">
                                    {oneToOneData?.source || oneToOneData?.booking?.parents?.[0]?.howDidHear || "N/A"}
                                </p>
                            </div>

                            {/* Price */}
                            <div>
                                <p className="text-white text-[18px] font-semibold">Price</p>
                                <p className="text-[16px] mt-1 text-[#BDC0C3] font-semibold">
                                    £
                                    {oneToOneData?.booking?.payment?.amount
                                        ? parseFloat(oneToOneData.booking.payment.amount).toFixed(2)
                                        : "0.00"}
                                </p>
                            </div>
                        </div>


                        {/* Action Buttons */}
                        <div className="p-6 flex flex-col bg-white rounded-3xl mt-5 items-center space-y-3">
                            <div className="flex w-full justify-between gap-2">
                                <button onClick={() => {
                                    if (bookingId) {
                                        sendOnetoOneMail(bookingId);
                                    } else {
                                        showWarning("Booking ID not found. Cannot send email.");
                                    }
                                }} className="flex-1 flex items-center gap-2 justify-center border border-[#717073] text-[#717073] rounded-xl font-semibold py-3 text-[18px] text-[18px]  hover:bg-gray-50 transition">
                                    <Mail className="w-4 h-4 mr-1" /> Send Email
                                </button>
                                <button className="flex-1 flex items-center gap-2 justify-center border border-[#717073] rounded-xl font-semibold py-3 text-[18px] text-[#717073]  hover:bg-gray-50 transition">
                                    <MessageSquare className="w-4 h-4 mr-1" /> Send Text
                                </button>
                            </div>



                            {status !== 'active' ? (

                                <button onClick={handleRenewPackage} className="w-full bg-[#237FEA] text-white text-[18px] py-3 rounded-xl  font-medium hover:bg-blue-700 transition">
                                    Renew Package
                                </button>
                            ) : (
                                <button onClick={handleCancelPackage} className="w-full bg-[#FF6C6C] text-white my-3 text-[18px] py-3 rounded-xl  font-medium hover:bg-red-600 transition flex items-center justify-center">
                                    Cancel Package
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default General
