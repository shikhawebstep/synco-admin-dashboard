import { useEffect, useState, useCallback, useRef } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Search } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import { useMembers } from "../contexts/MemberContext";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHolidayTerm } from "../contexts/HolidayTermsContext";
import { useDiscounts } from "../contexts/DiscountContext";
import PlanTabs from "../weekly-classes/find-a-class/PlanTabs";
import { evaluate } from 'mathjs';
import { showError, showLoading, showSuccess } from "../../../../utils/swalHelper";
import Loader from "../contexts/Loader";

const BookACamp = () => {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');
    const navigate = useNavigate();
    const emptyStudent = {
        studentFirstName: "",
        studentLastName: "",
        dateOfBirth: "",
        age: ' ',
        gender: "",
        medicalInformation: " ",
        class: "",
        time: "",
        classScheduleId: "",
    };

    const [formData, setFormData] = useState({
        students: [{ ...emptyStudent }],
        parent: [{
            parentFirstName: "",
            parentLastName: "",
            parentEmail: "",
            parentPhoneNumber: "",
            relationToChild: "",
            howDidYouHear: ""
        }],
        emergency: {},
        general: {
            numberOfStudents: 1,
            Venue: "",
            holidayCamps: "",
            discount: "",
            paymentPlainId: '',
        },
    });

    const buttons = [
        ['AC', '±', '%', '÷',],
        ["7", "8", "9", "×"],
        ["4", "5", "6", "−"],
        ["1", "2", "3", "+"],
        ["", "0", ".", "="],

    ];

    const popup1Ref = useRef(null);
    const popup2Ref = useRef(null);
    const popup3Ref = useRef(null);
    const img3Ref = useRef(null); // add a ref for the image
    const img1Ref = useRef(null); // add a ref for the image
    const img2Ref = useRef(null); // add a ref for the image

    const { fetchHolidayCampMain, termGroup } = useHolidayTerm();
    const [activePopup, setActivePopup] = useState(null);
    const togglePopup = (id) => {
        setActivePopup((prev) => (prev === id ? null : id));
    };
    const { fetchHolidayDiscounts, discounts } = useDiscounts();
    const [loading, setLoading] = useState(false);
    const [selectedKeyInfo, setSelectedKeyInfo] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id"); // <-- GET ID (10)
    const [isOpen, setIsOpen] = useState(false);
    const { keyInfoData, fetchKeyInfo } = useMembers();

    const [holidayCampsData, setHolidayCampsData] = useState({});

    const token = localStorage.getItem("adminToken");
    const { adminInfo } = useNotification();
    const [sameAsAbove, setSameAsAbove] = useState(false);
    const [showPayment, setShowPayment] = useState(false);

    // Comments state
    const [commentsList, setCommentsList] = useState([]);
    const [comment, setComment] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const commentsPerPage = 5;
    const indexOfLastComment = currentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = commentsList.slice(indexOfFirstComment, indexOfLastComment);
    const totalPages = Math.ceil(commentsList.length / commentsPerPage);

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


    const handleClickOutside = (e) => {
        if (
            (activePopup === 1 && popup1Ref.current && !popup1Ref.current.contains(e.target) && img1Ref.current && !img1Ref.current.contains(e.target)) ||
            (activePopup === 2 && popup2Ref.current && !popup2Ref.current.contains(e.target) && img2Ref.current && !img2Ref.current.contains(e.target)) ||
            (activePopup === 3 && popup3Ref.current && !popup3Ref.current.contains(e.target) && img3Ref.current && !img3Ref.current.contains(e.target))
        ) {
            togglePopup(null);
        }
    };

    const getSelectValue = (options, storedValue) => {
        if (!storedValue) return null;
        const selectedOption = options.find(opt => opt.value === storedValue);
        return selectedOption || null;
    };


    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activePopup]);



    const goToPage = (page) => {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };

    // Fetch camp - include deps
    const fetchCamp = useCallback(async () => {
        const tokenLocal = localStorage.getItem("adminToken");
        if (!tokenLocal) return;
        if (!id) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/find-class/${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokenLocal}`,
                    "Content-Type": "application/json",
                },
            });

            const resultRaw = await response.json();
            const result = resultRaw.data || {};
            setHolidayCampsData(result);


            const defaultStudent = {
                ...emptyStudent,
                class: result.id || "",
                time: `${result.startTime} - ${result.endTime}`,
                startTime: result.startTime || "",
                endTime: result.endTime || "",
                classScheduleId: result.id || "",
            };

            // numberOfStudents is always 1 at load
            const num = 1;

            setFormData({
                general: {
                    numberOfStudents: num,
                    Venue: result.venue?.name || "",
                    holidayCamps: result.venue?.holidayCamps?.[0]?.id || "",  // store ID
                    discount: "",
                },

                // ⛱ generate student forms = num (1 on load)
                students: Array.from({ length: num }, () => ({ ...defaultStudent })),

                parent: [
                    {
                        parentFirstName: "",
                        parentLastName: "",
                        parentEmail: "",
                        parentPhoneNumber: "",
                        relationToChild: "",
                        howDidYouHear: ""
                    },
                ],

                emergency: {},
            });

            // TODO: use result to prefill form or selected camp info
            // e.g. setSelectedCamp(result) or setFormData(prev=>({...prev, general:{...prev.general, holidayCamps: result.title}}))
        } catch (error) {
            console.error("Failed to fetch classSchedules:", error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, id]);


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
                } else if (child.nodeType !== 3) {
                    traverse(child);
                }
            });
        }
        traverse(tempDiv);
        if (items.length === 0) {
            const plainText = tempDiv.textContent.trim();
            if (plainText) items.push(plainText);
        }
        return items;
    }

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

    const keyInfoArray = htmlToArray(keyInfoData?.keyInformation || "");
    const keyInfoOptions = keyInfoArray.map((item) => ({ value: item, label: item }));
    const selectedLabel = keyInfoOptions.find((opt) => opt.value === selectedKeyInfo)?.label || "Key Information";
    const classesWithCapacity = holidayCampsData?.venueClasses?.filter(cls => cls.capacity > 0) || [];
    const ClassOptions = classesWithCapacity?.map((item) => ({
        value: item.id,
        label: item.className,
    })) || [];

    const handleClassChange = (index, classId) => {
        const selectedClass = classesWithCapacity?.find(cls => cls.id === classId);
        setFormData((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            next.students[index].class = classId;
            next.students[index].classScheduleId = classId;
            if (selectedClass) {
                next.students[index].time = `${selectedClass.startTime || ''} - ${selectedClass.endTime || ''}`;
            }
            return next;
        });
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return `${diff} sec${diff !== 1 ? "s" : ""} ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? "s" : ""} ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? "s" : ""} ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? "s" : ""} ago`;
        return past.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const handleChange = (section, field, value, index = null) => {
        setFormData((prev) => {
            const next = JSON.parse(JSON.stringify(prev)); // deep copy so we can mutate easily

            // handle parent array updates
            if (section === "parent") {
                const idx = index ?? 0;
                next.parent[idx] = { ...(next.parent[idx] || {}), [field]: value };
                return next;
            }

            // handle students count in general
            if (section === "general" && field === "numberOfStudents") {
                let num = Number(value);
                if (Number.isNaN(num) || num < 1) num = 1;
                if (num > 3) num = 3;

                next.general.numberOfStudents = num;

                // ==== Get previous students before changes ====
                const prevStudents = prev.students || [];

                // Take class & time from first student (if exists)
                const firstStudent = prevStudents[0] || {};

                // ==== Build updated student list ====
                const newStudents = Array.from({ length: num }, (_, i) => ({
                    studentFirstName: prevStudents[i]?.studentFirstName || "",
                    studentLastName: prevStudents[i]?.studentLastName || "",
                    dateOfBirth: prevStudents[i]?.dateOfBirth || "",
                    age: prevStudents[i]?.age || "",
                    gender: prevStudents[i]?.gender || "",
                    medicalInformation: prevStudents[i]?.medicalInformation || "",

                    // Keep entered class/time OR inherit from first student ONLY for index 0
                    class: i === 0
                        ? (prevStudents[i]?.class || firstStudent.class || "")
                        : (prevStudents[i]?.class || ""),
                    time: i === 0
                        ? (prevStudents[i]?.time || firstStudent.time || "")
                        : (prevStudents[i]?.time || ""),
                    classScheduleId: i === 0
                        ? (prevStudents[i]?.classScheduleId || firstStudent.classScheduleId || "")
                        : (prevStudents[i]?.classScheduleId || ""),
                }));

                next.students = newStudents;
                return next;
            }


            // updating general other fields
            if (section === "general") {
                next.general[field] = value;
                return next;
            }

            // students fields update (section name should be "students")
            if (section === "students") {
                const idx = index ?? 0;
                next.students[idx] = { ...(next.students[idx] || {}) };

                // if date chosen, store ISO string and compute age
                if (field === "dateOfBirth") {
                    const dateVal = value instanceof Date ? value : new Date(value);
                    next.students[idx].dateOfBirth = dateVal.toISOString();
                    next.students[idx].age = calculateAge(dateVal);
                } else {
                    next.students[idx][field] = value;
                }
                return next;
            }

            // emergency single object
            if (section === "emergency") {
                next.emergency = { ...(next.emergency || {}), [field]: value };
                return next;
            }

            return next;
        });
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return "";
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
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

    const [errors, setErrors] = useState({});
    const [validateErrors, setValidateErrors] = useState({});

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;

        if (name === "cardNumber") {
            // Remove non-digits, limit length to 16 digits (without spaces)
            let digitsOnly = value.replace(/\D/g, "").slice(0, 16);

            // Format as XXXX XXXX XXXX XXXX
            let formatted = digitsOnly.replace(/(.{4})/g, "$1 ").trim();

            setPaymentData((prev) => ({ ...prev, cardNumber: formatted }));
            return;
        }

        if (name === "expiryDate") {
            // Allow digits only, max length 4 (MMYY)
            let digitsOnly = value.replace(/\D/g, "").slice(0, 4);

            // Insert slash after 2 digits if length > 2
            if (digitsOnly.length > 2) {
                digitsOnly = digitsOnly.slice(0, 2) + "/" + digitsOnly.slice(2);
            }

            setPaymentData((prev) => ({ ...prev, expiryDate: digitsOnly }));
            return;
        }

        if (name === "securityCode") {
            // Digits only, max 4
            let digitsOnly = value.replace(/\D/g, "").slice(0, 4);
            setPaymentData((prev) => ({ ...prev, securityCode: digitsOnly }));
            return;
        }

        // For other fields, simple update
        setPaymentData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors = {};

        if (!paymentData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!paymentData.lastName.trim()) newErrors.lastName = "Last name is required";

        if (!paymentData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(paymentData.email)) newErrors.email = "Email is invalid";

        if (!paymentData.billingAddress.trim()) newErrors.billingAddress = "Billing address is required";

        // Card number must have exactly 16 digits
        if (paymentData.cardNumber.replace(/\s/g, "").length !== 16)
            newErrors.cardNumber = "Card number must be 16 digits";

        // Expiry date format MM/YY and must be valid
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentData.expiryDate))
            newErrors.expiryDate = "Expiry date must be in MM/YY format";

        // Security code 3 or 4 digits
        if (!/^\d{3,4}$/.test(paymentData.securityCode))
            newErrors.securityCode = "Security code must be 3 or 4 digits";

        setErrors(newErrors);

        // Return true if no errors
        return Object.keys(newErrors).length === 0;
    };




    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🔍 Validate Before Submit
        if (!validate()) return;

        // 🔄 Show Loading Popup
        showLoading("Processing...", "Please wait while we submit your booking.");


        try {
            const payload = {
                venueId: holidayCampsData?.venue?.id,
                totalStudents: formData?.general?.numberOfStudents,
                holidayCampId: formData?.general?.holidayCamps,
                paymentPlanId: formData?.general?.paymentPlainId,
                students: formData?.students,
                parents: formData?.parent, // 🔧 FIXED — not students
                emergency: formData?.emergency,
                payment: paymentData,

                ...(formData?.general?.discount && {
                    discountId: formData.general.discount,
                }),
            };


            const response = await fetch(
                `${API_BASE_URL}/api/admin/holiday/booking/create`,
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

            if (response.ok) {
                // ✅ SUCCESS ALERT
                showSuccess("Booking Successful!", result?.message || "Your booking has been submitted.");

                setShowPayment(null);
                navigate('/holiday-camp/members/list')
            } else {
                showError("Submission Failed", result?.message || "Something went wrong. Please try again.");

            }
        } catch (err) {
            console.error("Submit Error:", err);

            // ❌ NETWORK OR CODE ERROR

            showError("Network Error", "Could not submit booking. Please check your internet or try again later.");

        }
    };


    const handleOpenPayment = () => {
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        // ➜ submit API call  
        setShowPayment(true)
    };



    const fetchComments = useCallback(async () => {
        const tokenLocal = localStorage.getItem("adminToken");
        if (!tokenLocal) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/comment/list`, {
                method: "GET",
                headers: { Authorization: `Bearer ${tokenLocal}` },
            });
            const resultRaw = await response.json();
            const result = resultRaw.data || [];
            setCommentsList(result);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            showError("Error", error.message || "Failed to fetch comments.");
        }
    }, [API_BASE_URL]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const tokenLocal = localStorage.getItem("adminToken");
        if (!tokenLocal) return;
        try {
            showLoading("Creating Comment", "Please wait while we add your comment.");
            const response = await fetch(`${API_BASE_URL}/api/admin/holiday/comment/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenLocal}` },
                body: JSON.stringify({ comment }),
            });
            const result = await response.json();
            if (!response.ok) {
                showError("Failed to Add Comment", result.message || "Something went wrong.");
                return;
            }
            showSuccess("Comment Created", result.message || "Comment has been added successfully!");
            setComment("");
            fetchComments();
        } catch (error) {
            console.error("Error creating member:", error);
            showError("Network Error", error.message || "An error occurred.");
        }
    };

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const addParent = () => {
        setFormData((prev) => ({
            ...prev,
            parent: [...prev.parent, { parentFirstName: "", parentLastName: "", parentEmail: "", parentPhoneNumber: "", relationToChild: "Other", howDidYouHear: '' }],
        }));
    };
    const handleRemoveParent = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            parent: prev.parent.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleSameAsAbove = () => {
        setSameAsAbove((prev) => {
            const newValue = !prev;

            setFormData((prevData) => {
                if (newValue) {
                    // Copy from parent[0]
                    const parent0 = prevData.parent?.[0] || {};

                    return {
                        ...prevData,
                        emergency: {
                            emergencyFirstName: parent0.parentFirstName || "",
                            emergencyLastName: parent0.parentLastName || "",
                            emergencyPhoneNumber: parent0.parentPhoneNumber || "",
                            emergencyRelation: parent0.relationToChild || "",
                        }
                    };
                } else {
                    // Reset emergency fields
                    return {
                        ...prevData,
                        emergency: {
                            emergencyFirstName: "",
                            emergencyLastName: "",
                            emergencyPhoneNumber: "",
                            emergencyRelation: ""
                        }
                    };
                }
            });

            return newValue;
        });
    };

    useEffect(() => {
        const allData = async () => {
            setLoading(true);
            await fetchCamp();
            await fetchKeyInfo();
            await fetchHolidayCampMain();
            await fetchHolidayDiscounts();
            setLoading(false);
        }
        allData();
    }, [fetchCamp]);

    // Inputs definitions:
    const generalInputs = [
        {
            name: "Venue",
            placeholder: "Select Venue",
            type: "text",
            label: "Venue"
        },

        {
            name: "numberOfStudents",
            placeholder: "Choose number of students",
            type: "number",
            label: "Number of students",

            max: 3
        },

        {
            name: "holidayCamps",
            placeholder: "Choose holiday camp(s)",
            type: "select",
            label: "Select Camp(s)",
            options: termGroup.map(camp => ({
                id: camp.id,
                value: camp.id,
                label: camp.name,
            })),
        },
        {
            name: "paymentPlainId",
            placeholder: "Choose Plan",
            type: "select",
            label: "Select Plan",
            options: holidayCampsData?.venue?.paymentGroups[0]?.holidayPaymentPlans.map(plan => ({
                id: plan.id,
                value: plan.id,
                label: plan.title,
            })),
        },

        {
            name: "discount",
            placeholder: "Apply discount",
            type: "select",
            label: "Apply Discount",
            options: discounts.map(disc => ({
                id: disc.id,
                value: disc.id,
                label: disc.code,
            })),
        },
    ];


    const studentInputs = [
        { name: "studentFirstName", placeholder: "Enter First Name", type: "text", label: "First Name" },
        { name: "studentLastName", placeholder: "Enter Last Name", type: "text", label: "Last Name" },
        { name: "dateOfBirth", placeholder: "Date of Birth", type: "date", label: "Date Of Birth" },
        { name: "age", placeholder: "Automatic Entry", type: "text", label: "Age" },

        {
            name: "gender",
            type: "select",
            label: "Gender",
            options: [
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" }
            ]
        },

        { name: "medicalInformation", placeholder: "Enter Medical Information", type: "text", label: "Medical Information" },

        {
            name: "class",
            type: "text",
            label: "Class",
        },

        { name: "time", placeholder: "Automatic Entry", type: "text", label: "Time" },
    ];


    const parentInputs = [
        { name: "parentFirstName", placeholder: "Enter First Name", type: "text", label: "First Name" },
        { name: "parentLastName", placeholder: "Enter Last Name", type: "text", label: "Last Name" },
        { name: "parentEmail", placeholder: "Enter Email", type: "email", label: "Email" },
        { name: "parentPhoneNumber", placeholder: "Phone Number", type: "phone", label: "Phone Number" },

        {
            name: "relationToChild",
            type: "select",
            label: "Relation To Child",
            options: [
                { value: "Mother", label: "Mother" },
                { value: "Father", label: "Father" }
            ]
        },

        {
            name: "howDidYouHear",
            type: "select",
            label: "How Did You Hear About Us",
            options: [
                { value: "Friend", label: "Friend" },
                { value: "Website", label: "Website" },
                { value: "Other", label: "Other" }
            ]
        },
    ];


    const emergencyInputs = [
        { name: "emergencyFirstName", placeholder: "Enter First Name", type: "text", label: "First Name" },
        { name: "emergencyLastName", placeholder: "Enter Last Name", type: "text", label: "Last Name" },
        { name: "emergencyPhoneNumber", placeholder: "Phone Number", type: "phone", label: "Phone Number" },

        {
            name: "emergencyRelation",
            type: "select",
            label: "Relation",
            options: [
                { value: "Mother", label: "Mother" },
                { value: "Father", label: "Father" }
            ]
        },
    ];


    const validateForm = () => {
        let newErrors = {};

        if (!formData.general.numberOfStudents || formData.general.numberOfStudents < 1) {
            newErrors.numberOfStudents = "Number of students is required";
        }

        if (!formData.general.Venue?.trim()) {
            newErrors.Venue = "Venue is required";
        }

        if (!formData.general.holidayCamps) {
            newErrors.holidayCamps = "Please select a camp";
        }
        if (!formData.general.paymentPlainId) {
            newErrors.paymentPlainId = "Please select a Plain";
        }

        formData.students.forEach((s, index) => {
            if (!s.studentFirstName.trim()) {
                newErrors[`studentFirstName_${index}`] = "First name is required";
            }
            if (!s.studentLastName.trim()) {
                newErrors[`studentLastName_${index}`] = "Last name is required";
            }
            if (!s.dateOfBirth) {
                newErrors[`dateOfBirth_${index}`] = "Date of birth is required";
            }
            if (!s.gender) {
                newErrors[`gender_${index}`] = "Gender is required";
            }
        });

        formData.parent.forEach((p, index) => {
            if (!p.parentFirstName.trim()) {
                newErrors[`parentFirstName_${index}`] = "First name is required";
            }
            if (!p.parentLastName.trim()) {
                newErrors[`parentLastName_${index}`] = "Last name is required";
            }
            if (!p.parentEmail.trim()) {
                newErrors[`parentEmail_${index}`] = "Email is required";
            } else if (!/^\S+@\S+\.\S+$/.test(p.parentEmail)) {
                newErrors[`parentEmail_${index}`] = "Invalid email";
            }

            if (!p.parentPhoneNumber.trim()) {
                newErrors[`parentPhoneNumber_${index}`] = "Phone number is required";
            } else if (!/^\d{7,15}$/.test(p.parentPhoneNumber)) {
                newErrors[`parentPhoneNumber_${index}`] = "Invalid phone number";
            }

            if (!p.relationToChild) {
                newErrors[`relationToChild_${index}`] = "Relationship is required";
            }
        });


        setValidateErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const renderInputs = (inputs, section, index = null) => (
        <div className={`grid ${section === "general" ? "md:grid-cols-1" : "md:grid-cols-2"} gap-4`}>
            {inputs.map((input, idx) => (
                <div key={idx}>
                    <label className="block text-[16px] font-semibold">{input.label}</label>

                    {/* TEXT / EMAIL / NUMBER / TEXTAREA */}
                    {["text", "email", "number", "textarea"].includes(input.type) && (
                        input.type === "textarea" ? (
                            <>
                                <textarea
                                    placeholder={input.placeholder}
                                    value={
                                        section === "parent"
                                            ? formData.parent[index]?.[input.name] || ""
                                            : section === "students"
                                                ? formData.students[index]?.[input.name] || ""
                                                : formData[section]?.[input.name] || ""
                                    }
                                    onChange={(e) => handleChange(section, input.name, e.target.value, index)}
                                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                />

                                {/* ERROR TEXTAREA */}
                                {section === "general" && validateErrors[input.name] && (
                                    <p className="text-red-500 text-sm mt-1">{validateErrors[input.name]}</p>
                                )}
                                {section === "students" && validateErrors[`${input.name}_${index}`] && (
                                    <p className="text-red-500 text-sm mt-1">{validateErrors[`${input.name}_${index}`]}</p>
                                )}
                                {section === "parent" && validateErrors[`${input.name}_${index}`] && (
                                    <p className="text-red-500 text-sm mt-1">{validateErrors[`${input.name}_${index}`]}</p>
                                )}
                            </>
                        ) : (
                            !(section === "students" && index > 0 && input.name === "class") && (
                                <>
                                    <div className={`flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2 ${input.name === "Venue" || input.name === "address" ? "gap-2" : ""}`}>
                                        {(input.name === "Venue" || input.name === "address") && (
                                            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                        )}

                                        <input
                                            type={input.type}
                                            required
                                            placeholder={input.placeholder}
                                            disabled={
                                                input.name === "age" ||
                                                (section === "students" && index === 0 && (input.name === "class" || input.name === "time"))
                                            }
                                            readOnly={section === "students" && index === 0 && (input.name === "class" || input.name === "time")}
                                            min={input.name === "numberOfStudents" ? input.min : undefined}
                                            max={input.name === "numberOfStudents" ? input.max : undefined}
                                            value={
                                                section === "parent"
                                                    ? formData.parent[index]?.[input.name] ?? ""
                                                    : section === "students"
                                                        ? formData.students[index]?.[input.name] ?? ""
                                                        : formData[section]?.[input.name] ?? ""
                                            }
                                            onChange={(e) => handleChange(section, input.name, e.target.value, index)}
                                            className={`w-full text-base border-none focus:outline-none bg-transparent ${section === "students" && index === 0 && (input.name === "class" || input.name === "time") ? "text-gray-500 cursor-not-allowed" : ""
                                                }`}
                                        />
                                    </div>

                                    {/* ERROR BELOW INPUT */}
                                    {section === "general" && validateErrors[input.name] && (
                                        <p className="text-red-500 text-sm mt-1">{validateErrors[input.name]}</p>
                                    )}
                                    {section === "students" && validateErrors[`${input.name}_${index}`] && (
                                        <p className="text-red-500 text-sm mt-1">{validateErrors[`${input.name}_${index}`]}</p>
                                    )}
                                    {section === "parent" && validateErrors[`${input.name}_${index}`] && (
                                        <p className="text-red-500 text-sm mt-1">{validateErrors[`${input.name}_${index}`]}</p>
                                    )}
                                </>
                            )
                        )
                    )}

                    {/* Conditional rendering for Class Dropdown in Students (index > 0) */}
                    {section === "students" && index > 0 && input.name === "class" && (
                        <>
                            <Select
                                options={ClassOptions}
                                placeholder="Select Class"
                                value={ClassOptions.find(opt => opt.value === formData.students[index]?.class) || null}
                                onChange={(selected) => handleClassChange(index, selected?.value || "")}
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
                            {validateErrors[`class_${index}`] && (
                                <p className="text-red-500 text-sm mt-1">{validateErrors[`class_${index}`]}</p>
                            )}
                        </>
                    )}

                    {/* SELECT using react-select */}
                    {input.type === "select" && (
                        <>
                            <Select
                                options={input.options}
                                value={
                                    section === "parent"
                                        ? getSelectValue(input.options, formData.parent[index]?.[input.name])
                                        : section === "students"
                                            ? getSelectValue(input.options, formData.students[index]?.[input.name])
                                            : getSelectValue(input.options, formData[section]?.[input.name])
                                }
                                onChange={(selected) =>
                                    handleChange(section, input.name, selected?.value || "", index)
                                }
                                isDisabled={input.name === "holidayCamps"}
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

                            {/* ERROR */}
                            {section === "general" && validateErrors[input.name] && (
                                <p className="text-red-500 text-sm mt-1">{validateErrors[input.name]}</p>
                            )}
                            {section === "students" && validateErrors[`${input.name}_${index}`] && (
                                <p className="text-red-500 text-sm mt-1">{validateErrors[`${input.name}_${index}`]}</p>
                            )}
                            {section === "parent" && validateErrors[`${input.name}_${index}`] && (
                                <p className="text-red-500 text-sm mt-1">{validateErrors[`${input.name}_${index}`]}</p>
                            )}
                        </>
                    )}

                    {/* DATE */}
                    {input.type === "date" && (
                        <>
                            <div className="mt-2">
                                <DatePicker
                                    withPortal
                                    selected={
                                        section === "parent"
                                            ? formData.parent[index]?.[input.name] ? new Date(formData.parent[index][input.name]) : null
                                            : section === "students"
                                                ? formData.students[index]?.[input.name] ? new Date(formData.students[index][input.name]) : null
                                                : formData[section]?.[input.name] ? new Date(formData[section][input.name]) : null
                                    }
                                    onChange={(date) => handleChange(section, input.name, date, index)}
                                    className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    showYearDropdown
                                    scrollableYearDropdown
                                    yearDropdownItemNumber={100}
                                    dateFormat="dd/MM/yyyy"
                                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 3))}
                                    minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                                    placeholderText="Select date of birth"
                                />
                            </div>

                            {/* ERROR */}
                            {section === "students" && validateErrors[`dateOfBirth_${index}`] && (
                                <p className="text-red-500 text-sm mt-1">
                                    {validateErrors[`dateOfBirth_${index}`]}
                                </p>
                            )}
                        </>
                    )}

                    {/* PHONE */}
                    {input.type === "phone" && (
                        <>
                            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2">
                                <PhoneInput
                                    country="uk"
                                    value="+44"
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
                                    required
                                    placeholder="Enter phone number"
                                    value={
                                        section === "parent"
                                            ? formData.parent[index]?.[input.name] || ""
                                            : formData[section]?.[input.name] || ""
                                    }
                                    onChange={(e) => {
                                        const digitsOnly = e.target.value.replace(/\D/g, "");
                                        handleChange(section, input.name, digitsOnly, index);
                                    }}
                                    className="border-none w-full focus:outline-none flex-1"
                                />
                            </div>

                            {/* PHONE ERROR */}
                            {section === "parent" && validateErrors[`parentPhoneNumber_${index}`] && (
                                <p className="text-red-500 text-sm mt-1">
                                    {validateErrors[`parentPhoneNumber_${index}`]}
                                </p>
                            )}
                        </>
                    )}
                </div>
            ))}
        </div>
    );
    if (loading) {
        return (
            <>
                <Loader />
            </>
        )
    }

    return (
        <div className="md:p-6 min-h-screen">
            <div className="flex justify-between mb-5">
                <h2 onClick={() => navigate('/holiday-camp/find-a-camp')} className="flex gap-2 cursor-pointer items-center text-2xl font-bold">
                    <img src="/images/icons/arrow-left.png" alt="Back" className="w-5 h-5 md:w-6 md:h-6" />
                    Book a Holiday Camp
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
                                    <PlanTabs selectedPlans={holidayCampsData?.venue?.paymentGroups[0]?.holidayPaymentPlans} />
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

                                        // FIXED
                                        const showRed =
                                            ['+', '−', '×', '÷', '%'].includes(btn) &&
                                            expression.endsWith(btn);

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

            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-[30%]">
                    <section className="bg-white rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-[#282829] pb-4">Enter Information</h3>
                        {renderInputs(generalInputs, "general")}
                    </section>
                </div>

                <div className="md:w-[70%] space-y-5">
                    <section className="bg-white rounded-2xl p-4">
                        <h3 className="text-xl font-bold text-[#282829] pb-4">Student Information</h3>
                        {formData.students.map((_, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-4 mb-4">
                                <h4 className="font-semibold text-gray-700 mb-3">Student {index + 1}</h4>
                                {renderInputs(studentInputs, "students", index)}
                            </div>
                        ))}
                    </section>

                    <section className="bg-white rounded-2xl p-4">
                        <div className="flex justify-between items-center pb-4">
                            <h3 className="text-xl font-bold text-[#282829]">Parent Information</h3>
                            <button
                                type="button"
                                disabled={formData.parent.length === 3}
                                onClick={addParent}
                                className="bg-[#237FEA] text-sm px-4 py-2 rounded-xl text-white hover:bg-[#1e6fd2] transition"
                            >
                                + Add Parent
                            </button>
                        </div>

                        {formData.parent.map((_, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-700 mb-3">
                                        Parent {index + 1}
                                    </h4>

                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveParent(index)}
                                            className="text-gray-500 hover:text-red-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {renderInputs(parentInputs, "parent", index)}
                            </div>
                        ))}

                    </section>

                    <section className="bg-white rounded-2xl p-4">
                        <div className="pb-4">
                            <h3 className="text-xl font-bold text-[#282829]">Emergency Contact Details</h3>
                            <div className="flex items-center gap-2 mt-3">
                                <input type="checkbox" checked={sameAsAbove} onChange={handleSameAsAbove} className="cursor-pointer w-4 h-4" />
                                <label className="text-base font-semibold text-gray-700">Fill same as above</label>
                            </div>
                        </div>
                        {renderInputs(emergencyInputs, "emergency")}
                    </section>

                    <div onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between text-[20px] p-3 border border-gray-200 rounded-xl cursor-pointer bg-white shadow-md hover:border-gray-400 transition">
                        <span className={`${selectedKeyInfo ? "font-medium text-gray-900" : "text-gray-500"}`}>{selectedLabel}</span>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <button className="px-8 py-2 border border-[#717073] text-[#717073] rounded-md">Cancel</button>
                        <button
                            onClick={() => handleOpenPayment()}   // no errors → proceed

                            className="bg-[#237FEA] text-white text-[18px] font-semibold border  px-6 py-3 rounded-lg transition hover:bg-[#1e6fd2] transition"
                        >
                            Make Payment
                        </button>

                    </div>

                    {/* Comments area (kept as in your original) */}
                    <div className="bg-white my-10 rounded-3xl p-6 space-y-4">
                        <h2 className="text-[24px] font-semibold">Comment</h2>
                        <div className="flex items-center gap-2">
                            <img src={adminInfo?.profile ? `${adminInfo.profile}` : '/members/dummyuser.png'} alt="User" className="w-14 h-14 rounded-full object-cover" />
                            <input type="text" name="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-[16px] font-semibold outline-none md:w-full w-5/12" />
                            <button className="bg-[#237FEA] p-3 rounded-xl text-white hover:bg-blue-600" onClick={handleSubmitComment}>
                                <img src="/images/icons/sent.png" alt="" />
                            </button>
                        </div>

                        {commentsList && commentsList.length > 0 ? (
                            <div className="space-y-4">
                                {currentComments.map((c, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-4 text-sm">
                                        <p className="text-gray-700 text-[16px] font-semibold mb-1">{c.comment}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <img src={c?.bookedByAdmin?.profile ? `${c?.bookedByAdmin?.profile}` : '/members/dummyuser.png'} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/members/dummyuser.png'; }} alt={c?.bookedByAdmin?.firstName} className="w-10 h-10 rounded-full object-cover mt-1" />
                                                <div>
                                                    <p className="font-semibold text-[#237FEA] text-[16px]">{c?.bookedByAdmin?.firstName}</p>
                                                </div>
                                            </div>
                                            <span className="text-gray-400 text-[16px] whitespace-nowrap mt-1">{formatTimeAgo(c.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}

                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-4">
                                        <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button key={i} className={`px-3 py-1 rounded-lg border ${currentPage === i + 1 ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:bg-gray-100'}`} onClick={() => goToPage(i + 1)}>{i + 1}</button>
                                        ))}
                                        <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center">No Comments yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {showPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
                    <div className="bg-white rounded-2xl max-h-[90vh] overflow-auto w-full max-w-lg p-6 relative shadow-lg">
                        <button onClick={() => setShowPayment(null)} className="absolute top-7 left-6 text-gray-400 hover:text-gray-600"><X /></button>
                        <h2 className="text-center text-lg font-semibold mb-4 border-b border-[#E2E1E5] pb-4">Payment</h2>

                        <div className="bg-blue-500 text-white rounded-xl p-4 mb-6 text-left font-medium" style={{ backgroundImage: "url('/frames/holidayCamp.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <p>{holidayCampsData?.venue?.paymentGroups[0]?.holidayPaymentPlans[0]?.title} ({formData.general.numberOfStudents || 1} Student)</p>
                            <p className="text-2xl font-bold">£ {holidayCampsData?.venue?.paymentGroups[0]?.holidayPaymentPlans[0]?.price}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                            <div>
                                <h3 className="text-[#282829] font-semibold text-[20px] mb-2">Personal Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label htmlFor="firstName" className="text-[#282829] text-[16px] font-semibold">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            id="firstName"
                                            value={paymentData.firstName}
                                            onChange={handlePaymentChange}
                                            className={`w-full mt-2 border rounded-xl px-4 py-2 text-base ${errors.firstName ? "border-red-500" : "border-gray-300"
                                                }`}
                                        />
                                        {errors.firstName && <span className="text-red-500 text-sm">{errors.firstName}</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="lastName" className="text-[#282829] text-[16px] font-semibold">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            id="lastName"
                                            value={paymentData.lastName}
                                            onChange={handlePaymentChange}
                                            className={`w-full mt-2 border rounded-xl px-4 py-2 text-base ${errors.lastName ? "border-red-500" : "border-gray-300"
                                                }`}
                                        />
                                        {errors.lastName && <span className="text-red-500 text-sm">{errors.lastName}</span>}
                                    </div>
                                </div>

                                <div className="flex flex-col mt-4">
                                    <label htmlFor="email" className="text-[#282829] text-[16px] font-semibold mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={paymentData.email}
                                        onChange={handlePaymentChange}
                                        className={`w-full border rounded-xl px-4 py-2 text-base ${errors.email ? "border-red-500" : "border-gray-300"
                                            }`}
                                    />
                                    {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                                </div>

                                <div className="flex flex-col mt-4">
                                    <label htmlFor="billingAddress" className="text-[#282829] text-[16px] font-semibold mb-1">
                                        Billing Address
                                    </label>
                                    <input
                                        type="text"
                                        name="billingAddress"
                                        id="billingAddress"
                                        value={paymentData.billingAddress}
                                        onChange={handlePaymentChange}
                                        className={`w-full border rounded-xl px-4 py-2 text-base ${errors.billingAddress ? "border-red-500" : "border-gray-300"
                                            }`}
                                    />
                                    {errors.billingAddress && (
                                        <span className="text-red-500 text-sm">{errors.billingAddress}</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[#282829] font-semibold text-[20px] mb-2">Bank Details</h3>
                                <div className="flex flex-col">
                                    <label htmlFor="cardNumber" className="text-[#282829] text-[16px] font-semibold mb-1">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        id="cardNumber"
                                        value={paymentData.cardNumber}
                                        onChange={handlePaymentChange}
                                        className={`w-full border rounded-xl px-4 py-2 text-base ${errors.cardNumber ? "border-red-500" : "border-gray-300"
                                            }`}
                                        maxLength={19}
                                        inputMode="numeric"
                                        placeholder="1234 5678 9012 3456"
                                    />
                                    {errors.cardNumber && <span className="text-red-500 text-sm">{errors.cardNumber}</span>}
                                </div>

                                <div className="grid grid-cols-1 gap-4 mt-4">
                                    <div className="flex flex-col">
                                        <label htmlFor="expiryDate" className="text-[#282829] text-[16px] font-semibold mb-1">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            name="expiryDate"
                                            id="expiryDate"
                                            value={paymentData.expiryDate}
                                            onChange={handlePaymentChange}
                                            className={`w-full border rounded-xl px-4 py-2 text-base ${errors.expiryDate ? "border-red-500" : "border-gray-300"
                                                }`}
                                            placeholder="MM/YY"
                                            maxLength={5}
                                            inputMode="numeric"
                                        />
                                        {errors.expiryDate && <span className="text-red-500 text-sm">{errors.expiryDate}</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="securityCode" className="text-[#282829] text-[16px] font-semibold mb-1">
                                            Security Code
                                        </label>
                                        <input
                                            type="text"
                                            name="securityCode"
                                            id="securityCode"
                                            value={paymentData.securityCode}
                                            onChange={handlePaymentChange}
                                            className={`w-full border rounded-xl px-4 py-2 text-base ${errors.securityCode ? "border-red-500" : "border-gray-300"
                                                }`}
                                            maxLength={4}
                                            inputMode="numeric"
                                            placeholder="123"
                                        />
                                        {errors.securityCode && (
                                            <span className="text-red-500 text-sm">{errors.securityCode}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`w-full rounded-lg py-2 mt-6 transition
       bg-blue-500 hover:bg-blue-600 text-white`}
                            >
                                Make Payment
                            </button>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookACamp;
