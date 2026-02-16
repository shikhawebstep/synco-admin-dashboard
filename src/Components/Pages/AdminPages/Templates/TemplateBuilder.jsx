import React, { useState, useCallback, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import {
  FaFont, FaHeading, FaImage, FaRegImage, FaMousePointer, FaColumns,
  FaList, FaShareAlt, FaCompass, FaMinus, FaChevronCircleDown,
  FaIdCard, FaLayerGroup, FaMagic, FaStar, FaInfoCircle,
} from "react-icons/fa";

import BlockRenderer, { AdvancedStyleControls } from "./BlockRenderer";
import PreviewModal from "./PreviewModal";
import { useCommunicationTemplate } from "../contexts/CommunicationContext";

export default function TemplateBuilder({
  blocks,
  setBlocks,
  subject,
  setSubject,
  isPreview,
  setIsPreview
}) {
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("blocks"); // "blocks" or "settings"

  useEffect(() => {
    if (selectedBlockId) {
      setSidebarTab("settings");
    }
  }, [selectedBlockId]);

  const { apiTemplates } = useCommunicationTemplate();

  useEffect(() => {
    if (!apiTemplates?.content) return;

    try {
      const parsed = JSON.parse(apiTemplates.content);

      // ✅ Set subject
      setSubject(parsed.subject || "");

      // ✅ If backend only stored HTML
      if (parsed.htmlContent) {
        setBlocks([
          {
            id: crypto.randomUUID(),
            type: "customHTML",
            content: parsed.htmlContent,
            style: {
              backgroundColor: "transparent",
              padding: 10,
            },
          },
        ]);
      }

      // ✅ If future backend stores blocks properly
      if (parsed.blocks) {
        setBlocks(parsed.blocks);
      }

    } catch (error) {
      console.error("Template parse error:", error);
    }
  }, [apiTemplates, setBlocks, setSubject]);





  const updateStyle = (key, value, rootKey = null) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBlockId) return b;

        // ✅ Handle Nested Child Updates (from AdvancedStyleControls)
        if (key === "childUpdate") {
          const { childId, key: childKey, value: childValue, rootKey: childRootKey } = value;

          if (b.type === "sectionGrid" && Array.isArray(b.columns)) {
            const newColumns = b.columns.map(col =>
              col.map(child => {
                if (child.id === childId) {
                  // Apply update to the specific child
                  if (childRootKey === true) return { ...child, [childKey]: childValue };

                  if (typeof childRootKey === 'string') {
                    return {
                      ...child,
                      [childRootKey]: { ...(child[childRootKey] || {}), [childKey]: childValue }
                    };
                  }

                  return { ...child, style: { ...(child.style || {}), [childKey]: childValue } };
                }
                return child;
              })
            );
            return { ...b, columns: newColumns };
          }
          return b;
        }

        // If rootKey is true, update the property on the block root
        if (rootKey === true) return { ...b, [key]: value };

        // If rootKey is a string (e.g., 'titleStyle'), update property within that object
        if (typeof rootKey === 'string') {
          return {
            ...b,
            [rootKey]: { ...(b[rootKey] || {}), [key]: value }
          };
        }

        // Default: update property within the 'style' object
        return { ...b, style: { ...(b.style || {}), [key]: value } };
      })
    );
  };


  const sidebarBlocks = [
    { id: "text", label: "Text field", icon: <FaFont /> },
    { id: "heading", label: "Heading", icon: <FaHeading /> },
    { id: "image", label: "Image", icon: <FaRegImage /> },
    { id: "btn", label: "Button", icon: <FaMousePointer /> },
    { id: "sectionGrid", label: "Section Grid", icon: <FaColumns /> },
    { id: "divider", label: "Divider", icon: <FaMinus /> },
    { id: "cardRow", label: "Cards", icon: <FaLayerGroup /> },
    { id: "infoBox", label: "Info Box", icon: <FaInfoCircle /> },
    { id: "heroSection", label: "Hero (Wavy)", icon: <FaStar /> },
    { id: "multipleInfoBox", label: "Multi-Info Cards", icon: <FaLayerGroup /> },
    { id: "footerBlock", label: "Footer", icon: <FaInfoCircle /> },
  ];

  const addBlock = async (type, columnCount = 2) => {
    const defaultStyle = {
      backgroundColor: "transparent",
      textColor: "#000000",
      fontSize: 16,
      textAlign: "left",
      padding: 10,
      borderRadius: 0,
      fontWeight: "normal",
      borderWidth: 0,
      borderColor: "#000000",
      width: "100%",
      height: "auto",
      fontFamily: "inherit",
      maxWidth: "100%",
      marginTop: 0,
      marginBottom: 20,
      backgroundImage: "",
      display: "block",
      flexDirection: "row",
      gap: 0,
      alignItems: "stretch",
      justifyContent: "start",
      boxShadow: "none",
    };

    const newBlock = {
      id: crypto.randomUUID(),
      type,
      content: "",
      url: "",
      placeholder: "Enter value",
      style: { ...defaultStyle },
      items: [], // For grids, lists, or accordions
      links: [], // For social/nav
      title: "", // For Card
      description: "", // For Card
      children: [], // For Custom Section
      backgroundImage: "", // For Custom Section
    };

    // Type-specific adjustments
    if (type === "heading") {
      newBlock.style.fontSize = 24;
      newBlock.style.fontWeight = "bold";
      newBlock.placeholder = "Enter Heading";
    } else if (type === "customSection") {
      newBlock.style.padding = 40;
      newBlock.style.textAlign = "center";
    } else if (type === "btn") {
      newBlock.style.backgroundColor = "#237FEA";
      newBlock.style.textColor = "#ffffff";
      newBlock.style.borderRadius = 8;
      newBlock.style.textAlign = "center";
      newBlock.content = "Click Here";
    } else if (type === "sectionGrid") {
      newBlock.columns = Array(columnCount).fill(null).map(() => []);
      newBlock.style.display = "grid";
      newBlock.style.gap = 16;
    } else if (type === "featureGrid") {
      newBlock.style.backgroundColor = "#f9f9f9";
      newBlock.style.borderRadius = 12;
      newBlock.items = [
        { label: "Name", value: "John Doe" },
        { label: "Date", value: "2024-01-01" }
      ];
    } else if (type === "divider") {
      newBlock.style.padding = 20;
    } else if (type === "cardRow") {
      newBlock.style.display = "flex";
      newBlock.style.flexDirection = "row";
      newBlock.style.gap = 20;
      newBlock.style.justifyContent = "start";
      newBlock.cards = [
        { id: crypto.randomUUID(), title: "Card 1", description: "Description 1", url: "", style: { backgroundColor: "#ffffff", borderRadius: 12, padding: 20 } },
        { id: crypto.randomUUID(), title: "Card 2", description: "Description 2", url: "", style: { backgroundColor: "#ffffff", borderRadius: 12, padding: 20 } }
      ];
    } else if (type === "heroSection") {
      newBlock.style.backgroundColor = "#237FEA";
      newBlock.style.textColor = "#ffffff";
      newBlock.style.textAlign = "left";
      newBlock.style.padding = 60;
      newBlock.title = "Welcome to Samba Soccer";
      newBlock.subtitle = "Where kids learn to play with flair and passion.";
      newBlock.buttonText = "Join Us Now";
      newBlock.link = "#";
      newBlock.titleStyle = { fontSize: 36, fontWeight: "600", textColor: "#ffffff" };
      newBlock.subtitleStyle = { fontSize: 18, textColor: "#ffffff", opacity: 0.9 };
      newBlock.buttonStyle = { backgroundColor: "#FBBF24", textColor: "#000000", borderRadius: 30 };
    } else if (type === "infoBox") {
      newBlock.style.backgroundColor = "#eaf3ff";
      newBlock.style.borderRadius = 12;
      newBlock.style.padding = 20;
      newBlock.style.flexDirection = "column";
      newBlock.style.gap = 16;
      newBlock.items = [
        { label: "Label 1", value: "Value 1" },
        { label: "Label 2", value: "Value 2" }
      ];
    } else if (type === "multipleInfoBox") {
      newBlock.style.display = "grid";
      newBlock.style.columns = 2;
      newBlock.style.gap = 20;
      newBlock.boxStyle = {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        border: "1px solid #eee"
      };
      newBlock.boxes = [
        {
          id: crypto.randomUUID(),
          title: "Box 1",
          items: [
            { label: "Label 1", value: "Value 1" },
            { label: "Label 2", value: "Value 2" }
          ]
        },
        {
          id: crypto.randomUUID(),
          title: "Box 2",
          items: [
            { label: "Label A", value: "Value A" },
            { label: "Label B", value: "Value B" }
          ]
        }
      ];
    }

    setBlocks((prev) => [...prev, newBlock]);
  };


  const deleteBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const duplicateBlock = (id) => {
    const block = blocks.find((b) => b.id === id);

    // ✅ deep clone (break shared references)
    const clonedBlock = JSON.parse(JSON.stringify(block));

    // ✅ assign brand new IDs
    const regenerateIds = (blk) => {
      blk.id = crypto.randomUUID();

      // sectionGrid → regenerate child IDs
      if (blk.type === "sectionGrid" && Array.isArray(blk.columns)) {
        blk.columns = blk.columns.map((column) =>
          column.map((child) => {
            const clonedChild = { ...child };
            regenerateIds(clonedChild);
            return clonedChild;
          })
        );
      }

      // cardRow → regenerate child card IDs
      if (blk.type === "cardRow" && Array.isArray(blk.cards)) {
        blk.cards = blk.cards.map((card) => ({
          ...card,
          id: crypto.randomUUID()
        }));
      }

      // multipleInfoBox → regenerate child box IDs
      if (blk.type === "multipleInfoBox" && Array.isArray(blk.boxes)) {
        blk.boxes = blk.boxes.map((box) => ({
          ...box,
          id: crypto.randomUUID(),
          items: (box.items || []).map(item => ({ ...item }))
        }));
      }
    };

    regenerateIds(clonedBlock);

    setBlocks((prev) => [...prev, clonedBlock]);
  };


  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setBlocks(items);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Canvas */}
      <div
        className="w-10/12 p-6 border-r border-gray-200 overflow-y-auto"
        style={{ maxHeight: '100vh' }}
        onClick={() => setSelectedBlockId(null)}
      >
        <div className="mb-6">
          <label className="font-medium text-gray-700">Subject line</label>
          <input
            className="w-full border border-gray-200 px-4 py-2 rounded-lg mt-1"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject..."
          />
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="canvas">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`min-h-[200px] rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-blue-50 ring-2 ring-blue-100 ring-inset" : ""}`}
              >
                {blocks.map((block, index) => (
                  <Draggable
                    key={block.id}
                    draggableId={block.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        className={`bg-white rounded-lg border border-gray-200 mb-2 shadow-sm transition-shadow ${snapshot.isDragging ? "shadow-lg ring-2 ring-blue-400 z-50" : ""}`}
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        style={{
                          ...provided.draggableProps.style,
                          // Maintain original transform but ensure z-index in portal if needed (though not using portal here)
                        }}
                      >
                        {/* Block wrapper padding is applied here or inside content. 
                             Using p-2 to reduce gap. Header takes space. 
                             BlockRenderer has its own padding/margin from style. 
                         */}
                        <div className="p-2 border-b border-gray-50 flex justify-between items-center text-xs bg-gray-50/50 rounded-t-lg">
                          <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600 px-2 py-1">
                            <FaLayerGroup className="inline mr-1" /> <span className="uppercase font-bold tracking-wider">{block.type}</span>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => duplicateBlock(block.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
                              title="Duplicate"
                            >
                              <FaList />
                            </button>

                            <button
                              onClick={() => deleteBlock(block.id)}
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded transition"
                              title="Delete"
                            >
                              <FaMinus />
                            </button>
                          </div>
                        </div>

                        {/* Block Body */}
                        <div className="p-3">
                          <BlockRenderer
                            block={block}
                            blocks={blocks}
                            setBlocks={setBlocks}
                            isSelected={selectedBlockId === block.id}
                            onSelect={() => setSelectedBlockId(block.id)}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

      </div>
      <div
        className="p-4 w-3/12 bg-white flex flex-col border-l border-gray-200 shadow-xl z-30 overflow-y-auto"
        style={{ maxHeight: '100vh', position: 'sticky', top: 0 }}
      >
        {/* Sidebar Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setSidebarTab("blocks")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${sidebarTab === "blocks" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Blocks
          </button>
          <button
            onClick={() => setSidebarTab("settings")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${sidebarTab === "settings" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Settings
          </button>
        </div>

        {sidebarTab === "blocks" ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Layout Presets */}
            <div className="mb-8">
              <h3 className="font-semibold text-sm text-gray-400 uppercase mb-4 tracking-widest">Layouts</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "1 Column", cols: 1 },
                  { label: "2 Columns", cols: 2 },
                  { label: "3 Columns", cols: 3 },
                  { label: "4 Columns", cols: 4 },
                ].map((layout) => (
                  <button
                    key={layout.label}
                    onClick={() => addBlock("sectionGrid", layout.cols)}
                    className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-10 h-7 rounded bg-white border border-gray-200 flex gap-0.5 p-0.5 mb-2 group-hover:border-blue-200 transition">
                      {Array(layout.cols).fill(0).map((_, i) => (
                        <div key={i} className="flex-1 bg-gray-200 rounded-sm group-hover:bg-blue-200 transition" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 uppercase">{layout.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <h3 className="font-semibold text-sm text-gray-400 uppercase mb-4 tracking-widest">Available Blocks</h3>
            <div className="grid grid-cols-1 gap-2">
              {sidebarBlocks.map((block) => (
                <div
                  key={block.id}
                  onClick={() => addBlock(block.id)}
                  className="px-4 py-3 rounded-xl cursor-pointer bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center gap-3 group"
                >
                  <span className="text-gray-400 text-lg group-hover:text-blue-600 transition-colors">{block.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 flex-1">{block.label}</span>
                  <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition text-lg">+</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="font-semibold text-sm text-gray-400 uppercase mb-4 tracking-widest">Variables</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "First Name", value: "{{FirstName}}" },
                  { label: "Last Name", value: "{{LastName}}" },
                  { label: "Parent Name", value: "{{parentName}}" },
                  { label: "Parent Email", value: "{{parentEmail}}" },
                  { label: "Parent Password", value: "{{parentPassword}}" },
                  { label: "Student First Name", value: "{{studentFirstName}}" },
                  { label: "Student Last Name", value: "{{studentLastName}}" },
                  { label: "Kids Playing", value: "{{kidsPlaying}}" },
                  { label: "Venue Name", value: "{{venueName}}" },
                  { label: "Facility", value: "{{facility}}" },
                  { label: "Class Name", value: "{{className}}" },
                  { label: "Class Time", value: "{{classTime}}" },
                  { label: "Time", value: "{{time}}" },
                  { label: "Start Date", value: "{{startDate}}" },
                  { label: "End Date", value: "{{endDate}}" },
                  { label: "Trial Date", value: "{{trialDate}}" },
                  { label: "Price", value: "{{price}}" },
                  { label: "Logo URL", value: "{{logoUrl}}" },
                  { label: "Students List (HTML)", value: "{{studentsHtml}}" },
                  { label: "Company", value: "{{Company}}" },
                  { label: "Link", value: "{{Link}}" },
                ].map((v) => (
                  <div
                    key={v.value}
                    onClick={() => {
                      navigator.clipboard.writeText(v.value);
                      alert(`Copied ${v.value} to clipboard!`);
                    }}
                    className="px-3 py-2 rounded-lg cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium border border-blue-100 flex justify-between items-center"
                  >
                    <span>{v.label}</span>
                    <span className="text-[10px] bg-white px-1 rounded border shadow-sm">{v.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-4 duration-200">
            {selectedBlockId ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Edit Block</h3>
                  <button
                    onClick={() => setSelectedBlockId(null)}
                    className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase transition"
                  >
                    Close
                  </button>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-6 font-medium text-xs text-blue-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Editing: {blocks.find(b => b.id === selectedBlockId)?.type.toUpperCase()}
                </div>
                <AdvancedStyleControls
                  block={blocks.find(b => b.id === selectedBlockId)}
                  updateStyle={updateStyle}
                />
              </>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <div className="mb-4 text-4xl">🖱️</div>
                <p className="text-sm">Click on any block in the canvas to edit its properties.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}


    </div>
  );
}
