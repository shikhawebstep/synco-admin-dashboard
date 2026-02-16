const MultipleInfoBoxRenderer = ({ block, update, readOnly }) => {
    const style = block.style || {};
    const boxStyle = block.boxStyle || {};

    const containerStyle = {
        ...getCommonStyles(block),
        display: style.display || "grid",
    };

    const updateBox = (boxId, key, value) => {
        const newBoxes = (block.boxes || []).map((b) =>
            b.id === boxId ? { ...b, [key]: value } : b
        );
        update("boxes", newBoxes);
    };

    const updateBoxItem = (boxId, itemIndex, key, value) => {
        const newBoxes = (block.boxes || []).map((b) => {
            if (b.id !== boxId) return b;
            const newItems = [...(b.items || [])];
            newItems[itemIndex] = { ...newItems[itemIndex], [key]: value };
            return { ...b, items: newItems };
        });
        update("boxes", newBoxes);
    };

    const addBox = () => {
        const newBox = {
            id: crypto.randomUUID(),
            title: "New Box",
            items: [{ label: "Label", value: "Value" }]
        };
        update("boxes", [...(block.boxes || []), newBox]);
    };

    const duplicateBox = (boxId) => {
        const boxIndex = (block.boxes || []).findIndex(b => b.id === boxId);
        if (boxIndex === -1) return;
        const duplicatedBox = {
            ...block.boxes[boxIndex],
            id: crypto.randomUUID(),
            items: (block.boxes[boxIndex].items || []).map(it => ({ ...it }))
        };
        const newBoxes = [
            ...block.boxes.slice(0, boxIndex + 1),
            duplicatedBox,
            ...block.boxes.slice(boxIndex + 1)
        ];
        update("boxes", newBoxes);
    };

    const removeBox = (boxId) => {
        update("boxes", (block.boxes || []).filter(b => b.id !== boxId));
    };

    return (
        <div
            className={`block-component block-${block.type} block-${block.id}`}
            style={containerStyle}
        >
            {(block.boxes || []).map((box) => (
                <div
                    key={box.id}
                    className={!readOnly ? "relative group/box" : ""}
                    style={{
                        backgroundColor: boxStyle.backgroundColor || "#ffffff",
                        borderRadius: parseUnit(boxStyle.borderRadius) || "12px",
                        padding: parseUnit(boxStyle.padding) || "20px",
                        boxShadow: boxStyle.boxShadow || "0 2px 4px rgba(0,0,0,0.05)",
                        border: boxStyle.border || (boxStyle.borderWidth ? `${boxStyle.borderWidth}px solid ${boxStyle.borderColor || "#eee"}` : "1px solid #eee"),
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                    }}
                >
                    {/* Controls */}
                    {!readOnly && (
                        <div className="absolute -top-3 -right-3 flex gap-1 z-10 opacity-0 group-hover/box:opacity-100 transition">
                            <button
                                className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-blue-600 shadow-lg"
                                onClick={(e) => { e.stopPropagation(); duplicateBox(box.id); }}
                                title="Duplicate Box"
                            >
                                <FaCopy size={8} />
                            </button>
                            <button
                                className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                                onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Title */}
                    {readOnly ? (
                        <h4 style={{
                            margin: 0,
                            fontSize: boxStyle.titleFontSize ? `${boxStyle.titleFontSize}px` : "18px",
                            fontWeight: 800,
                            color: boxStyle.titleColor || "#111827"
                        }}>
                            {box.title}
                        </h4>
                    ) : (
                        <input
                            className="w-full bg-transparent outline-none font-bold text-lg border-b border-dashed border-gray-100 pb-1"
                            value={box.title}
                            onChange={(e) => updateBox(box.id, "title", e.target.value)}
                            placeholder="Box Title"
                            style={{ color: boxStyle.titleColor || "#111827" }}
                        />
                    )}

                    {/* Items */}
                    <div
                        className="grid gap-3"
                        style={{
                            gridTemplateColumns: `repeat(${boxStyle.columns || 1}, 1fr)`,
                        }}
                    >
                        {(box.items || []).map((item, idx) => (
                            <div key={idx} className={!readOnly ? "flex flex-col gap-1 relative group/item" : "flex flex-col gap-1"}>
                                {!readOnly && (
                                    <button
                                        onClick={() => {
                                            const newItems = (box.items || []).filter((_, i) => i !== idx);
                                            updateBox(box.id, "items", newItems);
                                        }}
                                        className="absolute -right-2 top-0 text-red-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition"
                                    >
                                        ×
                                    </button>
                                )}
                                {readOnly ? (
                                    <div>
                                        <div style={{
                                            fontWeight: 700,
                                            fontSize: "12px",
                                            textTransform: "uppercase",
                                            color: boxStyle.labelColor || "#6b7280",
                                            marginBottom: "2px"
                                        }}>{item.label}</div>
                                        <div style={{
                                            fontSize: "14px",
                                            color: boxStyle.valueColor || "#111827"
                                        }} dangerouslySetInnerHTML={{ __html: item.value || "" }} />
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            className="w-full text-[10px] font-bold uppercase text-gray-400 bg-transparent outline-none border-b border-gray-50"
                                            value={item.label}
                                            onChange={(e) => updateBoxItem(box.id, idx, "label", e.target.value)}
                                            placeholder="Label"
                                        />
                                        <VariableTextarea
                                            className="w-full text-sm bg-transparent outline-none resize-none overflow-hidden"
                                            value={item.value}
                                            onChange={(e) => updateBoxItem(box.id, idx, "value", e.target.value)}
                                            placeholder="Value"
                                            showVariables={false}
                                        />
                                    </>
                                )}
                            </div>
                        ))}

                        {!readOnly && (
                            <button
                                onClick={() => {
                                    const newItems = [...(box.items || []), { label: "Label", value: "Value" }];
                                    updateBox(box.id, "items", newItems);
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700 font-bold mt-2 self-start flex items-center gap-1 col-span-full"
                            >
                                <FaPlus size={10} /> Add Item
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Add Box */}
            {!readOnly && (
                <button
                    onClick={addBox}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition flex flex-col items-center justify-center gap-2 min-h-[150px]"
                >
                    <FaPlus size={20} />
                    <span className="text-xs font-bold uppercase">Add New Box</span>
                </button>
            )}
        </div>
    );
};
