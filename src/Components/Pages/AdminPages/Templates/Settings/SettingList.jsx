import React, { useState, useEffect } from "react";
import { FiSearch, FiMail, FiFileText, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunicationTemplate } from "../../contexts/CommunicationContext";
import { useNavigate } from "react-router-dom";
import { showConfirm, showSuccess, showError } from "../../../../../utils/swalHelper";
import Loader from "../../contexts/Loader";

export default function SettingList() {
    const { fetchCommunicationTemplate, loading, apiTemplates, deleteCommunicationTemplate } = useCommunicationTemplate();
    const navigate = useNavigate();   // ✅ declare navigate

    const [activeTab, setActiveTab] = useState("Email");
    const [searchText, setSearchText] = useState("");
    const [openSection, setOpenSection] = useState({});
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [previewData, setPreviewData] = useState({ subject: "", blocks: [] });

    useEffect(() => {
        const load = async () => {
            try {
                await fetchCommunicationTemplate?.();
            } catch (error) {
                console.error("Failed to load templates:", error);
            }
        };

        load();
    }, []);


    // Filter data based on active tab
    const modeData =
        activeTab === "Email"
            ? apiTemplates?.email ?? []
            : apiTemplates?.text ?? [];
    const filteredData = (modeData ?? []).filter((section) => {
        const search = searchText?.toLowerCase?.() ?? "";

        const categoryMatch =
            section?.template_category?.toLowerCase?.()?.includes(search);

        const templateMatch =
            section?.templates?.some(
                (t) => t?.title?.toLowerCase?.()?.includes(search)
            ) ?? false;

        return categoryMatch || templateMatch;
    });


    const toggleSection = (sectionName) => {
        if (!sectionName) return;

        setOpenSection((prev) => ({
            ...prev,
            [sectionName]: !prev?.[sectionName],
        }));
    };
    const selectTemplate = (template) => {
        if (!template) return;

        setSelectedTemplate(template);

        if (
            template?.mode_of_communication === "email" &&
            template?.content
        ) {
            try {
                const contentObj =
                    typeof template.content === "string"
                        ? JSON.parse(template.content)
                        : template.content ?? {};

                setPreviewData({
                    subject: contentObj?.subject ?? "",
                    blocks: contentObj?.blocks ?? [],
                });
            } catch (err) {
                console.error("Invalid content JSON", err);
                setPreviewData({ subject: "", blocks: [] });
            }
        } else {
            setPreviewData({
                subject: "",
                blocks: [
                    {
                        type: "text",
                        content:
                            template?.content?.blocks?.[0]?.content ??
                            template?.content ??
                            "",
                    },
                ],
            });
        }
    };

    const handleEdit = (id, level) => {
        if (!id) return;

        console.log("Edit Clicked, ID:", id);
        navigate(`/templates/create?id=${id}&level=${level ?? ""}`);
    };

    const handleDelete = (id) => {
        if (!id) return;

        console.log("Delete Clicked, ID:", id);

        showConfirm(
            "Are you sure?",
            "You won't be able to revert this!",
            "warning"
        )?.then((result) => {
            if (result?.isConfirmed) {
                deleteCommunicationTemplate?.(id);
                showSuccess?.("Deleted!", "Your template has been deleted.");
            } else {
                showError?.(
                    "Cancelled",
                    "Your template is safe 🙂"
                );
            }
        });
    };

    if (loading) {
        return <Loader />
    }
    return (
        <div className="max-w-full mx-auto px-6 py-8">
            <h2 className="text-base mb-6">Settings / <span className="text-blue-600">Templates</span></h2>
            <div className="flex gap-10">

                {/* LEFT SIDEBAR */}
                <div className="w-4/12 bg-white rounded-2xl border border-gray-200">

                    {/* SEARCH */}
                    <div className="relative m-6 max-w-sm">
                        <input
                            className="w-full border border-gray-300 bg-white text-sm rounded-xl px-3 py-3 pl-10 focus:outline-none"
                            placeholder={`Search ${activeTab}`}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                        <FiSearch className="absolute left-3 top-4 text-gray-400 text-lg" />
                    </div>

                    {/* TABS */}
                    <div className="flex gap-3 m-6 bg-white border border-gray-300 rounded-xl p-0.5 w-fill">
                        {["Email", "Text"].map(tab => (
                            <motion.button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSelectedTemplate(null); }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-10 py-2 rounded-xl w-1/2 font-semibold ${activeTab === tab ? "bg-blue-500 text-white shadow" : "text-gray-700"}`}
                            >
                                {tab}
                            </motion.button>
                        ))}
                    </div>

                    {/* ACCORDION */}
                    <div className="space-y-4">
                        {filteredData?.map(section => {
                            const sectionName = section.template_category;
                            return (
                                <div key={sectionName}>

                                    {/* HEADER */}
                                    <div
                                        onClick={() => toggleSection(sectionName)}
                                        className="flex items-center justify-between border-l-[4px] border-blue-600 bg-[#F7FBFF] p-4 cursor-pointer shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#F7FBFF] p-2 rounded-lg">
                                                {activeTab === "Email" ? <FiMail className="text-blue-600" /> : <FiFileText className="text-blue-600" />}
                                            </div>
                                            <h3 className="font-semibold text-base text-gray-900">{sectionName}</h3>
                                        </div>
                                        {openSection[sectionName] ? <FiChevronUp className="text-gray-500" /> : <FiChevronDown className="text-gray-500" />}
                                    </div>

                                    {/* ITEMS */}
                                    <AnimatePresence>
                                        {openSection[sectionName] && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden bg-white border border-gray-100 pb-3"
                                            >
                                                <div className="space-y-3">
                                                    {section.templates.map(item => (
                                                        <motion.div
                                                            key={item.id}
                                                            onClick={() => selectTemplate(item)}
                                                            initial={{ opacity: 0, x: -8 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -5 }}
                                                            className="flex p-4 items-start gap-3 border-b border-gray-200 pl-8 last:border-none pb-4 cursor-pointer hover:bg-gray-50"
                                                        >
                                                            <div>
                                                                <p className="font-semibold text-base text-gray-900">{item.title}</p>
                                                                <p className="text-xs text-gray-400">{item.mode_of_communication}</p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                </div>
                            );
                        })}

                        {filteredData?.length === 0 && <p className="text-gray-400 text-sm text-center mb-5">No templates found.</p>}
                    </div>
                </div>

                {/* RIGHT PREVIEW */}
                <div className="w-8/12">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center">



                        {/* EMAIL / TEXT PREVIEW */}
                        {selectedTemplate?.mode_of_communication === "email" && (
                            <div className="bg-white w-full max-w-full overflow-auto p-4 rounded-lg shadow-sm">

                                {/* ✅ OUTSIDE LOOP */}
                                <div className="flex items-center justify-between border-b border-gray-200 w-full text-left text-[15px] font-medium text-gray-900 mb-6 pb-3">
                                    <h2 className="text-lg font-semibold">
                                        {selectedTemplate ? selectedTemplate.title : "Select template"}
                                    </h2>

                                    <div className="icons flex gap-4 items-center">
                                        <img
                                            src="/images/icons/edit.png"
                                            alt="Edit"
                                            className="w-5 h-5 transition-transform duration-200 hover:scale-110 opacity-90 cursor-pointer"
                                            onClick={() => selectedTemplate && handleEdit(selectedTemplate.id, selectedTemplate.mode_of_communication)}
                                        />
                                        <img
                                            src="/images/icons/deleteIcon.png"
                                            alt="Delete"
                                            className="w-5 h-5 transition-transform duration-200 hover:scale-110 opacity-90 cursor-pointer"
                                            onClick={() => selectedTemplate && handleDelete(selectedTemplate.id)}
                                        />
                                    </div>
                                </div>

                                <div
                                    className="text-gray-800 prose prose-blue max-w-[600px] m-auto"
                                    dangerouslySetInnerHTML={{ __html: selectedTemplate?.content?.htmlContent }}
                                />
                                {/* ✅ ONLY BLOCKS IN LOOP */}

                            </div>
                        )}
                        {selectedTemplate?.mode_of_communication === "text" && (
                            <div className="bg-white w-full max-w-full overflow-auto p-4 rounded-lg shadow-sm">
                                {previewData.blocks.map((block, i) => (
                                    <div key={i} className="mb-6">

                                        {/* ✅ HEADER / TITLE BAR */}
                                        <div className="flex items-center justify-between border-b border-gray-200 w-full text-left text-[15px] font-medium text-gray-900 mb-6 pb-3">
                                            <h2 className="text-lg font-semibold">
                                                {selectedTemplate ? selectedTemplate.title : "Select template"}
                                            </h2>

                                            <div className="icons flex gap-4 items-center">
                                                <img
                                                    src="/images/icons/edit.png"
                                                    alt="Edit"
                                                    className="w-5 h-5 transition-transform duration-200 hover:scale-110 opacity-90 cursor-pointer"
                                                    onClick={() => selectedTemplate && handleEdit(selectedTemplate.id, selectedTemplate.mode_of_communication)}
                                                />
                                                <img
                                                    src="/images/icons/deleteIcon.png"
                                                    alt="Delete"
                                                    className="w-5 h-5 transition-transform duration-200 hover:scale-110 opacity-90 cursor-pointer"
                                                    onClick={() => selectedTemplate && handleDelete(selectedTemplate.id)}
                                                />
                                            </div>
                                        </div>

                                        {/* ✅ iMESSAGE MOCKUP */}
                                        <div className="bg-white border border-gray-200 rounded-xl max-w-[350px] w-full m-auto shadow-sm">
                                            <img className="w-full" src="/images/icons/TopNavigation.png" alt="" />
                                            <div className="min-h-80 p-4">
                                                <div className="bg-gray-100 p-4 rounded-xl min-h-20 text-sm text-gray-800">
                                                    {block.content}
                                                </div>
                                            </div>
                                            <img className="w-full" src="/images/icons/mobileKeyboard.png" alt="" />
                                        </div>

                                        {/* ✅ VIEW BUTTON */}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            className="bg-blue-500 text-white px-10 py-2 rounded-xl font-semibold mt-6"
                                        >
                                            View
                                        </motion.button>

                                    </div>
                                ))}
                            </div>
                        )}
                        {!["email", "text"].includes(selectedTemplate?.mode_of_communication) && (
                            <p className="text-gray-400 text-lg">
                                Select template
                            </p>
                        )}



                    </div>
                </div>

            </div>
        </div>
    );
}
