import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";  // ✅ to read URL params

import Select from "react-select";
import { motion } from "framer-motion";
import TemplateBuilder from "./TemplateBuilder";
import { HiArrowUturnLeft, HiArrowUturnRight } from "react-icons/hi2";
import PreviewModal from "./PreviewModal";
import { FiSearch } from "react-icons/fi";
import { useCommunicationTemplate } from "../contexts/CommunicationContext";

export default function CreateTemplateSteps() {
    const { fetchTemplateCategories, createTemplateCategories, templateCategories, fetchCommunicationTemplateById, createCommunicationTemplate, apiTemplates, updateCommunicationTemplate } = useCommunicationTemplate();
    const [categoryData, setCategoryData] = useState([]);
    useEffect(() => {
        setCategoryData(templateCategories);
    }, [templateCategories]);
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const templateId = searchParams.get("id");   // ✅ Get ID from URL
    const level = searchParams.get("level");     // email | text
    const isEditMode = Boolean(templateId);


    const [isPreview, setIsPreview] = useState(false);
    const [builderBlocks, setBuilderBlocks] = useState([]);
    const [builderPreview, setBuilderPreview] = useState(false);
    const [builderSubject, setBuilderSubject] = useState("");
    const [step, setStep] = useState(1);
    const [communicationMode, setCommunicationMode] = useState(null);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const isEmailMode = communicationMode?.value === "email";
    const isTextMode = communicationMode?.value === "text";
    const [textform, setTextForm] = useState({
        sender: "",
        message: ""
    });

    // ✅ Ref for Text Area to support cursor insertion
    const textMsgRef = useRef(null);

    const variableOptions = [
        { label: "First Name", value: "{FirstName}" },
        { label: "Last Name", value: "{LastName}" },
        { label: "Company", value: "{Company}" },
        { label: "Link", value: "{Link}" },
    ];

    const insertVariable = (variable) => {
        const textarea = textMsgRef.current;
        if (!textarea) {
            // Fallback if ref is missing
            setTextForm(prev => ({ ...prev, message: prev.message + variable }));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textform.message;

        const newText = text.substring(0, start) + variable + text.substring(end);

        setTextForm(prev => ({ ...prev, message: newText }));

        // Restore focus and cursor position after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const categoryList = Array.from(
        new Set(templateCategories.map((c) => c.category))
    );
    useEffect(() => {
        const loadTemplate = async () => {
            if (!isEditMode) return;

            const t = await fetchCommunicationTemplateById(templateId);
            if (!t) return;

            // ✅ 1. Parse category IDs safely (for both email & text)
            let categoryIds = [];
            if (t.template_category_id) {
                try { categoryIds = JSON.parse(t.template_category_id); } catch { }
            }

            // ✅ 2. Parse content correctly
            // 📧 Email: content is escaped JSON → must parse
            let emailContent = {};
            if (t.mode_of_communication === "email" && t.content) {
                try { emailContent = JSON.parse(t.content); } catch { }
            }

            // ✉️ Text: content is a plain string → no parsing
            const textMessage = t.mode_of_communication === "text" ? t.content.replace(/^"+|"+$/g, "") : "";

            // ✅ 3. Prefill main form
            setForm({
                communication: t.mode_of_communication,
                title: t.title || "",
                category: categoryIds,
                categoryNames: categoryIds.map(id => {
                    const found = templateCategories.find(c => c.id === id);
                    return found?.category || "";
                }),
                tags: (() => { try { return JSON.parse(t.tags) || ""; } catch { return ""; } })(),
            });

            // ✅ 4. Prefill Email Builder
            if (t.mode_of_communication === "email") {
                setBuilderSubject(emailContent.subject || "");
                setBuilderBlocks(emailContent.blocks || []);
                setStep(2);
            }
            setCommunicationMode(
                communicationOptions.find(opt => opt.value === t.mode_of_communication) || null
            );            // ✅ 5. Prefill Text Form
            if (t.mode_of_communication === "text") {
                setTextForm({
                    sender: t.sender_name || "",
                    message: textMessage || "",
                });
                setStep(3);
            }
        };

        loadTemplate();
    }, [templateId, isEditMode, templateCategories]);


    const communicationOptions = [
        { value: "email", label: "Email" },
        { value: "text", label: "Text" }
    ];
    const [form, setForm] = useState({
        communication: "",
        title: "",
        category: [],        // ✅ stores selected category IDs
        categoryNames: [],
        tags: "",
    });


    useEffect(() => {
        fetchTemplateCategories();
    }, [fetchTemplateCategories]);
    const handleSaveCategory = async () => {
        if (!categorySearch.trim()) return;

        console.log('categorySearch', categorySearch);

        const exists = categoryData.find(
            (c) => (c.category || "").toLowerCase() === categorySearch.toLowerCase()
        );
        let newCat = exists;

        if (!exists) {
            try {
                const res = await createTemplateCategories({
                    category: categorySearch,
                });

                if (res.status) {
                    newCat = res.data;
                    setCategoryData((prev) => [...prev, newCat]); // ✅ no mutation
                } else {
                    return;
                }
            } catch (err) {
                console.error(err);
                return;
            }
        }

        // Prevent adding same category twice in form state
        setForm((prev) => {
            const alreadySelected = prev.category.includes(newCat.id);
            if (alreadySelected) return prev;

            return {
                ...prev,
                category: [...prev.category, newCat.id], // ✅ store IDs
                categoryNames: [...prev.categoryNames, newCat.categoryName], // ✅ store UI names
            };
        });

        setCategorySearch("");
        setCategoryOpen(false);
    };

    const next = () => setStep((p) => p + 1);
    const back = () => setStep((p) => p - 1);
    const save = () => alert('saved');
    console.log('textform', textform);
    const inputClass =
        "w-full px-4 py-3 border border-[#E2E1E5] rounded-xl focus:outline-none bg-white";
    console.log('builderSubject', builderSubject);
    console.log('form.category', form.category);

    const handleSaveTextTemplate = async () => {
        console.log('form');

        const payload = {
            mode_of_communication: communicationMode.value,
            template_category_id: form.category,
            title: form.title,
            tags: JSON.stringify(form.tags),
            sender_name: textform.sender,
            content: {
                blocks: [
                    {
                        type: "text",
                        content: textform.message
                    }
                ],
                html: `<div style="white-space: pre-wrap; word-break: break-word;">${textform.message}</div>`
            }
        };

        console.log("✅ Final JSON to Send API:", payload);

        await createCommunicationTemplate(payload);
        navigate('/templates/settingList');
    };

    const handleUpdateTemplate = async () => {

        const payload = {
            mode_of_communication: communicationMode.value,
            template_category_id: form.category,
            title: form.title,
            tags: JSON.stringify(form.tags),
            sender_name: textform.sender,
            content: {
                blocks: [
                    {
                        type: "text",
                        content: textform.message
                    }
                ],
                html: `<div style="white-space: pre-wrap; word-break: break-word;">${textform.message}</div>`
            }
        };
        await updateCommunicationTemplate(templateId, payload);
        console.log("Template Updated ✅", payload);
        navigate('/templates/settingList');
    };

    return (
        <>


            <div className="w-full  justify-center px-4 py-10">
                <h2 className="text-[22px] md:text-[24px] font-semibold text-left mb-6">
                    Templates
                </h2>
                <div className="m-auto max-w-fit item-center flex gap-5 justify-center py-2">
                    {step === 2 && (
                        <>
                            <div className="px-6 py-4  item-center flex rounded-full border border-gray-300 text-base">
                                <button
                                    className="px-3 py-0"
                                    onClick={back}
                                >
                                    <HiArrowUturnLeft className="text-2xl font-bold text-gray-500 hover:text-black cursor-pointer transition-colors duration-200"
                                    />

                                    {/* <img src="/images/icons/flipLeft.png" alt="" /> */}
                                </button>
                                <button
                                    className="px-3 py-0"
                                    onClick={next}
                                >
                                    <HiArrowUturnRight className="text-2xl font-bold text-gray-500 hover:text-black cursor-pointer transition-colors duration-200"
                                    />

                                    {/* <img src="/images/icons/flipRight.png" alt="" /> */}

                                </button>
                            </div>
                        </>

                    )}
                    {step === 3 && (
                        <>
                            <div className="px-6 py-4  item-center flex rounded-full border border-gray-300 text-base">
                                <button
                                    className="px-3 py-0"
                                    onClick={back}
                                >
                                    <HiArrowUturnLeft className="text-2xl font-bold text-gray-500 hover:text-black cursor-pointer transition-colors duration-200"
                                    />

                                    {/* <img src="/images/icons/flipLeft.png" alt="" /> */}
                                </button>

                            </div>
                        </>

                    )}

                </div>
                <div className="w-full m-auto md:max-w-[1043px] rounded-4xl border border-[#E2E1E5] bg-white pb-10">
                    {/* Header */}
                    <div className="px-6 pt-8 pb-6 border-b border-[#E2E1E5]">
                        <h2 className="text-[22px] md:text-[24px] font-semibold text-center mb-6">
                            Create Template
                        </h2>

                        {/* Steps */}
                        <div className="flex justify-center items-center gap-5 text-[13px] font-medium text-[#8A8A8A]">


                            <div className="flex flex-col items-left gap-1 text-[14px]">
                                <span className={step === 1 ? "text-black" : ""}>Setup</span>

                                <div
                                    className={`h-[8px] w-[189px]  transition-all ${step >= 1 ? "bg-[#2E90FA]" : "bg-[#E4E4E4]"
                                        }`}
                                ></div>
                            </div>

                            {/* Template */}
                            <div className="flex flex-col items-left gap-1 text-[14px]">
                                <span className={step === 2 ? "text-black" : ""}>Template</span>
                                <div
                                    className={`h-[8px] w-[189px] transition-all ${step >= 2 ? "bg-[#2E90FA]" : "bg-[#E4E4E4]"
                                        }`}
                                ></div>
                            </div>

                            {/* Preview */}
                            <div className="flex flex-col items-left gap-1 text-[14px]">
                                <span className={step === 3 ? "text-black" : ""}>Preview</span>
                                <div
                                    className={`h-[8px] w-[189px] transition-all ${step >= 3 ? "bg-[#2E90FA]" : "bg-[#E4E4E4]"
                                        }`}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="ps-6 "
                    >
                        {step === 1 && (
                            <div className="space-y-6 mt-10 md:max-w-[50%] m-auto">

                                {/* Mode */}
                                <div>
                                    <label className="block text-base text-[#4B4B4B] mb-1">
                                        Mode of communication
                                    </label>

                                    <Select
                                        value={communicationMode}
                                        onChange={(selected) => {
                                            setCommunicationMode(selected);              // <-- store whole selected object
                                            setForm({ ...form, communication: selected.value });  // store value in form
                                        }}
                                        options={communicationOptions}
                                        className="text-base"
                                        classNamePrefix="react-select"
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

                                {/* Title */}
                                <div>
                                    <label className="block text-base text-[#4B4B4B] mb-1">Title</label>
                                    <input
                                        className={inputClass}
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-base text-[#4B4B4B] mb-1">
                                        {communicationMode?.label || "Communication"} Template Category
                                    </label>

                                    <div className="relative">
                                        {/* SELECT BOX */}
                                        <div
                                            onClick={() => setCategoryOpen(!categoryOpen)}
                                            className="border border-gray-300 rounded-2xl px-4 py-3 cursor-pointer bg-white"
                                        >
                                            {form.categoryNames.length === 0 ? (
                                                <span className="text-gray-400">Select category</span>
                                            ) : (
                                                <span className="font-medium">{form.categoryNames.join(", ")}</span>
                                            )}
                                        </div>

                                        {categoryOpen && (
                                            <div className="absolute top-full left-0 w-full bg-white mt-2 p-4 rounded-2xl shadow-xl z-50">
                                                {/* Add new category input */}
                                                <input
                                                    type="text"
                                                    placeholder="Add new category"
                                                    value={categorySearch}
                                                    onChange={(e) => setCategorySearch(e.target.value)}
                                                    className="w-full border rounded-xl pl-4 py-2 border-gray-200 focus:outline-none"
                                                />

                                                {/* Category List (render names, store IDs) */}
                                                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                                                    {templateCategories.map((cat) => {
                                                        const checked = form.category.includes(cat.id);
                                                        return (
                                                            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() =>
                                                                        setForm((prev) => ({
                                                                            ...prev,
                                                                            category: checked
                                                                                ? prev.category.filter((x) => x !== cat.id)
                                                                                : [...prev.category, cat.id],
                                                                            categoryNames: checked
                                                                                ? prev.categoryNames.filter((x) => x !== cat.category)
                                                                                : [...prev.categoryNames, cat.category],
                                                                        }))
                                                                    }
                                                                    className="h-4 w-4"
                                                                />
                                                                <span className="text-gray-700">{cat.category}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>

                                                {/* Buttons */}
                                                <div className="flex justify-between mt-4">
                                                    {form.category.length > 0 && (
                                                        <button
                                                            className="px-4 py-1 rounded-lg border text-gray-500"
                                                            onClick={() => setForm((p) => ({ ...p, category: [], categoryNames: [] }))}
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                                    <button
                                                        className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                                                        onClick={() => {
                                                            handleSaveCategory();
                                                            setCategoryOpen(false);  // ✅ closes dropdown
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-base text-[#4B4B4B] mb-1">Tags</label>
                                    <Select
                                        value={form.tags ? { label: form.tags, value: form.tags } : null}
                                        onChange={(e) => setForm({ ...form, tags: e.value })}
                                        options={[{ label: "Default", value: "Default" }, { label: "tag 1", value: "tag 1" }, { label: "tag 2", value: "tag 2" }]}
                                        className="text-base"
                                        placeholder=""
                                        classNamePrefix="react-select"
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

                                {/* Next button */}
                                <button
                                    disabled={!communicationMode?.value}
                                    className={`w-full mt-4 py-3 rounded-xl text-white font-medium text-base
    ${!communicationMode?.value ? "bg-gray-400 cursor-not-allowed" : "bg-[#237FEA]"}
  `}
                                    onClick={next}
                                >
                                    Next
                                </button>

                            </div>
                        )}

                        {step === 2 && (
                            <>
                                {isEmailMode && (
                                    <TemplateBuilder
                                        blocks={builderBlocks}
                                        setBlocks={setBuilderBlocks}
                                        subject={builderSubject}
                                        setSubject={setBuilderSubject}
                                        isPreview={builderPreview}
                                        setIsPreview={setBuilderPreview}
                                    />
                                )}

                                {isTextMode && (
                                    <div className="max-w-md mx-auto mt-10 space-y-6">

                                        {/* Sender */}
                                        <div>
                                            <label className="block text-base text-[#4B4B4B] mb-1">Sender</label>
                                            <input
                                                className="w-full px-4 py-3 border border-[#E2E1E5] rounded-xl bg-white"
                                                placeholder="Text"
                                                value={textform.sender}
                                                onChange={(e) =>
                                                    setTextForm({ ...textform, sender: e.target.value })
                                                }
                                            />
                                        </div>

                                        {/* SMS Text Box */}
                                        <div>
                                            <label className="block text-base text-[#4B4B4B] mb-2">Message</label>

                                            {/* Variables Toolbar */}
                                            <div className="flex gap-2 flex-wrap mb-2">
                                                {variableOptions.map((v) => (
                                                    <button
                                                        key={v.value}
                                                        onClick={() => insertVariable(v.value)}
                                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 rounded-full border border-gray-200 transition"
                                                    >
                                                        + {v.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                ref={textMsgRef}
                                                className="w-full h-40 px-4 py-3 border border-[#E2E1E5] rounded-xl bg-white"
                                                maxLength={160}
                                                placeholder="Enter message..."
                                                value={textform.message}
                                                onChange={(e) =>
                                                    setTextForm({ ...textform, message: e.target.value })
                                                }
                                            ></textarea>

                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>1 Credit</span>
                                                <span>
                                                    {textform.message.length}/160 Characters used
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="w-full mt-4 py-3 rounded-xl bg-[#237FEA] text-white font-medium text-base"
                                            onClick={next}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {step === 3 && (
                            <>
                                {isEmailMode && (
                                    <div className="space-y-6">
                                        <PreviewModal
                                            mode_of_communication={communicationMode}
                                            title={form.title}
                                            category={form.category}
                                            tags={form.tags}
                                            sender={textform.sender}
                                            message={textform.message}
                                            blocks={builderBlocks}
                                            subject={builderSubject}
                                            onClose={() => setBuilderPreview(false)}
                                            // ✅ only send when edit mode exists
                                            editMode={isEditMode}
                                            templateId={isEditMode ? templateId : null}
                                        />

                                    </div>
                                )}

                                {isTextMode && (
                                    <div className="max-w-md mx-auto mt-10 space-y-6">
                                        <div className="flex justify-end ">
                                            <button
                                                className="mt-5 bg-blue-600 w-full max-w-fit text-white px-4 py-2 rounded-lg flex justify-end"
                                                onClick={isEditMode ? handleUpdateTemplate : handleSaveTextTemplate}
                                            >
                                                {isEditMode ? "Update Template" : "Save Template"}
                                            </button>

                                        </div>
                                        <h3 className="text-[20px] font-semibold text-center">Preview</h3>

                                        {/* CSS-Based Phone Mockup */}
                                        <div className="mx-auto border-gray-300 border-[8px] rounded-[2.5rem] h-[550px] w-[300px] bg-white overflow-hidden relative shadow-2xl flex flex-col">
                                            {/* Notch/Top Bar */}
                                            <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center justify-center relative">
                                                <div className="w-16 h-4 bg-gray-200 rounded-full"></div>
                                            </div>

                                            {/* Screen Content */}
                                            <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col justify-end pb-10">
                                                <div className="text-center text-xs text-gray-400 mb-4">Today 9:41 AM</div>

                                                {/* Chat Bubble */}
                                                <div className="bg-[#237FEA] text-white p-3 rounded-2xl rounded-br-sm self-end max-w-[85%] shadow-sm text-sm whitespace-pre-wrap break-words">
                                                    {textform.message || "Preview message..."}
                                                </div>
                                            </div>

                                            {/* Bottom Bar */}
                                            <div className="h-12 bg-gray-50 border-t border-gray-200 flex items-center px-4 gap-2">
                                                <div className="w-6 h-6 rounded-full border border-gray-300 bg-gray-200"></div>
                                                <div className="flex-1 h-8 rounded-full border border-gray-300 bg-white"></div>
                                            </div>
                                        </div>

                                        <button
                                            className="w-full py-3 bg-blue-500 text-white rounded-xl"
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
}


