import React, { useRef, useState, useEffect } from "react";
import ReactQuill from "react-quill-new";
// import "react-quill-new/dist/quill.snow.css";
import {
  FaPlay, FaImage, FaPlus, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaChevronDown, FaChevronUp, FaPalette, FaFont, FaArrowsAltV, FaBorderAll,
  FaLayerGroup, FaHeading, FaMousePointer, FaCode, FaCopy, FaTrashAlt,
  FaCog, FaTimes, FaStickyNote, FaFacebookF, FaInstagram, FaYoutube,
  FaLinkedinIn, FaTwitter, FaShoppingCart, FaMagic, FaShareAlt
} from "react-icons/fa";

const VARIABLE_OPTIONS = [

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
];

const convertHtmlToBlocks = (html) => {
  if (!html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const extractStyles = (node) => {
    const style = {};
    if (node.style) {
      const s = node.style;
      if (s.backgroundColor) style.backgroundColor = s.backgroundColor;
      if (s.color) style.textColor = s.color;
      if (s.textAlign) style.textAlign = s.textAlign;
      if (s.padding) style.padding = parseInt(s.padding) || 0;
      if (s.fontSize) style.fontSize = parseInt(s.fontSize);
      if (s.fontWeight) style.fontWeight = s.fontWeight;
      if (s.borderRadius) style.borderRadius = parseInt(s.borderRadius) || 0;
      if (s.fontFamily) style.fontFamily = s.fontFamily.replace(/["']/g, "");
      if (s.lineHeight) style.lineHeight = s.lineHeight;
      if (s.borderTop) style.borderTop = s.borderTop;
      if (s.borderTopColor) style.topBorderColor = s.borderTopColor;
      if (s.borderTopWidth) style.borderTopWidth = parseInt(s.borderTopWidth) || 0;
      if (s.border) style.border = s.border;
      if (s.borderColor) style.borderColor = s.borderColor;
      if (s.borderWidth) style.borderWidth = parseInt(s.borderWidth) || 0;
      if (s.width) style.width = s.width;
      if (s.height) style.height = s.height;
      if (s.boxShadow) style.boxShadow = s.boxShadow;
      if (s.textShadow) style.textShadow = s.textShadow;
      if (s.marginTop) style.marginTop = parseInt(s.marginTop) || 0;
      if (s.marginBottom) style.marginBottom = parseInt(s.marginBottom) || 0;
      if (s.display) style.display = s.display;
      if (s.flexDirection) style.flexDirection = s.flexDirection;
      if (s.gap) style.gap = parseInt(s.gap) || 0;
    }
    return style;
  };

  const createBlock = (type, props) => ({
    id: crypto.randomUUID(),
    type,
    style: {
      backgroundColor: "transparent",
      textColor: "#000000",
      fontSize: 16,
      textAlign: "left",
      padding: 10,
      marginBottom: 20,
      ...props.style
    },
    ...props
  });

  const processNodeList = (nodes) => {
    const blocks = [];
    Array.from(nodes).forEach(node => {
      const result = processNode(node);
      if (Array.isArray(result)) blocks.push(...result);
      else if (result) blocks.push(result);
    });
    return blocks;
  };

  const processNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      return text ? createBlock("text", { content: text }) : null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const tag = node.tagName.toLowerCase();

    // 0. Skip style and script tags (Prevents CSS showing as text)
    if (tag === "style" || tag === "script") return null;

    const nodeStyle = extractStyles(node);

    // 1. Footer Detection
    if (tag === "footer" || node.classList.contains("footer-section")) {
      const footerData = {
        title: "Footer Title",
        subtitle: "Footer Subtitle",
        copyright: "",
        links: [],
        logoUrl: "",
        style: { ...nodeStyle, backgroundColor: nodeStyle.backgroundColor || "#062375", textColor: "#ffffff" }
      };

      const titleEl = node.querySelector("h1, h2, h3, h4");
      if (titleEl) footerData.title = titleEl.innerText;

      const paragraphs = Array.from(node.querySelectorAll("p"));
      const copyrightP = paragraphs.find(p => p.innerText.includes("©") || p.innerText.toLowerCase().includes("copyright"));
      if (copyrightP) footerData.copyright = copyrightP.innerText;

      const subtitleP = paragraphs.find(p => p !== copyrightP);
      if (subtitleP) footerData.subtitle = subtitleP.innerText;

      const logoImg = node.querySelector("img");
      if (logoImg) footerData.logoUrl = logoImg.getAttribute("src");

      const links = Array.from(node.querySelectorAll("a"));
      links.forEach(link => {
        const href = link.getAttribute("href") || "#";
        let platform = "globe";
        if (href.includes("facebook")) platform = "facebook";
        if (href.includes("instagram")) platform = "instagram";
        if (href.includes("twitter")) platform = "twitter";
        if (href.includes("youtube")) platform = "youtube";
        if (href.includes("linkedin")) platform = "linkedin";

        if (footerData.links.length < 5) {
          footerData.links.push({ platform, url: href });
        }
      });

      return createBlock("footerBlock", footerData);
    }

    // 2. Card Row Detection
    if (node.classList.contains("card-row")) {
      const cards = [];
      const children = Array.from(node.children);

      children.forEach(child => {
        const card = {
          id: crypto.randomUUID(),
          title: "Card Title",
          description: "",
          url: "",
          link: "",
          style: extractStyles(child)
        };

        const img = child.querySelector("img");
        if (img) card.url = img.getAttribute("src");

        const title = child.querySelector("h1, h2, h3, h4, h5, strong");
        if (title) card.title = title.innerText;

        const desc = child.querySelector("p");
        if (desc) card.description = desc.innerText;

        const link = child.querySelector("a");
        if (link) card.link = link.getAttribute("href");

        cards.push(card);
      });

      if (cards.length > 0) {
        return createBlock("cardRow", {
          cards,
          style: { ...nodeStyle, display: "flex", gap: 20, columns: Math.min(cards.length, 4) }
        });
      }
    }

    // 3. Handle Tables (Multi-row support)
    if (tag === "table") {
      const rows = Array.from(node.rows);
      const grids = [];

      rows.forEach(row => {
        const columns = [];
        if (!row.cells || row.cells.length === 0) return;

        Array.from(row.cells).forEach(cell => {
          columns.push(processNodeList(cell.childNodes));
        });

        if (columns.length > 0) {
          grids.push(createBlock("sectionGrid", {
            columns,
            style: { ...nodeStyle, display: "grid", gap: 20 }
          }));
        }
      });
      if (grids.length > 0) return grids;
    }

    // 2. Handle Flex / Row Divs / Card Rows
    if (tag === "div" && (node.style.display === "flex" || node.classList.contains("row") || node.classList.contains("card-row"))) {
      const columns = [];
      const children = Array.from(node.children);
      children.forEach(child => {
        columns.push(processNodeList([child]));
      });

      if (columns.length > 0) {
        return createBlock("sectionGrid", {
          columns,
          style: { ...nodeStyle, display: "grid", gap: 20 }
        });
      }
    }

    // 3. Handle Headings
    if (/^h[1-6]$/.test(tag)) {
      return createBlock("heading", {
        content: node.innerText,
        style: {
          ...nodeStyle,
          fontSize: tag === 'h1' ? 32 : tag === 'h2' ? 28 : 24,
          fontWeight: "bold"
        }
      });
    }

    // 4. Handle Images
    if (tag === "img") {
      return createBlock("image", {
        url: node.getAttribute("src") || "",
        style: { ...nodeStyle, width: "100%" }
      });
    }

    // 5. Handle Buttons
    if ((tag === "a" && (node.classList.contains("btn") || node.style.backgroundColor || node.style.border)) || tag === "button") {
      return createBlock("btn", {
        content: node.innerText,
        url: tag === "a" ? (node.getAttribute("href") || "#") : "#",
        style: {
          ...nodeStyle,
          backgroundColor: node.style.backgroundColor || "#237FEA",
          textColor: node.style.color || "#ffffff",
          borderRadius: 8,
          textAlign: "center"
        }
      });
    }

    // 6. Handle InfoBox (DL or class='infobox')
    if (tag === "dl" || node.classList.contains("infobox")) {
      const items = [];
      if (tag === "dl") {
        const dts = Array.from(node.querySelectorAll("dt"));
        const dds = Array.from(node.querySelectorAll("dd"));
        dts.forEach((dt, i) => {
          items.push({ label: dt.innerText, value: dds[i]?.innerHTML || "" });
        });
      }

      if (items.length > 0) {
        return createBlock("infoBox", {
          items,
          style: { ...nodeStyle, display: "flex", flexDirection: "row", gap: 16 }
        });
      }
    }

    // 7. Handle Links
    if (tag === "a") {
      const imgs = node.getElementsByTagName("img");
      const hasOnlyImg = imgs.length === 1 && node.innerText.trim() === "";

      if (hasOnlyImg) {
        const img = imgs[0];
        const imgStyle = extractStyles(img);
        return createBlock("image", {
          url: img.getAttribute("src") || "",
          style: { ...imgStyle, width: "100%", link: node.getAttribute("href") }
        });
      }
      return createBlock("text", {
        content: node.outerHTML,
        style: { fontSize: 16, ...nodeStyle }
      });
    }

    // 8. Handle Text Containers
    if (["p", "div", "span", "section", "article", "li", "td", "th"].includes(tag)) {
      const children = Array.from(node.children);
      const hasBlockChildren = children.some(c =>
        ["TABLE", "DIV", "SECTION", "H1", "H2", "H3", "H4", "H5", "H6", "HR", "IMG", "P", "UL", "OL", "ARTICLE", "BUTTON", "DL"].includes(c.tagName)
      );

      if (hasBlockChildren) {
        const innerBlocks = processNodeList(node.childNodes);

        // FLATTENING STRATEGY:
        if (innerBlocks.length === 1) {
          const child = innerBlocks[0];

          // A: Unwrap nested sectionGrid if parent has no layout styles
          if (child.type === "sectionGrid" && !nodeStyle.backgroundColor && !nodeStyle.border && !nodeStyle.boxShadow) {
            child.style = { ...child.style, marginTop: nodeStyle.marginTop, marginBottom: nodeStyle.marginBottom };
            return child;
          }

          // B: Unwrap single leaf blocks (Heading/Text/Image/Btn)
          if (["heading", "text", "image", "btn"].includes(child.type)) {
            child.style = { ...child.style, ...nodeStyle };
            return child;
          }
        }

        if (nodeStyle.backgroundColor || nodeStyle.border || nodeStyle.topBorderColor || nodeStyle.boxShadow || nodeStyle.padding > 15) {
          return createBlock("sectionGrid", {
            columns: [innerBlocks],
            style: { ...nodeStyle, display: "grid", gap: 20 }
          });
        }
        return innerBlocks;
      } else {
        const content = node.innerHTML.trim();
        if (!content) return null;
        return createBlock("text", {
          content: content,
          style: { fontSize: 16, ...nodeStyle }
        });
      }
    }

    // 9. Handle Lists
    if (["ul", "ol"].includes(tag)) {
      return createBlock("text", {
        content: node.outerHTML,
        style: { ...nodeStyle, fontSize: 16 }
      });
    }

    // 10. Dividers
    if (tag === "hr") {
      return createBlock("divider", { style: { ...nodeStyle, padding: 20 } });
    }

    return processNodeList(node.childNodes);
  };

  return processNodeList(doc.body.childNodes);
};

const VariableTextarea = ({ value, onChange, className, placeholder, style }) => {
  const textareaRef = useRef(null);

  const insertVariable = (variable) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || "";
    const newText = text.substring(0, start) + variable + text.substring(end);

    // Call parent onChange with event-like object
    onChange({ target: { value: newText } });

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <div className="relative group/vars">
      <div className="absolute left-10 -top-7 opacity-0 group-hover/vars:opacity-100 transition-opacity bg-white border border-gray-200 shadow-lg rounded-lg flex gap-1 p-1 z-50">
        {VARIABLE_OPTIONS.map(v => (
          <button
            key={v.value}
            onClick={() => insertVariable(v.value)}
            className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
            title={`Insert ${v.label}`}
          >
            {v.value}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={style}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
      />
    </div>
  );
};

const TextEditor = ({ value, onChange, style, placeholder, readOnly, id }) => {
  const [localValue, setLocalValue] = useState(value || "");
  const lastPropValue = useRef(value || "");

  useEffect(() => {
    // Only update localValue if the prop 'value' changed from its last known value
    // This prevents overwriting local typing state during parent rerenders
    if (value !== lastPropValue.current) {
      setLocalValue(value || "");
      lastPropValue.current = value || "";
    }
  }, [value]);

  const handleChange = (val) => {
    setLocalValue(val);
  };

  const handleBlur = () => {
    onChange(localValue);
  };

  if (readOnly) {
    return (
      <div className="ql-container ql-snow" style={{ border: "none" }}>
        <div
          className="ql-editor rich-text-content"
          style={{
            ...style,
            padding: 0,
            overflow: "visible",
            height: "auto",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
        <style>
          {`
            .rich-text-content ul { display: block; list-style-type: disc !important; padding-left: 1.5em !important; margin-bottom: 1em; }
            .rich-text-content ol { display: block; list-style-type: decimal !important; padding-left: 1.5em !important; margin-bottom: 1em; }
            .rich-text-content li { display: list-item; }
          `}
        </style>
      </div>
    );
  }

  return (
    <div id={`editor-${id}`} className="p-2 border border-dashed border-gray-200 rounded-lg min-h-[100px] bg-white hover:border-blue-400 transition" onBlur={handleBlur}>
      <ReactQuill
        theme="snow"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
          ],
        }}
      />
      <style>
        {`
          #editor-${id} .ql-editor {
            color: ${style.color};
            font-size: ${style.fontSize};
            font-weight: ${style.fontWeight};
            text-align: ${style.textAlign};
            font-family: ${style.fontFamily};
            line-height: ${style.lineHeight};
            letter-spacing: ${style.letterSpacing};
            text-decoration: ${style.textDecoration};
            text-transform: ${style.textTransform};
          }
        `}
      </style>
    </div>
  );
};

const getCommonStyles = (b) => {
  if (!b || !b.style) return {};
  const s = b.style;
  const parseUnit = (val) => {
    if (val === undefined || val === null || val === "" || Number.isNaN(val)) return undefined;
    if (typeof val === "number") return `${val}px`;
    return val;
  };

  return {
    width: s.width || "100%",
    maxWidth: s.maxWidth || "100%",
    height: s.height || "auto",
    minHeight: parseUnit(s.minHeight),
    marginTop: parseUnit(s.marginTop),
    marginBottom: parseUnit(s.marginBottom),
    padding: parseUnit(s.padding),
    backgroundColor: s.backgroundColor,
    backgroundImage: s.backgroundImage || "none",
    backgroundSize: s.backgroundSize || "cover",
    backgroundPosition: s.backgroundPosition || "center",
    borderRadius: parseUnit(s.borderRadius),
    border: s.border || (s.borderWidth ? `${s.borderWidth}px ${s.borderStyle || "solid"} ${s.borderColor || "transparent"}` : undefined),
    borderTop: s.borderTop || (s.topBorderColor ? `${s.borderTopWidth || 4}px solid ${s.topBorderColor}` : undefined),
    display: s.display || "block",
    flexDirection: s.flexDirection,
    flexWrap: s.flexWrap || "wrap",
    gap: parseUnit(s.gap),
    alignItems: s.alignItems,
    justifyContent: s.justifyContent,
    boxShadow: s.boxShadow,
    textShadow: s.textShadow,
    textAlign: s.textAlign,
    opacity: s.opacity,
    zIndex: s.zIndex,
    objectFit: s.objectFit || "fill",

    // Typography
    fontFamily: s.fontFamily,
    fontSize: parseUnit(s.fontSize),
    fontWeight: s.fontWeight,
    color: s.textColor,
    lineHeight: s.lineHeight,
    letterSpacing: parseUnit(s.letterSpacing),
    textDecoration: s.textDecoration,
    textTransform: s.textTransform,
  };
};

const CustomHTMLRenderer = ({ block, update, readOnly, isSelected, onSelect, onConvert }) => {
  const [editMode, setEditMode] = useState(false);
  const [localCode, setLocalCode] = useState(block.content || "");

  // Sync
  useEffect(() => {
    if (!editMode) {
      setLocalCode(block.content || "");
    }
  }, [block.content, editMode]);

  if (readOnly) {
    return <div style={{ ...getCommonStyles(block), overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: block.content }} />
  }

  return (
    <div
      className={`relative group ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={onSelect}
    >
      {editMode ? (
        <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
          <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
            <span className="text-xs text-gray-400 font-mono flex gap-2 items-center"><FaCode /> HTML Source Editor</span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  update("content", localCode);
                  setEditMode(false);
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-bold"
              >
                Save HTML
              </button>
            </div>
          </div>
          <textarea
            className="w-full h-80 bg-gray-950 text-green-400 font-mono text-xs p-3 outline-none border border-gray-800 rounded resize-y leading-relaxed"
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value)}
            spellCheck={false}
          />
        </div>
      ) : (
        <>
          <div
            className="p-2 min-h-[50px] relative"
            style={getCommonStyles(block)}
          >
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
            {/* Overlay to catch clicks if content is empty or tricky */}
            {!block.content && <div className="text-gray-400 text-center italic p-4 border border-dashed border-gray-300 rounded">Empty Custom HTML Block</div>}
          </div>
          {isSelected && (
            <div className="flex gap-2 absolute top-2 right-2 z-50">
              {block.content && onConvert && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvert();
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-1"
                  title="Convert this HTML block into multiple editable blocks"
                >
                  <FaMagic /> Split into Blocks
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditMode(true);
                }}
                className="bg-blue-600 shadow-lg text-white px-3 py-1.5 rounded-full text-xs hover:bg-blue-700 transition flex items-center gap-2 font-bold transform hover:scale-105"
              >
                <FaCode /> Edit Code
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
};

export const AdvancedStyleControls = ({ block, updateStyle: rawUpdateStyle }) => {
  if (!block) return null;
  const [openSection, setOpenSection] = useState("typography");
  const [activeColIndex, setActiveColIndex] = useState(0);

  const updateStyle = (key, value, rootKey = null) => {
    rawUpdateStyle(key, value, rootKey);
  };

  const Section = ({ id, title, icon, children }) => {
    const isOpen = openSection === id;
    return (
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden mb-2 shadow-sm">
        <button
          onClick={() => setOpenSection(isOpen ? null : id)}
          className={`w-full flex items-center justify-between p-3 transition text-xs font-bold uppercase tracking-wider ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {isOpen && <div className="p-3 grid grid-cols-2 gap-3 bg-gray-50/50">{children}</div>}
      </div>
    );
  };

  return (
    <div className="mt-4 flex flex-col gap-2 scale-95 origin-top-left w-[105%]">
      {/* Typography Section */}
      <Section id="typography" title="Typography" icon={<FaFont />}>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Font Family</label>
          <select
            value={block?.style?.fontFamily || "inherit"}
            onChange={(e) => updateStyle("fontFamily", e.target.value)}
            className="text-xs border rounded p-1 bg-white h-8"
          >
            <option value="inherit">Default</option>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Roboto', sans-serif">Roboto</option>
            <option value="'Outfit', sans-serif">Outfit</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier</option>
            <option value="'Handlee', cursive">Handlee</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({block?.style?.fontSize}px)</label>
          <input type="range" min="10" max="100" value={block?.style?.fontSize || 16} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Weight</label>
          <select value={block?.style?.fontWeight || "normal"} onChange={(e) => updateStyle("fontWeight", e.target.value)} className="text-xs border rounded p-1 bg-white h-8">
            <option value="normal">Normal</option>
            <option value="500">Medium</option>
            <option value="700">Bold</option>
            <option value="900">Black</option>
          </select>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Alignment</label>
          <div className="flex bg-white rounded border border-gray-200 p-1 gap-1 justify-center h-8 items-center">
            {[
              { val: "left", icon: <FaAlignLeft /> },
              { val: "center", icon: <FaAlignCenter /> },
              { val: "right", icon: <FaAlignRight /> },
              { val: "justify", icon: <FaAlignJustify /> }
            ].map(opt => (
              <button key={opt.val} onClick={() => updateStyle("textAlign", opt.val)} className={`p-1 rounded ${block?.style?.textAlign === opt.val ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {opt.icon}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
          <input type="color" value={block?.style?.textColor || "#000000"} onChange={(e) => updateStyle("textColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
        </div>
      </Section>

      {block?.type === "heroSection" && (
        <>
          <Section id="heroTitleStyles" title="Hero Title Style" icon={<FaHeading />}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({block.titleStyle?.fontSize || 36}px)</label>
              <input type="range" min="20" max="100" value={block.titleStyle?.fontSize || 36} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "titleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Weight</label>
              <select value={block.titleStyle?.fontWeight || "600"} onChange={(e) => updateStyle("fontWeight", e.target.value, "titleStyle")} className="text-xs border rounded p-1 bg-white h-8">
                <option value="normal">Normal</option>
                <option value="600">Semi-Bold</option>
                <option value="700">Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
              <input type="color" value={block.titleStyle?.textColor || "#ffffff"} onChange={(e) => updateStyle("textColor", e.target.value, "titleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
          </Section>

          <Section id="heroSubtitleStyles" title="Hero Subtitle Style" icon={<FaAlignLeft />}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({block.subtitleStyle?.fontSize || 18}px)</label>
              <input type="range" min="12" max="40" value={block.subtitleStyle?.fontSize || 18} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "subtitleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
              <input type="color" value={block.subtitleStyle?.textColor || "#ffffff"} onChange={(e) => updateStyle("textColor", e.target.value, "subtitleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Opacity ({Math.round((block.subtitleStyle?.opacity || 0.9) * 100)}%)</label>
              <input type="range" min="0" max="1" step="0.1" value={block.subtitleStyle?.opacity || 0.9} onChange={(e) => updateStyle("opacity", parseFloat(e.target.value), "subtitleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </Section>

          <Section id="heroButtonStyles" title="Hero Button Style" icon={<FaMousePointer />}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">BG Color</label>
              <input type="color" value={block.buttonStyle?.backgroundColor || "#FBBF24"} onChange={(e) => updateStyle("backgroundColor", e.target.value, "buttonStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Text Color</label>
              <input type="color" value={block.buttonStyle?.textColor || "#000000"} onChange={(e) => updateStyle("textColor", e.target.value, "buttonStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Radius ({block.buttonStyle?.borderRadius || 30}px)</label>
              <input type="range" min="0" max="50" value={block.buttonStyle?.borderRadius || 30} onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value), "buttonStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </Section>
        </>
      )}

      {block?.type === "footerBlock" && (
        <>
          <Section id="titleStyles" title="Footer Title Style" icon={<FaHeading />}>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Font Family</label>
              <select
                value={block.titleStyle?.fontFamily || "Georgia, serif"}
                onChange={(e) => updateStyle("fontFamily", e.target.value, "titleStyle")}
                className="text-xs border rounded p-1 bg-white h-8"
              >
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Outfit', sans-serif">Outfit</option>
                <option value="Georgia, serif">Georgia</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({block.titleStyle?.fontSize || 32}px)</label>
              <input type="range" min="10" max="100" value={block.titleStyle?.fontSize || 32} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "titleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Weight</label>
              <select value={block.titleStyle?.fontWeight || "700"} onChange={(e) => updateStyle("fontWeight", e.target.value, "titleStyle")} className="text-xs border rounded p-1 bg-white h-8">
                <option value="normal">Normal</option>
                <option value="700">Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
              <input type="color" value={block.titleStyle?.textColor || "#ffffff"} onChange={(e) => updateStyle("textColor", e.target.value, "titleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
          </Section>

          <Section id="subtitleStyles" title="Footer Subtitle" icon={<FaAlignLeft />}>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Font Family</label>
              <select
                value={block?.subtitleStyle?.fontFamily || "inherit"}
                onChange={(e) => updateStyle("fontFamily", e.target.value, "subtitleStyle")}
                className="text-xs border rounded p-1 bg-white h-8"
              >
                <option value="inherit">Default</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Outfit', sans-serif">Outfit</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({block?.subtitleStyle?.fontSize || 16}px)</label>
              <input type="range" min="10" max="40" value={block?.subtitleStyle?.fontSize || 16} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "subtitleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
              <input type="color" value={block?.subtitleStyle?.textColor || "#ffffff"} onChange={(e) => updateStyle("textColor", e.target.value, "subtitleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
          </Section>
        </>
      )
      }

      {block?.type === "sectionGrid" && (
        <>
          <Section id="gridStyle" title="Grid Style" icon={<FaLayerGroup />}>
            {/* Background */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Background</label>
              <input type="color" value={block.style?.backgroundColor || "#ffffff"} onChange={(e) => updateStyle("backgroundColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>

            {/* Padding */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Padding ({block.style?.padding || 0}px)</label>
              <input type="range" min="0" max="100" value={block.style?.padding || 0} onChange={(e) => updateStyle("padding", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Gap */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Gap ({block.style?.gap || 16}px)</label>
              <input type="range" min="0" max="100" value={block.style?.gap !== undefined ? block.style.gap : 16} onChange={(e) => updateStyle("gap", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Min Height */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Min Height</label>
              <input type="number" value={parseInt(block.style?.minHeight) || 0} onChange={(e) => updateStyle("minHeight", e.target.value)} className="text-xs border rounded p-1 w-full h-8" placeholder="px" />
            </div>

            {/* Border Radius */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Corner Radius</label>
              <input type="range" min="0" max="50" value={block.style?.borderRadius || 0} onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>

            {/* Border */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Border</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={block.style?.borderColor || "#e5e7eb"} onChange={(e) => updateStyle("borderColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
                <input type="number" placeholder="Width" value={block.style?.borderWidth || 0} onChange={(e) => updateStyle("borderWidth", parseInt(e.target.value))} className="text-xs border rounded p-1 w-20 h-8" />
              </div>
            </div>
          </Section>

          <Section id="columnStyles" title="Column Styles" icon={<FaLayerGroup />}>
            <div className="col-span-2 flex gap-1 mb-2 overflow-x-auto pb-2">
              {(block.columns || []).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveColIndex(i)}
                  className={`px-3 py-1 text-[10px] font-bold rounded border ${activeColIndex === i ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                >
                  Col {i + 1}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Background</label>
              <input
                type="color"
                value={block.style?.columnStyles?.[activeColIndex]?.backgroundColor || "#ffffff"}
                onChange={(e) => {
                  const newColStyles = [...(block.style?.columnStyles || [])];
                  if (!newColStyles[activeColIndex]) newColStyles[activeColIndex] = {};
                  newColStyles[activeColIndex] = { ...newColStyles[activeColIndex], backgroundColor: e.target.value };
                  updateStyle("columnStyles", newColStyles);
                }}
                className="w-8 h-8 rounded border-none p-0 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Padding</label>
              <input
                type="range"
                min="0"
                max="50"
                value={block.style?.columnStyles?.[activeColIndex]?.padding || 0}
                onChange={(e) => {
                  const newColStyles = [...(block.style?.columnStyles || [])];
                  if (!newColStyles[activeColIndex]) newColStyles[activeColIndex] = {};
                  newColStyles[activeColIndex] = { ...newColStyles[activeColIndex], padding: parseInt(e.target.value) };
                  updateStyle("columnStyles", newColStyles);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Radius</label>
              <input
                type="range"
                min="0"
                max="50"
                value={block.style?.columnStyles?.[activeColIndex]?.borderRadius || 0}
                onChange={(e) => {
                  const newColStyles = [...(block.style?.columnStyles || [])];
                  if (!newColStyles[activeColIndex]) newColStyles[activeColIndex] = {};
                  newColStyles[activeColIndex] = { ...newColStyles[activeColIndex], borderRadius: parseInt(e.target.value) };
                  updateStyle("columnStyles", newColStyles);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Border</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={block.style?.columnStyles?.[activeColIndex]?.borderColor || "#e5e7eb"}
                  onChange={(e) => {
                    const newColStyles = [...(block.style?.columnStyles || [])];
                    if (!newColStyles[activeColIndex]) newColStyles[activeColIndex] = {};
                    newColStyles[activeColIndex] = { ...newColStyles[activeColIndex], borderColor: e.target.value };
                    updateStyle("columnStyles", newColStyles);
                  }}
                  className="w-8 h-8 rounded border-none p-0 cursor-pointer"
                />
                <input
                  type="number"
                  placeholder="Width"
                  value={block.style?.columnStyles?.[activeColIndex]?.borderWidth || 0}
                  onChange={(e) => {
                    const newColStyles = [...(block.style?.columnStyles || [])];
                    if (!newColStyles[activeColIndex]) newColStyles[activeColIndex] = {};
                    newColStyles[activeColIndex] = { ...newColStyles[activeColIndex], borderWidth: parseInt(e.target.value) };
                    updateStyle("columnStyles", newColStyles);
                  }}
                  className="text-xs border rounded p-1 w-20 h-8"
                />
              </div>
            </div>
          </Section>
        </>
      )}

      {(block?.type === "cardRow" || (block?.type === "sectionGrid" && block?.style?.display === "grid")) && (
        <>
          <Section id="cardLayout" title="Grid Layout" icon={<FaLayerGroup />}>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Columns</label>
              <select
                value={block?.style?.columns || "auto"}
                onChange={(e) => updateStyle("columns", e.target.value)}
                className="text-xs border rounded p-1 bg-white h-8"
              >
                <option value="auto">Auto (Responsive)</option>
                <option value="1">1 Column</option>
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
                <option value="4">4 Columns</option>
                <option value="5">5 Columns</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Gap (px)</label>
              <input type="number" value={block?.style?.gap !== undefined ? block?.style?.gap : 16} onChange={(e) => updateStyle("gap", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" />
            </div>
          </Section>

          <Section id="cardStyle" title="Card Style" icon={<FaBorderAll />}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Card BG</label>
              <input type="color" value={block.cardStyle?.backgroundColor || "#ffffff"} onChange={(e) => updateStyle("backgroundColor", e.target.value, "cardStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Card Padding ({block.cardStyle?.padding || 16}px)</label>
              <input type="range" min="0" max="50" value={block.cardStyle?.padding || 16} onChange={(e) => updateStyle("padding", parseInt(e.target.value), "cardStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Radius ({block.cardStyle?.borderRadius || 12}px)</label>
              <input type="range" min="0" max="50" value={block.cardStyle?.borderRadius || 12} onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value), "cardStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Border Color</label>
              <input type="color" value={block.cardStyle?.borderColor || "#eeeeee"} onChange={(e) => updateStyle("borderColor", e.target.value, "cardStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Content Alignment</label>
              <div className="flex bg-white rounded border border-gray-200 p-1 gap-1 justify-center h-8 items-center">
                {[{ val: "left", icon: <FaAlignLeft /> }, { val: "center", icon: <FaAlignCenter /> }, { val: "right", icon: <FaAlignRight /> }].map(opt => (
                  <button key={opt.val} onClick={() => updateStyle("textAlign", opt.val, "cardStyle")} className={`p-1 rounded ${block.cardStyle?.textAlign === opt.val ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section id="cardContent" title="Card Content" icon={<FaHeading />}>
            {/* Image Height */}
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Image Height ({block.cardImageStyle?.height || 128}px)</label>
              <input type="range" min="50" max="400" value={block.cardImageStyle?.height || 128} onChange={(e) => updateStyle("height", parseInt(e.target.value), "cardImageStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Title Size</label>
              <input type="number" value={block.cardTitleStyle?.fontSize || 16} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "cardTitleStyle")} className="text-xs border rounded p-1 w-full h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Title Color</label>
              <input type="color" value={block.cardTitleStyle?.textColor || "#000000"} onChange={(e) => updateStyle("textColor", e.target.value, "cardTitleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Desc Size</label>
              <input type="number" value={block.cardDescStyle?.fontSize || 14} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "cardDescStyle")} className="text-xs border rounded p-1 w-full h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Desc Color</label>
              <input type="color" value={block.cardDescStyle?.textColor || "#666666"} onChange={(e) => updateStyle("textColor", e.target.value, "cardDescStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
          </Section>
        </>
      )}

      {/* Spacing & Layout */}
      <Section id="spacing" title="Spacing & Layout" icon={<FaLayerGroup />}>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Padding ({block?.style?.padding || 0}px)</label>
          <input type="range" min="0" max="100" value={block?.style?.padding || 0} onChange={(e) => updateStyle("padding", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Margin Top</label>
          <input type="number" value={block?.style?.marginTop} onChange={(e) => updateStyle("marginTop", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" placeholder="px" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Margin Btm</label>
          <input type="number" value={block?.style?.marginBottom} onChange={(e) => updateStyle("marginBottom", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" placeholder="px" />
        </div>
        {block?.type !== "cardRow" && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Display</label>
            <select value={block?.style?.display || "block"} onChange={(e) => updateStyle("display", e.target.value)} className="text-xs border rounded p-1 bg-white w-full h-8">
              <option value="block">Block</option>
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
            </select>
          </div>
        )}
        {(block?.style?.display === "flex" || block?.style?.display === "grid") && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Direction</label>
              <select value={block?.style?.flexDirection || "row"} onChange={(e) => updateStyle("flexDirection", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
                <option value="row">Row</option>
                <option value="column">Column</option>
                <option value="row-reverse">Row Reverse</option>
                <option value="column-reverse">Column Reverse</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Gap</label>
              <input type="number" value={block?.style?.gap} onChange={(e) => updateStyle("gap", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Align Items</label>
              <select value={block?.style?.alignItems || "stretch"} onChange={(e) => updateStyle("alignItems", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
                <option value="stretch">Stretch</option>
                <option value="center">Center</option>
                <option value="flex-start">Start</option>
                <option value="flex-end">End</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Justify Content</label>
              <select value={block?.style?.justifyContent || "start"} onChange={(e) => updateStyle("justifyContent", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
              </select>
            </div>
          </>
        )}
      </Section>

      {/* Background & Borders */}
      <Section id="appearance" title="Appearance" icon={<FaPalette />}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">BG Color</label>
          <div className="flex items-center gap-2 h-8">
            <input type="color" value={block?.style?.backgroundColor || "#ffffff"} onChange={(e) => updateStyle("backgroundColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Background Image</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Image URL"
              value={block?.style?.backgroundImage?.replace(/url\(["']?|["']?\)/g, '') || ""}
              onChange={(e) => updateStyle("backgroundImage", e.target.value ? `url("${e.target.value}")` : "")}
              className="text-xs border rounded p-1 flex-1 h-8"
            />
            <input
              id={`bg-img-upload-${block.id}`}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateStyle("backgroundImage", `url("${URL.createObjectURL(file)}")`);
              }}
            />
            <label htmlFor={`bg-img-upload-${block.id}`} className="bg-blue-50 text-blue-600 p-2 rounded cursor-pointer hover:bg-blue-100 transition h-8 flex items-center justify-center">
              <FaImage />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">BG Size</label>
          <select value={block?.style?.backgroundSize || "cover"} onChange={(e) => updateStyle("backgroundSize", e.target.value)} className="text-xs border rounded p-1 bg-white h-8">
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="auto">Auto</option>
            <option value="100% 100%">Stretch</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">BG Position</label>
          <select value={block?.style?.backgroundPosition || "center"} onChange={(e) => updateStyle("backgroundPosition", e.target.value)} className="text-xs border rounded p-1 bg-white h-8">
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Border Color</label>
          <div className="flex items-center gap-2 h-8">
            <input type="color" value={block?.style?.borderColor || "#000000"} onChange={(e) => updateStyle("borderColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Radius ({block?.style?.borderRadius || 0})</label>
          <input type="range" min="0" max="50" value={block?.style?.borderRadius || 0} onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Border Width</label>
          <input type="range" min="0" max="20" value={block?.style?.borderWidth || 0} onChange={(e) => updateStyle("borderWidth", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Box Shadow</label>
          <input type="text" placeholder="e.g. 0 4px 6px rgba(0,0,0,0.1)" value={block?.style?.boxShadow || ""} onChange={(e) => updateStyle("boxShadow", e.target.value)} className="text-xs border rounded p-1 w-full h-8" />
        </div>
      </Section>

      {/* Advanced / Custom CSS */}
      <Section id="advanced" title="Advanced" icon={<FaArrowsAltV />}>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Width / Max-Width</label>
          <div className="flex gap-2">
            <input placeholder="Width (100%)" value={block?.style?.width} onChange={(e) => updateStyle("width", e.target.value)} className="text-xs border rounded p-1 w-1/2 h-8" />
            <input placeholder="Max Width" value={block?.style?.maxWidth} onChange={(e) => updateStyle("maxWidth", e.target.value)} className="text-xs border rounded p-1 w-1/2 h-8" />
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Height</label>
          <input placeholder="Height (auto)" value={block?.style?.height} onChange={(e) => updateStyle("height", e.target.value)} className="text-xs border rounded p-1 w-full h-8" />
        </div>
        {(block?.type === "image" || block?.type === "heroSection" || block?.type === "customSection") && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Image Fit (Object Fit)</label>
            <select value={block?.style?.objectFit || "cover"} onChange={(e) => updateStyle("objectFit", e.target.value)} className="text-xs border rounded p-1 bg-white w-full h-8">
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
              <option value="scale-down">Scale Down</option>
            </select>
          </div>
        )}
      </Section>

      {
        block?.type === "footerBlock" && (
          <>
            <Section id="footerSettings" title="Footer Settings" icon={<FaCog />}>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Logo URL</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={block.logoUrl || ""}
                    onChange={(e) => updateStyle("logoUrl", e.target.value, true)}
                    className="text-xs border rounded p-1 flex-1 h-8"
                    placeholder="https://..."
                  />
                  <input
                    id={`footer-logo-upload-${block.id}`}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateStyle("logoUrl", URL.createObjectURL(file), true);
                    }}
                  />
                  <label htmlFor={`footer-logo-upload-${block.id}`} className="bg-blue-50 text-blue-600 p-2 rounded cursor-pointer hover:bg-blue-100 transition h-8 flex items-center justify-center">
                    <FaImage />
                  </label>
                  <select
                    className="text-[10px] border rounded p-1 w-12 h-8"
                    onChange={(e) => updateStyle("logoUrl", e.target.value, true)}
                    value=""
                  >
                    <option value="" disabled>Var</option>
                    {VARIABLE_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Logo Width ({block?.style?.logoWidth || 120}px)</label>
                <input type="range" min="50" max="400" value={block?.style?.logoWidth || 120} onChange={(e) => updateStyle("logoWidth", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Shop Text</label>
                <input type="text" value={block?.shopText || "Shop Online"} onChange={(e) => updateStyle("shopText", e.target.value, true)} className="text-xs border rounded p-1 w-full h-8" />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Shop URL</label>
                <input type="text" value={block?.shopLink || ""} onChange={(e) => updateStyle("shopLink", e.target.value, true)} className="text-xs border rounded p-1 w-full h-8" placeholder="https://..." />
              </div>
            </Section>
            <Section id="bottomBarStyles" title="Footer Bottom Style" icon={<FaBorderAll />}>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Background</label>
                <input type="color" value={block.bottomBarStyle?.backgroundColor || "#041b5c"} onChange={(e) => updateStyle("backgroundColor", e.target.value, "bottomBarStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Text Size ({block.bottomBarStyle?.fontSize || 12}px)</label>
                <input type="range" min="8" max="24" value={block.bottomBarStyle?.fontSize || 12} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "bottomBarStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Border Top</label>
                <div className="flex gap-2 items-center text-xs">
                  <input type="color" value={block.bottomBarStyle?.borderColor || "rgba(255,255,255,0.1)"} onChange={(e) => updateStyle("borderColor", e.target.value, "bottomBarStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
                  <input type="text" placeholder="1px solid rgba(255,255,255,0.1)" value={block.bottomBarStyle?.borderTop || "1px solid"} onChange={(e) => updateStyle("borderTop", e.target.value, "bottomBarStyle")} className="border rounded p-1 flex-1 h-8" />
                </div>
              </div>
            </Section>
          </>
        )
      }
      {/* Link Section */}
      <Section id="link" title="Link / Action" icon={<FaMousePointer />}>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Block Link (URL)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://example.com"
              value={block?.style?.link || ""}
              onChange={(e) => updateStyle("link", e.target.value)}
              className="text-xs border rounded p-1 flex-1 h-8"
            />
            <select
              value={block?.style?.linkTarget || "_self"}
              onChange={(e) => updateStyle("linkTarget", e.target.value)}
              className="text-xs border rounded p-1 w-24 h-8"
            >
              <option value="_self">Same Tab</option>
              <option value="_blank">New Tab</option>
            </select>
          </div>
          <p className="text-[9px] text-gray-400 mt-1 italic italic">Apply a click action to the entire block.</p>
        </div>
      </Section>
    </div >
  );
};

const FooterBlockRenderer = ({ block, update, readOnly, isSelected, onSelect }) => {
  const style = block.style || {};

  const containerStyle = {
    ...getCommonStyles(block),
    backgroundColor: style.backgroundColor || "#062375",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    fontFamily: style.fontFamily || "'Outfit', sans-serif"
  };

  // Ensure padding is applied via getCommonStyles if possible, but handle legacy
  if (style.padding === undefined) {
    containerStyle.padding = "0";
  }

  const bottomBarStyle = {
    background: block.bottomBarStyle?.backgroundColor || "#041b5c",
    padding: "10px",
    textAlign: "center",
    fontSize: block.bottomBarStyle?.fontSize ? `${block.bottomBarStyle.fontSize}px` : "12px",
    lineHeight: "1.6",
    color: "rgba(255,255,255,0.7)",
    borderTop: block.bottomBarStyle?.borderTop || `1px solid ${block.bottomBarStyle?.borderColor || "rgba(255,255,255,0.1)"}`,
    position: 'relative',
    zIndex: 20
  };

  return (
    <div
      style={containerStyle}
      className={`relative group ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect();
      }}
    >

      <div
        className="relative z-10 flex items-center justify-between gap-4 flex-nowrap"
      >
        {/* 1. Logo */}
        <div className="flex-shrink-0">
          <img
            src={block.logoUrl || "/DashboardIcons/sss-logo.png"}
            style={{ width: `${style.logoWidth || 120}px` }}
            alt="Logo"
          />
        </div>

        {/* 2. Text Info */}
        <div className="flex-grow w-[200px]">
          {readOnly ? (
            <h2 style={{
              fontSize: block.titleStyle?.fontSize ? `${block.titleStyle.fontSize}px` : "32px",
              marginBottom: "4px",
              fontWeight: block.titleStyle?.fontWeight || "700",
              fontFamily: block.titleStyle?.fontFamily || "Georgia, serif",
              color: block.titleStyle?.textColor || "#fff",
              textAlign: block.titleStyle?.textAlign || "left"
            }}>
              {block.title || "Let’s be friends"}
            </h2>
          ) : (
            <input
              className="bg-transparent border-none outline-none text-2xl font-bold w-full mb-0 placeholder:text-white/50 text-white"
              style={{
                fontFamily: block.titleStyle?.fontFamily || "Georgia, serif",
                fontSize: block.titleStyle?.fontSize ? `${block.titleStyle.fontSize}px` : "32px",
                fontWeight: block.titleStyle?.fontWeight || "700",
                color: block.titleStyle?.textColor || "#fff",
                textAlign: block.titleStyle?.textAlign || "left"
              }}
              value={block.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Footer Title"
            />
          )}

          {readOnly ? (
            <p style={{
              opacity: block.subtitleStyle?.opacity || 0.9,
              fontSize: block.subtitleStyle?.fontSize ? `${block?.subtitleStyle.fontSize}px` : "14px",
              fontWeight: block.subtitleStyle?.fontWeight || "500",
              lineBreak: "anywhere",
              color: block.subtitleStyle?.textColor || "#fff",
              fontFamily: block.subtitleStyle?.fontFamily || "inherit",
              textAlign: block.subtitleStyle?.textAlign || "left"
            }}>
              {block?.subtitle || "If we are not playing football you can find us socialising on..."}
            </p>
          ) : (
            <textarea
              className="bg-transparent border-none outline-none text-sm w-full opacity-80 resize-none placeholder:text-white/50 text-white"
              style={{
                fontSize: block.subtitleStyle?.fontSize ? `${block?.subtitleStyle.fontSize}px` : "14px",
                color: block.subtitleStyle?.textColor || "#fff",
                fontFamily: block.subtitleStyle?.fontFamily || "inherit",
                textAlign: block.subtitleStyle?.textAlign || "left",
                fontWeight: block.subtitleStyle?.fontWeight || "500",
              }}
              value={block?.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
              placeholder="Footer Subtitle"
            />
          )}
        </div>

        {/* 3. Social Icons */}
        <div className="flex items-center gap-3">
          {(block.links || [
            { platform: 'facebook', url: '#' },
            { platform: 'instagram', url: '#' },
            { platform: 'youtube', url: '#' },
            { platform: 'twitter', url: '#' }
          ]).map((social, i) => {
            const platform = social.platform || 'facebook';
            const Icon = platform === 'facebook' ? FaFacebookF :
              platform === 'instagram' ? FaInstagram :
                platform === 'youtube' ? FaYoutube :
                  platform === 'linkedin' ? FaLinkedinIn :
                    platform === 'twitter' ? FaTwitter : FaShareAlt;

            return (
              <div key={i} className="relative group/social">
                <a
                  href={social.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-[#062375] w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                  style={{ fontSize: "18px" }}
                >
                  {Icon && <Icon size={12} />}
                </a>
                {!readOnly && (
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 hidden group-hover/social:flex flex-col gap-1 bg-white p-2 border rounded shadow-2xl z-50 w-32 scale-75 origin-bottom">
                    <select
                      className="text-[10px] border p-1 rounded text-gray-700"
                      value={social.platform}
                      onChange={(e) => {
                        const newLinks = [...(block.links || [])];
                        newLinks[i] = { ...newLinks[i], platform: e.target.value };
                        update("links", newLinks);
                      }}
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="twitter">Twitter</option>
                    </select>
                    <input
                      className="text-[10px] border p-1 rounded text-gray-700 font-normal outline-none"
                      placeholder="URL"
                      value={social.url}
                      onChange={(e) => {
                        const newLinks = [...(block.links || [])];
                        newLinks[i] = { ...newLinks[i], url: e.target.value };
                        update("links", newLinks);
                      }}
                    />
                    <button
                      onClick={() => {
                        const newLinks = (block.links || []).filter((_, idx) => idx !== i);
                        update("links", newLinks);
                      }}
                      className="text-[10px] bg-red-500 text-white p-1 rounded mt-1"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!readOnly && (
            <button
              onClick={() => {
                const newLinks = [...(block.links || []), { platform: 'facebook', url: '#' }];
                update("links", newLinks);
              }}
              className="w-8 h-8 rounded-full border border-dashed border-white/40 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <FaPlus size={12} />
            </button>
          )}
        </div>

        {/* 4. Shop Button */}
        <div className="flex-shrink-0">
          <a
            href={block?.shopLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-[#062375] px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl hover:bg-gray-100 transition whitespace-nowrap"
          >
            <FaShoppingCart size={16} /> {block?.shopText || "Shop Online"}
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={bottomBarStyle}>
        {readOnly ? (
          block.copyright || "© Samba Soccer Schools Global Ltd, 2022. All rights reserved. Samba Soccer® is a registered trademark of Samba Soccer Schools Global Ltd. Registration Number: 8623348 | Head Office: 65-69 Shelton Street, Covent Garden, London WC2H 9HE"
        ) : (
          <textarea
            className="bg-transparent outline-none text-[10px] w-full text-center placeholder:text-white/50 min-h-[40px] resize-none"
            value={block.copyright}
            onChange={(e) => update("copyright", e.target.value)}
            placeholder="Copyright & Company Info"
          />
        )}
      </div>
    </div>
  );
};


const InfoBoxRenderer = ({ block, update, readOnly }) => {
  const [showSettings, setShowSettings] = useState(false);
  const style = block.style || {};

  const updateStyle = (key, value) => {
    update("style", { ...style, [key]: value });
  };

  const containerStyle = {
    ...getCommonStyles(block),
    backgroundColor: style.backgroundColor || "#f3f4f6",
  };

  // Add defaults if not set
  if (!style.borderRadius) containerStyle.borderRadius = "16px";
  if (!style.padding) containerStyle.padding = "20px";
  if (!style.gap) containerStyle.gap = "16px";
  if (!style.display) containerStyle.display = "flex";
  if (!style.border && !style.borderWidth) containerStyle.border = "1px solid #e5e7eb";

  return (
    <div style={containerStyle} className="relative group/infobox">


      {/* InfoBox Toolbar */}
      {!readOnly && (
        <div className="absolute -top-3 right-0 flex gap-2 opacity-0 group-hover/infobox:opacity-100 transition z-50">
          {/* Settings Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            className="bg-gray-800 text-white p-1.5 rounded-full shadow hover:bg-black w-6 h-6 flex items-center justify-center transform hover:scale-110 active:scale-90 transition-transform"
            title="InfoBox Settings"
          >
            {showSettings ? <FaTimes size={10} /> : <FaCog size={10} />}
          </button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && !readOnly && (
        <div
          className="absolute right-0 top-6 bg-white border border-gray-200 shadow-xl rounded-lg p-3 w-64 z-50 animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-bold uppercase text-gray-400 mb-2 pb-1 border-b">InfoBox Settings</div>

          <div className="space-y-3">
            {/* Layout */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Layout</label>
              <div className="flex bg-gray-100 p-1 rounded mb-2">
                <button
                  onClick={() => updateStyle("flexDirection", "row")}
                  className={`flex-1 text-[10px] py-1 rounded ${style.flexDirection === "row" ? "bg-white shadow text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Columns (Row)
                </button>
                <button
                  onClick={() => updateStyle("flexDirection", "column")}
                  className={`flex-1 text-[10px] py-1 rounded ${style.flexDirection === "column" || !style.flexDirection ? "bg-white shadow text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                >
                  List (Column)
                </button>
              </div>

              {/* Columns Count (Only for Row) */}
              {style.flexDirection === "row" && (
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Cols:</label>
                  <select
                    value={style.columns || "auto"}
                    onChange={(e) => updateStyle("columns", e.target.value === "auto" ? "auto" : parseInt(e.target.value))}
                    className="text-xs border rounded p-1 bg-white flex-1"
                  >
                    <option value="auto">Auto (Fit)</option>
                    <option value="1">1 Column</option>
                    <option value="2">2 Columns</option>
                    <option value="3">3 Columns</option>
                    <option value="4">4 Columns</option>
                    <option value="5">5 Columns</option>
                  </select>
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="flex gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Background</label>
                <div className="flex items-center gap-2 border rounded p-1 bg-white h-7">
                  <input
                    type="color"
                    value={style.backgroundColor || "#f3f4f6"}
                    onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                    className="w-4 h-4 rounded-full border-none p-0 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Top Accent</label>
                <div className="flex items-center gap-2 border rounded p-1 bg-white h-7">
                  <input
                    type="color"
                    value={style.topBorderColor || "#000000"}
                    onChange={(e) => updateStyle("topBorderColor", e.target.value)}
                    className="w-4 h-4 rounded-full border-none p-0 cursor-pointer"
                  />
                  <button
                    onClick={() => updateStyle("topBorderColor", "")}
                    className="text-[10px] text-red-500 hover:bg-red-50 px-1 rounded ml-auto"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Gap (px)</label>
                <input
                  type="number"
                  value={style.gap !== undefined ? style.gap : 16}
                  onChange={(e) => updateStyle("gap", parseInt(e.target.value))}
                  className="w-full text-xs border rounded p-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Padding (px)</label>
                <input
                  type="number"
                  value={style.padding !== undefined ? style.padding : 20}
                  onChange={(e) => updateStyle("padding", parseInt(e.target.value))}
                  className="w-full text-xs border rounded p-1"
                />
              </div>
            </div>

            {/* Labels Font Size */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Label Size ({style.labelFontSize || 14}px)</label>
              <input
                type="range" min="10" max="32"
                value={style.labelFontSize || 14}
                onChange={(e) => updateStyle("labelFontSize", parseInt(e.target.value))}
                className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={() => {
                update("duplicateBlock", block); // Parent handles this specific key to duplicate
                setShowSettings(false);
              }}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded transition uppercase"
            >
              <FaCopy /> Duplicate InfoBox
            </button>
          </div>
        </div>
      )}
      {(block.items || []).map((item, i) => {
        const columns = style.columns || "auto";
        const gap = style.gap !== undefined ? style.gap : 16;
        // Calculate flex basis for fixed columns
        // Formula: (100% - (gap * (n-1))) / n
        const flexBasis = columns !== "auto"
          ? `calc(100% / ${columns} - ${(gap * (columns - 1)) / columns}px)`
          : undefined;

        return (
          <div
            key={i}
            className={!readOnly ? "group relative" : ""}
            style={{
              display: "flex", // Ensure it's a flex container for inner content if needed
              flexDirection: "column",
              flex: style.flexDirection === "row"
                ? (columns === "auto" ? "1 1 0px" : `0 0 ${flexBasis}`)
                : "1 1 auto",
              minWidth: style.flexDirection === "row"
                ? (columns === "auto" ? "100px" : "auto")
                : "100%",
              maxWidth: style.flexDirection === "row" && columns !== "auto" ? flexBasis : "100%",
              // Keep styling consistent for readonly
              ...(!readOnly ? {} : {
                // When readonly, we still want to respect the column layout if set
                flex: style.flexDirection === "row"
                  ? (columns === "auto" ? "1 1 100px" : `0 0 ${flexBasis}`)
                  : "1 1 auto",
                minWidth: style.flexDirection === "row"
                  ? (columns === "auto" ? "80px" : "auto")
                  : "100%",
                maxWidth: style.flexDirection === "row" && columns !== "auto" ? flexBasis : "100%",
              })
            }}
          >
            {/* Duplicate Item */}
            {!readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newItems = [...(block.items || [])];
                  newItems.splice(i + 1, 0, { ...item });
                  update("items", newItems);
                }}
                className="absolute -top-2 right-5 text-blue-500 text-xs opacity-0 group-hover:opacity-100 z-10 hover:scale-110"
                title="Duplicate Item"
              >
                <FaCopy />
              </button>
            )}

            {/* Remove Item */}
            {!readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newItems = block.items.filter(
                    (_, idx) => idx !== i
                  );
                  update("items", newItems);
                }}
                className="absolute -top-2 right-0 text-red-500 text-xs opacity-0 group-hover:opacity-100 z-10"
              >
                ✕
              </button>
            )}

            {readOnly ? (
              item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  {/* Label */}
                  <div
                    style={{
                      fontWeight: style.labelFontWeight || 600,
                      fontSize: style.labelFontSize
                        ? `${style.labelFontSize}px`
                        : "14px",
                      color: style.labelColor || "#374151",
                      marginBottom: "6px",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "break-word",
                    }}
                  >
                    {item.label}
                  </div>

                  {/* Value */}
                  <div
                    style={{
                      fontSize: style.valueFontSize
                        ? `${style.valueFontSize}px`
                        : "14px",
                      color: style.valueColor || "#111827",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      width: "100%",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: item.value || "",
                    }}
                  />
                </a>
              ) : (
                <>
                  {/* Label */}
                  <div
                    style={{
                      fontWeight: style.labelFontWeight || 600,
                      fontSize: style.labelFontSize
                        ? `${style.labelFontSize}px`
                        : "14px",
                      color: style.labelColor || "#374151",
                      marginBottom: "6px",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "break-word",
                    }}
                  >
                    {item.label}
                  </div>

                  {/* Value */}
                  <div
                    style={{
                      fontSize: style.valueFontSize
                        ? `${style.valueFontSize}px`
                        : "14px",
                      color: style.valueColor || "#111827",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      width: "100%",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: item.value || "",
                    }}
                  />
                </>
              )
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                <VariableTextarea
                  value={item.label || ""}
                  onChange={(e) => {
                    const newItems = [...block.items];
                    newItems[i] = { ...newItems[i], label: e.target.value };
                    update("items", newItems);
                  }}
                  className="w-full text-xs font-bold bg-transparent outline-none resize-none overflow-hidden placeholder-gray-400 border-b border-gray-200 pb-1"
                  placeholder="Label"
                />

                <VariableTextarea
                  value={item.value || ""}
                  onChange={(e) => {
                    const newItems = [...block.items];
                    newItems[i] = { ...newItems[i], value: e.target.value };
                    update("items", newItems);
                  }}
                  className="w-full text-xs bg-transparent outline-none resize-none overflow-hidden placeholder-gray-400"
                  placeholder="Value"
                />

                <input
                  value={item.link || ""}
                  onChange={(e) => {
                    const newItems = [...block.items];
                    newItems[i] = { ...newItems[i], link: e.target.value };
                    update("items", newItems);
                  }}
                  className="w-full text-[10px] bg-transparent outline-none placeholder-gray-300 text-blue-400 italic"
                  placeholder="Item Link (Optional)"
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add Item Button */}
      {!readOnly && (
        <button
          onClick={() =>
            update("items", [
              ...(block.items || []),
              { label: "Label", value: "Value" },
            ])
          }
          className="text-xl font-bold text-gray-400 hover:text-blue-500"
        >
          +
        </button>
      )}
    </div>
  );
};



export default function BlockRenderer({ block, blocks, setBlocks, readOnly = false, isSelected = false, onSelect }) {
  const update = (key, value) => {
    if (key === "duplicateBlock") {
      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === block.id);
        if (index === -1) return prev;

        // ✅ Deep clone to break all shared references
        const cloned = JSON.parse(JSON.stringify(prev[index]));

        // ✅ Recursively regenerate IDs for the block and all its children
        const regenerateIds = (blk) => {
          blk.id = crypto.randomUUID();
          if (blk.type === "sectionGrid" && Array.isArray(blk.columns)) {
            blk.columns = blk.columns.map(col => col.map(child => {
              const clonedChild = { ...child };
              regenerateIds(clonedChild);
              return clonedChild;
            }));
          }
          if (blk.type === "cardRow" && Array.isArray(blk.cards)) {
            blk.cards = blk.cards.map(card => ({ ...card, id: crypto.randomUUID() }));
          }
          if (blk.type === "noteSection" && Array.isArray(blk.rows)) {
            blk.rows = blk.rows.map(row => ({
              ...row,
              id: crypto.randomUUID(),
              boxes: row.boxes?.map(box => ({ ...box, id: crypto.randomUUID() }))
            }));
          }
        };

        regenerateIds(cloned);

        return [
          ...prev.slice(0, index + 1),
          cloned,
          ...prev.slice(index + 1),
        ];
      });
      return;
    }

    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...b, [key]: value } : b))
    );
  };

  const handleConvertToBlocks = () => {
    if (!block.content) return;
    const items = convertHtmlToBlocks(block.content);
    if (items.length === 0) return;

    if (window.confirm(`This will convert your HTML into ${items.length} separate blocks. This action cannot be undone. Continue?`)) {
      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === block.id);
        if (index === -1) return prev;
        return [
          ...prev.slice(0, index),
          ...items,
          ...prev.slice(index + 1),
        ];
      });
    }
  };


  const addChild = (columnIndex, type) => {
    const newChild = {
      id: crypto.randomUUID(),
      type,
      content: type === "btn" ? "Click More" : (type === "noteSection" ? "" : "Enter Text"),
      items: type === "infoBox" ? [{ label: "Label", value: "Value" }] : [],
      rows: type === "noteSection" ? [{
        id: crypto.randomUUID(),
        boxes: [
          {
            id: crypto.randomUUID(),
            type: "infoBox",
            items: [{ label: "Label", value: "Value" }],
            style: {
              topBorderColor: "#10b981",
              flexDirection: "row",
              columns: "auto",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }
          }
        ]
      }] : undefined,
      heading: type === "noteSection" ? "Make a Note!" : undefined,
      headingStyle: type === "noteSection" ? { fontFamily: "'Handlee', cursive", fontSize: 32, textColor: "#0ea5e9" } : undefined,
      url: "",
      style: {
        fontSize: type === "heading" ? 24 : 16,
        fontWeight: type === "heading" ? "bold" : "normal",
        textColor: "#000000",
        textAlign: "center",
        display: (type === "infoBox" || type === "noteSection") ? "flex" : "block",
        flexDirection: type === "infoBox" ? "row" : undefined,
        gap: type === "infoBox" ? 16 : undefined,
        flexWrap: type === "infoBox" ? "wrap" : undefined,
      }
    };
    const newColumns = [...(block.columns || [])];
    newColumns[columnIndex] = [...(newColumns[columnIndex] || []), newChild];
    update("columns", newColumns);
  };
  const updateChild = (columnIndex, childId, key, value) => {

    if (key === "duplicateBlock") {

      const newColumns = block.columns.map((col, i) => {
        if (i !== columnIndex) return col;

        const index = col.findIndex(c => c.id === childId);
        if (index === -1) return col;

        const duplicatedBlock = {
          ...col[index],
          id: crypto.randomUUID(),
          items: col[index].items
            ? col[index].items.map(item => ({ ...item }))
            : undefined,
          style: col[index].style
            ? { ...col[index].style }
            : undefined,
        };

        return [
          ...col.slice(0, index + 1),
          duplicatedBlock,
          ...col.slice(index + 1),
        ];
      });

      update("columns", newColumns);
      return;
    }

    // Normal update
    const newColumns = block.columns.map((col, i) => {
      if (i !== columnIndex) return col;

      return col.map(c =>
        c.id === childId ? { ...c, [key]: value } : c
      );
    });

    update("columns", newColumns);
  };



  const removeChild = (columnIndex, childId) => {
    const newColumns = (block.columns || []).map((col, i) => {
      if (i === columnIndex) {
        return col.filter((c) => c.id !== childId);
      }
      return col;
    });
    update("columns", newColumns);
  };

  const duplicateColumn = (columnIndex) => {
    const colToDup = block.columns[columnIndex];
    if (!colToDup) return;

    const clonedColumn = colToDup.map(child => ({
      ...child,
      id: crypto.randomUUID(),
      items: child.items ? child.items.map(it => ({ ...it })) : undefined,
      style: child.style ? { ...child.style } : undefined,
    }));

    const newColumns = [
      ...block.columns.slice(0, columnIndex + 1),
      clonedColumn,
      ...block.columns.slice(columnIndex + 1)
    ];
    update("columns", newColumns);
  };

  const removeColumn = (columnIndex) => {
    const newColumns = block.columns.filter((_, i) => i !== columnIndex);
    update("columns", newColumns);
  };


  const addColumn = () => {
    const newColumns = [...(block.columns || []), []];
    update("columns", newColumns);
  };

  const updateStyle = (key, value) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === block.id
          ? { ...b, style: { ...(b.style || {}), [key]: value } }
          : b
      )
    );
  };

  const addCardToRow = () => {
    const newCard = {
      id: crypto.randomUUID(),
      title: "Card Title",
      description: "Description",
      url: "",
      style: { backgroundColor: "#ffffff", borderRadius: 12, padding: 20 }
    };
    update("cards", [...(block.cards || []), newCard]);
  };

  const updateCardInRow = (cardId, key, value) => {
    const newCards = (block.cards || []).map((c) =>
      c.id === cardId ? { ...c, [key]: value } : c
    );
    update("cards", newCards);
  };

  const removeCardFromRow = (cardId) => {
    const newCards = (block.cards || []).filter((c) => c.id !== cardId);
    update("cards", newCards);
  };

  const duplicateCard = (cardId) => {
    const cardIndex = (block.cards || []).findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const duplicatedCard = {
      ...block.cards[cardIndex],
      id: crypto.randomUUID(),
      style: block.cards[cardIndex].style ? { ...block.cards[cardIndex].style } : undefined
    };
    const newCards = [
      ...block.cards.slice(0, cardIndex + 1),
      duplicatedCard,
      ...block.cards.slice(cardIndex + 1)
    ];
    update("cards", newCards);
  };

  const addSectionChild = (type) => {
    const newChild = {
      id: crypto.randomUUID(),
      type,
      content: type === "heading" ? "New Heading" : type === "button" ? "Click Me" : "Enter text here...",
      url: "",
      style: {
        fontSize: type === "heading" ? 32 : 16,
        textColor: "#000000",
        textAlign: "center",
        backgroundColor: type === "button" ? "#237FEA" : "transparent"
      }
    };
    update("children", [...(block.children || []), newChild]);
  };

  const updateSectionChild = (childId, key, value) => {
    const newChildren = (block.children || []).map((c) =>
      c.id === childId ? { ...c, [key]: value } : c
    );
    update("children", newChildren);
  };

  const removeSectionChild = (childId) => {
    const newChildren = (block.children || []).filter((c) => c.id !== childId);
    update("children", newChildren);
  };

  const duplicateSectionChild = (childId) => {
    const childIndex = (block.children || []).findIndex(c => c.id === childId);
    if (childIndex === -1) return;
    const duplicatedChild = {
      ...block.children[childIndex],
      id: crypto.randomUUID(),
      style: block.children[childIndex].style ? { ...block.children[childIndex].style } : undefined
    };
    const newChildren = [
      ...block.children.slice(0, childIndex + 1),
      duplicatedChild,
      ...block.children.slice(childIndex + 1)
    ];
    update("children", newChildren);
  };

  const renderContent = () => {
    if (block?.type === "customHTML") {
      const handleImageClick = (e) => {
        if (e.target.tagName === "IMG") {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";

          input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const newUrl = URL.createObjectURL(file);

            // Replace clicked image src
            e.target.src = newUrl;

            // Save updated HTML
            update(
              "content",
              e.currentTarget.innerHTML
            );
          };

          input.click();
        }
      };

      return (
        <CustomHTMLRenderer
          block={block}
          update={update}
          readOnly={readOnly}
          isSelected={isSelected}
          onSelect={onSelect}
          onConvert={handleConvertToBlocks}
        />
      );
    }






    // CUSTOM SECTION
    if (block?.type === "customSection") {
      return (
        <div style={getCommonStyles(block)} className={!readOnly ? "relative min-h-[300px] flex flex-col justify-center overflow-hidden hover:shadow-lg transition-shadow duration-300" : ""}>
          {/* BG Upload Overlay */}
          {!readOnly && (
            <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition">
              <input
                id={`bg-upload-${block.id}`}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) updateStyle("backgroundImage", URL.createObjectURL(file));
                }}
              />
              <label htmlFor={`bg-upload-${block.id}`} className="bg-white/80 p-2 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-white transition">
                Change Background
              </label>
            </div>
          )}

          {/* Children Management */}
          <div style={readOnly ? { display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 10 } : {}} className={!readOnly ? "flex flex-col gap-6 relative z-10" : ""}>
            {(block.children || []).map((child) => (
              <div key={child.id} style={readOnly ? { padding: '8px', border: '1px solid transparent' } : {}} className={!readOnly ? "relative group/child p-2 border border-transparent hover:border-blue-200 hover:bg-white/40 rounded-lg transition" : ""}>
                {!readOnly && (
                  <div className="absolute -top-3 -right-3 flex gap-1 z-20 opacity-0 group-hover/child:opacity-100 transition">
                    <button
                      className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-blue-600 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSectionChild(child.id);
                      }}
                      title="Duplicate"
                    >
                      <FaCopy size={8} />
                    </button>
                    <button
                      className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSectionChild(child.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {child.type === "heading" && (
                  readOnly ? (
                    <h2 style={{
                      fontSize: child.style?.fontSize,
                      color: child.style?.textColor,
                      textAlign: child.style?.textAlign,
                      fontFamily: block.style?.fontFamily,
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      margin: 0
                    }}>
                      {child.content}
                    </h2>
                  ) : (
                    <input
                      className="w-full bg-transparent outline-none font-bold placeholder-gray-400"
                      value={child.content}
                      onChange={(e) => updateSectionChild(child.id, "content", e.target.value)}
                      style={{
                        fontSize: child.style?.fontSize,
                        color: child.style?.textColor,
                        textAlign: child.style?.textAlign,
                        fontFamily: block.style?.fontFamily
                      }}
                    />
                  )
                )}
                {child.type === "text" && (
                  readOnly ? (
                    <p style={{
                      fontSize: child.style?.fontSize,
                      color: child.style?.textColor,
                      textAlign: child.style?.textAlign,
                      fontFamily: block.style?.fontFamily,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      margin: 0
                    }}>
                      {child.content}
                    </p>
                  ) : (
                    <VariableTextarea
                      className="w-full bg-transparent outline-none resize-none placeholder-gray-400"
                      value={child.content}
                      onChange={(e) => updateSectionChild(child.id, "content", e.target.value)}
                      style={{
                        fontSize: child.style?.fontSize,
                        color: child.style?.textColor,
                        textAlign: child.style?.textAlign,
                        fontFamily: block.style?.fontFamily
                      }}
                    />
                  )
                )}
                {child.type === "logo" && (
                  <div style={{ textAlign: child.style?.textAlign }}>
                    {child.url ? (
                      <img src={child.url} style={readOnly ? { margin: '0 auto', maxHeight: '64px', objectFit: 'contain', display: 'block' } : {}} className={!readOnly ? "mx-auto max-h-16 object-contain" : ""} />
                    ) : (
                      !readOnly && <div className="text-[10px] text-gray-400 border border-dashed border-gray-300 rounded p-2">Logo Placeholder</div>
                    )}
                    {!readOnly && (
                      <>
                        <input
                          id={`logo-upload-${child.id}`}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateSectionChild(child.id, "url", URL.createObjectURL(file));
                          }}
                        />
                        <label htmlFor={`logo-upload-${child.id}`} className="text-[10px] text-blue-500 cursor-pointer hover:underline mt-1 block">Upload Logo</label>
                      </>
                    )}
                  </div>
                )}
                {child.type === "button" && (
                  <div style={{ textAlign: child.style?.textAlign }}>
                    {readOnly ? (
                      <a
                        href={child.link || "#"}
                        target={child.linkTarget || "_self"}
                        style={{
                          backgroundColor: child.style?.backgroundColor || "#133C8B",
                          color: "#fff",
                          padding: '10px 28px',
                          borderRadius: '30px',
                          border: 'none',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-block',
                          textDecoration: 'none',
                          fontSize: child.style?.fontSize ? `${child.style.fontSize}px` : '14px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        className="transition transform hover:scale-105 hover:shadow-lg"
                      >
                        {child.content}
                      </a>
                    ) : (
                      <>
                        <button style={{
                          backgroundColor: child.style?.backgroundColor || "#133C8B",
                          color: "#fff",
                          padding: '8px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-block'
                        }} className="px-6 py-2 rounded-lg font-bold transition transform hover:scale-105">
                          {child.content}
                        </button>
                        <div className="mt-2 flex flex-col gap-1 max-w-[200px] mx-auto">
                          <input
                            className="text-[10px] border rounded p-1 outline-none w-full text-center"
                            value={child.content}
                            onChange={(e) => updateSectionChild(child.id, "content", e.target.value)}
                            placeholder="Button Text"
                          />
                          <input
                            className="text-[10px] border rounded p-1 outline-none w-full text-center text-blue-500"
                            value={child.link || ""}
                            onChange={(e) => updateSectionChild(child.id, "link", e.target.value)}
                            placeholder="Button Link (URL)"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Child Menu */}
            {!readOnly && (
              <div className="flex justify-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition duration-300">
                {["heading", "text", "button", "logo"].map(t => (
                  <button
                    key={t}
                    onClick={() => addSectionChild(t)}
                    className="bg-white/80 hover:bg-white text-[10px] font-bold px-3 py-1 rounded-full border border-gray-200 shadow-sm transition transform hover:scale-105 text-blue-600"
                  >
                    + {t.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      );
    }



    // HEADING
    if (block?.type === "heading") {
      return (
        <div style={{ ...getCommonStyles(block) }}>
          {readOnly ? (
            <h2 style={{
              color: block.style?.textColor,
              fontSize: block.style?.fontSize,
              textAlign: block.style?.textAlign,
              fontWeight: block.style?.fontWeight,
              fontFamily: block.style?.fontFamily,
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              margin: 0
            }}>
              {block.content}
            </h2>
          ) : (
            <div className="flex flex-col gap-1 w-full">
              <VariableTextarea
                value={block.content}
                placeholder={block.placeholder}
                onChange={(e) => update("content", e.target.value)}
                className="w-full bg-transparent focus:outline-none border-b border-dashed border-gray-300 pb-1 resize-none overflow-hidden block placeholder-gray-300"
                style={{
                  color: block.style?.textColor,
                  fontSize: block.style?.fontSize,
                  textAlign: block.style?.textAlign,
                  fontWeight: block.style?.fontWeight,
                  fontFamily: block.style?.fontFamily,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word"
                }}
              />
              <input
                className="text-[10px] text-blue-400 bg-transparent outline-none border-none italic opacity-60 hover:opacity-100 transition"
                placeholder="Heading Link (Optional)"
                value={block?.style?.link || ""}
                onChange={(e) => updateStyle("link", e.target.value)}
              />
            </div>
          )}
        </div>
      );
    }

    // TEXT / PARAGRAPH
    if (block?.type === "text") {
      const textStyles = {
        color: block.style?.textColor || "#000000",
        fontSize: block.style?.fontSize ? `${block?.style.fontSize}px` : "16px",
        fontWeight: block.style?.fontWeight || "normal",
        textAlign: block.style?.textAlign || "left",
        fontFamily: block.style?.fontFamily || "inherit",
        lineHeight: block.style?.lineHeight || "1.6",
        letterSpacing: block.style?.letterSpacing || "normal",
        textDecoration: block.style?.textDecoration || "none",
        textTransform: block.style?.textTransform || "none",
      };

      return (
        <div style={{ ...getCommonStyles(block) }}>
          <TextEditor
            id={block.id}
            readOnly={readOnly}
            value={block.content}
            onChange={(val) => update("content", val)}
            style={textStyles}
            placeholder="Enter text..."
          />
        </div>
      );
    }
    if (block?.type === "footerBlock") {
      return (
        <FooterBlockRenderer
          block={block}
          update={update}
          readOnly={readOnly}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      );
    }


    // INPUT (Original implementation, no StyleControls added as per new code)
    if (block?.type === "input")
      return (
        <input
          className="w-full border p-3 border-gray-200 rounded-md"
          placeholder={block.placeholder}
        />
      );


    // DIVIDER
    if (block?.type === "divider") {
      return (
        <div style={{ ...getCommonStyles(block) }}>
          <hr style={{ borderTop: '2px solid #f3f4f6', margin: 0 }} className={!readOnly ? "border-t-2 border-gray-100" : ""} />
        </div>
      );
    }


    // IMAGE (Original implementation with style support)
    if (block?.type === "image") {
      const imgStyles = {
        width: block.style?.width || '100%',
        maxWidth: block.style?.maxWidth || '100%',
        height: block.style?.height || 'auto',
        borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : (readOnly ? '12px' : undefined),
        objectFit: block.style?.objectFit || 'contain',
        display: 'block',
        margin: '0 auto',
      };

      return (
        <div style={{ ...getCommonStyles(block) }}>
          {block.url && (
            <img
              src={block.url}
              style={imgStyles}
              className={!readOnly ? "w-full mb-4" : ""}
            />
          )}
          {!readOnly && (
            <>
              <input
                id={`image-upload-${block.id}`}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) update("url", URL.createObjectURL(file));
                }}
              />
              <label
                htmlFor={`image-upload-${block.id}`}
                className="flex items-center justify-center gap-2 cursor-pointer
              rounded-xl border-2 border-dashed border-gray-300
              px-6 py-4 text-gray-600 mb-2
              hover:border-blue-500 hover:text-blue-600
              transition-all duration-200"
              >
                Click to upload image
              </label>
              <input
                className="w-full text-[11px] bg-white border border-gray-100 rounded px-2 py-1.5 outline-none mb-4 text-blue-500 italic shadow-sm"
                placeholder="Image Click URL (e.g., https://...)"
                value={block?.style?.link || ""}
                onChange={(e) => updateStyle("link", e.target.value)}
              />
            </>
          )}
        </div>
      );
    }

    // BUTTON
    if (block?.type === "btn") {
      return (
        <div style={{ ...getCommonStyles(block) }}>
          <button
            className={!readOnly ? "px-8 py-3 rounded-full transition-transform hover:scale-105" : ""}
            style={{
              backgroundColor: block.style?.backgroundColor === "transparent" ? "#237FEA" : (block.style?.backgroundColor || "#237FEA"),
              color: block.style?.textColor || "#ffffff",
              fontSize: block.style?.fontSize,
              borderRadius: block.style?.borderRadius || '24px',
              fontFamily: block.style?.fontFamily,
              padding: '12px 32px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-block',
              pointerEvents: readOnly ? "none" : "auto"
            }}
          >
            {block.content}
          </button>
          {!readOnly && (
            <div className="mt-4 flex flex-col gap-2">
              <input
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Button Text"
                value={block.content}
                onChange={(e) => update("content", e.target.value)}
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 text-blue-600 bg-blue-50/30"
                placeholder="Button Link (URL)"
                value={block?.style?.link || ""}
                onChange={(e) => updateStyle("link", e.target.value)}
              />
            </div>
          )}
        </div>
      );
    }

    // SECTION GRID (Remaining original functionality)
    if (block?.type === "sectionGrid")
      return (
        <div style={getCommonStyles(block)}>
          <div
            style={{
              display: block.style?.display === "flex" ? "flex" : "grid",
              flexDirection: block.style?.flexDirection,
              gap: block.style?.gap !== undefined ? `${block.style.gap}px` : "16px",

              gridTemplateColumns: block.style?.display === "flex" ? undefined : (readOnly
                ? `repeat(${block.columns.length}, minmax(0, 1fr))`
                : `repeat(${block.columns.length}, minmax(200px, 1fr)) 60px`),
              overflowX: (!readOnly && block.style?.display !== "flex") ? "auto" : undefined,
              alignItems: block.style?.alignItems || "start",
              justifyContent: block.style?.justifyContent || "start",
              flexWrap: block.style?.flexWrap || "wrap",
            }}
          >
            {block.columns.map((col, i) => {
              const colStyle = block.style?.columnStyles?.[i] || {};
              return (
                <div
                  key={i}
                  style={{
                    ...colStyle,
                    flex: readOnly ? 1 : undefined,
                    backgroundColor: colStyle.backgroundColor || (readOnly ? undefined : "rgba(255,255,255,0.5)"),
                    padding: colStyle.padding ? `${colStyle.padding}px` : undefined,
                    borderRadius: colStyle.borderRadius ? `${colStyle.borderRadius}px` : (readOnly ? undefined : "16px"),
                    border: colStyle.borderWidth ? `${colStyle.borderWidth}px solid ${colStyle.borderColor || "#e5e7eb"}` : undefined,
                    display: "flex",
                    flexDirection: "column",
                    gap: colStyle.gap ? `${colStyle.gap}px` : "8px",
                    minWidth: 0 // Prevent flex child blowout
                  }}
                  className={!readOnly ? "transition-all hover:bg-white/80 hover:shadow-sm" : ""}
                >
                  {!readOnly && (
                    <div className="flex justify-between items-center mb-2 px-1 border-b border-gray-100 pb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Col {i + 1}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => duplicateColumn(i)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Duplicate Column"
                        >
                          <FaCopy size={12} />
                        </button>
                        {block.columns.length > 1 && (
                          <button
                            onClick={() => removeColumn(i)}
                            className="text-red-400 hover:text-red-600 transition"
                            title="Delete Column"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {!readOnly && (
                    <div className="flex flex-col gap-2 mb-3">
                      {/* If column is empty, show big placeholders */}
                      {col.length === 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { type: "text", icon: <FaFont />, label: "Text" },
                            { type: "image", icon: <FaImage />, label: "Image" },
                            { type: "heading", icon: <FaHeading />, label: "Heading" },
                            { type: "btn", icon: <FaMousePointer />, label: "Button" },
                            { type: "infoBox", icon: <FaLayerGroup />, label: "Info Box" },
                            { type: "noteSection", icon: <FaStickyNote />, label: "Notes" }
                          ].map(opt => (
                            <button
                              key={opt.type}
                              onClick={() => addChild(i, opt.type)}
                              className="flex flex-col items-center justify-center p-3 gap-1 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-gray-500 hover:text-blue-600"
                            >
                              <span className="text-lg">{opt.icon}</span>
                              <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold self-center mr-2">Add:</span>
                          {["text", "image", "heading", "btn", "infoBox", "noteSection"].map((t) => (
                            <button
                              key={t}
                              className="w-6 h-6 flex items-center justify-center text-[10px] font-bold uppercase bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition text-gray-500"
                              onClick={() => addChild(i, t)}
                              title={`Add ${t}`}
                            >
                              <FaPlus size={8} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {col.map((child) => (
                    <div key={child.id} style={readOnly ? { padding: '4px' } : {}} className={!readOnly ? "p-1 relative group hover:scale-[1.01]" : ""}>
                      <BlockRenderer
                        block={child}
                        blocks={col}
                        setBlocks={(newColOrUpdater) => {
                          let newVal;
                          if (typeof newColOrUpdater === 'function') {
                            newVal = newColOrUpdater(col);
                          } else {
                            newVal = newColOrUpdater;
                          }
                          const newColumns = [...(block.columns || [])];
                          newColumns[i] = newVal;
                          update("columns", newColumns);
                        }}
                        readOnly={readOnly}
                        isSelected={isSelected && block.selectedChildId === child.id}
                        onSelect={() => {
                          // If parent grid is selected, we track which child is selected
                          if (onSelect) onSelect(); // select the parent grid first
                          update("selectedChildId", child.id);
                        }}
                      />

                    </div>
                  ))}
                </div>
              );
            })}
            {!readOnly && (
              <div className="flex items-center">
                <button
                  onClick={addColumn}
                  className="h-full border-2 border-dashed border-gray-200 rounded-2xl p-1 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition flex flex-col items-center justify-center gap-1 w-[60px]"
                  title="Add New Column"
                >
                  <FaPlus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      );

    // CARD ROW
    if (block?.type === "cardRow") {
      const columns = block.style?.columns;
      const gap = block.style?.gap !== undefined ? block.style.gap : 16;
      const flexBasis = columns && columns !== "auto"
        ? `calc((100% - ${(columns - 1) * gap}px) / ${columns})`
        : "200px";

      return (
        <div
          style={{
            ...getCommonStyles(block),
            display: "flex",
            flexDirection: "row", // Enforce row layout for grid
            flexWrap: "wrap",
            gap: `${gap}px`
          }}
        >
          {(block.cards || []).map((card) => (
            <div
              key={card.id}
              className={
                !readOnly
                  ? "relative group/card hover:shadow-md transition-all"
                  : ""
              }
              style={{
                backgroundColor: block.cardStyle?.backgroundColor || card.style?.backgroundColor || "#ffffff",
                borderRadius: block.cardStyle?.borderRadius ? `${block.cardStyle.borderRadius}px` : (card.style?.borderRadius || "12px"),
                padding: block.cardStyle?.padding ? `${block.cardStyle.padding}px` : (card.style?.padding || "16px"),
                border: block.cardStyle?.border || `1px solid ${block.cardStyle?.borderColor || "#eee"}`,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                textAlign: block.cardStyle?.textAlign || "left",

                // Flex Layout
                flex: columns && columns !== "auto" ? `0 0 ${flexBasis}` : "1 1 200px",
                maxWidth: columns && columns !== "auto" ? flexBasis : undefined,
                minWidth: columns && columns !== "auto" ? "auto" : "200px",

                position: "relative",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Duplicate / Delete Buttons */}
              {!readOnly && (
                <div className="absolute -top-3 -right-3 flex gap-1 z-10 opacity-0 group-hover/card:opacity-100 transition">
                  <button
                    className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-blue-600 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateCard(card.id);
                    }}
                    title="Duplicate Card"
                  >
                    ⧉
                  </button>

                  <button
                    className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCardFromRow(card.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div
                style={
                  readOnly
                    ? { display: "flex", flexDirection: "column", gap: "12px", height: '100%' }
                    : { display: "flex", flexDirection: "column", gap: "12px", height: '100%' }
                }
                className={!readOnly ? "space-y-3" : ""}
              >
                {/* IMAGE */}
                {card.url ? (
                  readOnly && card.link ? (
                    <a
                      href={card.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={card.url}
                        alt=""
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          objectFit: block.cardImageStyle?.objectFit || "cover",
                          height: block.cardImageStyle?.height ? `${block.cardImageStyle.height}px` : "128px",
                          display: "block",
                        }}
                      />
                    </a>
                  ) : (
                    <img
                      src={card.url}
                      alt=""
                      className={
                        !readOnly
                          ? "w-full rounded-lg"
                          : ""
                      }
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        objectFit: block.cardImageStyle?.objectFit || "cover",
                        height: block.cardImageStyle?.height ? `${block.cardImageStyle.height}px` : "128px",
                        display: "block",
                      }}
                    />
                  )
                ) : (
                  <div
                    className="w-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 text-xs"
                    style={{ height: block.cardImageStyle?.height ? `${block.cardImageStyle.height}px` : "128px" }}
                  >
                    Card Image
                  </div>
                )}

                {/* Upload Button */}
                {!readOnly && (
                  <>
                    <input
                      id={`card-row-upload-${card.id}`}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateCardInRow(
                            card.id,
                            "url",
                            URL.createObjectURL(file)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`card-row-upload-${card.id}`}
                      className="block text-center text-blue-500 text-xs cursor-pointer hover:underline"
                    >
                      Upload Photo
                    </label>
                  </>
                )}

                {/* READ ONLY MODE */}
                {readOnly ? (
                  <a
                    href={card.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                      flex: 1
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: block.cardTitleStyle?.fontSize ? `${block.cardTitleStyle.fontSize}px` : "16px",
                        color: block.cardTitleStyle?.textColor || "#000000",
                        fontWeight: "bold",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "break-word",
                        marginBottom: "4px"
                      }}
                    >
                      {card.title}
                    </h4>

                    <p
                      style={{
                        margin: 0,
                        fontSize: block.cardDescStyle?.fontSize ? `${block.cardDescStyle.fontSize}px` : "14px",
                        color: block.cardDescStyle?.textColor || "#666",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "break-word",
                      }}
                    >
                      {card.description}
                    </p>
                  </a>
                ) : (
                  <>
                    {/* TITLE */}
                    <textarea
                      className="w-full bg-transparent outline-none font-bold text-sm resize-none overflow-hidden whitespace-pre-wrap break-words"
                      style={{
                        fontSize: block.cardTitleStyle?.fontSize ? `${block.cardTitleStyle.fontSize}px` : "16px",
                        color: block.cardTitleStyle?.textColor || "#000000",
                        textAlign: block.cardStyle?.textAlign || "left",
                      }}
                      value={card.title}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height =
                          e.target.scrollHeight + "px";
                      }}
                      onChange={(e) =>
                        updateCardInRow(card.id, "title", e.target.value)
                      }
                    />

                    {/* DESCRIPTION */}
                    <textarea
                      className="w-full bg-transparent outline-none text-xs text-gray-500 resize-none min-h-[40px] whitespace-pre-wrap break-words overflow-hidden"
                      style={{
                        fontSize: block.cardDescStyle?.fontSize ? `${block.cardDescStyle.fontSize}px` : "14px",
                        color: block.cardDescStyle?.textColor || "#666",
                        textAlign: block.cardStyle?.textAlign || "left",
                      }}
                      value={card.description}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height =
                          e.target.scrollHeight + "px";
                      }}
                      onChange={(e) =>
                        updateCardInRow(
                          card.id,
                          "description",
                          e.target.value
                        )
                      }
                    />

                    {/* LINK FIELD */}
                    <input
                      type="text"
                      placeholder="Enter link (https://example.com)"
                      className="w-full bg-transparent outline-none text-xs text-blue-500 border-t border-gray-100 pt-2"
                      value={card.link || ""}
                      onChange={(e) =>
                        updateCardInRow(card.id, "link", e.target.value)
                      }
                    />
                  </>
                )}
              </div>
            </div>
          ))}

          {/* ADD CARD BUTTON */}
          {!readOnly && (
            <div className={`flex items-center justify-center ${columns && columns !== "auto" ? "w-full p-4" : "min-w-[100px]"}`}>
              <button
                onClick={addCardToRow}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition text-sm"
              >
                + Add Card
              </button>
            </div>
          )}
        </div>
      );
    }


    // ✅ HERO SECTION (Wavy)
    if (block?.type === "heroSection") {
      return (
        <div
          style={{
            ...getCommonStyles(block),
            position: 'relative',
            overflow: 'hidden',
          }}
          className={!readOnly ? "group" : ""}
        >
          {/* BG Controls */}
          {!readOnly && (
            <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(); // This selects the block and opens the sidebar settings
                }}
                className="bg-gray-800 text-white p-2 rounded-lg text-xs font-bold hover:bg-black transition flex items-center gap-2 shadow-lg"
                title="Open Hero Settings"
              >
                <FaCog size={12} /> Settings
              </button>
              <input
                id={`hero-bg-${block.id}`}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    update("style", { ...block.style, backgroundImage: `url("${url}")` });
                  }
                }}
              />
              <label htmlFor={`hero-bg-${block.id}`} className="bg-white/80 text-black p-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-white transition flex items-center gap-2 shadow-lg">
                <FaImage size={12} /> BG
              </label>
            </div>
          )}

          {/* Content */}
          <div
            style={readOnly ? {
              maxWidth: '600px',
              margin: block.style?.textAlign === 'center' ? '0 auto' : (block.style?.textAlign === 'right' ? '0 0 0 auto' : '0'),
              textAlign: block.style?.textAlign || 'left',
              padding: '40px 2.5rem',
              position: 'relative',
              zIndex: 10
            } : {}}
            className={!readOnly ? `w-full mx-auto relative z-10 p-10` : ""}
          >
            {/* Logo Placeholder */}
            <div
              style={readOnly ? {
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: block.style?.textAlign === 'center' ? 'center' : (block.style?.textAlign === 'right' ? 'flex-end' : 'flex-start'),
                marginTop: '1.25rem'
              } : {}}
              className={!readOnly ? `mb-6 flex items-center mt-5 ${block.style?.textAlign === 'center' ? 'justify-center' : (block.style?.textAlign === 'right' ? 'justify-end' : 'justify-start')}` : ""}
            >
              <img src="/DashboardIcons/sss-logo.png" style={readOnly ? { width: '60px' } : {}} className={!readOnly ? "w-[60px]" : ""} alt="" />
            </div>


            {readOnly ? (
              <h1 style={{
                color: block.titleStyle?.textColor || "white",
                lineHeight: "1.2",
                fontSize: block.titleStyle?.fontSize ? `${block.titleStyle.fontSize}px` : "2.25rem",
                fontWeight: block.titleStyle?.fontWeight || "600",
                textAlign: block.style?.textAlign || "left",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                margin: 0
              }}>
                {block.title}
              </h1>
            ) : (
              <textarea
                className="w-full bg-transparent text-white leading-10 text-4xl font-semibold outline-none resize-none overflow-hidden"
                value={block.title}
                onChange={(e) => update("title", e.target.value)}
                style={{
                  color: block.titleStyle?.textColor || "inherit",
                  textAlign: block.style?.textAlign || "left",
                  fontSize: block.titleStyle?.fontSize ? `${block.titleStyle.fontSize}px` : "2.25rem",
                  fontWeight: block.titleStyle?.fontWeight || "600",
                }}
              />
            )}

            {readOnly ? (
              <p style={{
                color: block.subtitleStyle?.textColor || "white",
                fontSize: block.subtitleStyle?.fontSize ? `${block.subtitleStyle.fontSize}px` : "1.125rem",
                fontWeight: block.subtitleStyle?.fontWeight || "500",
                textAlign: block.style?.textAlign || "left",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                marginTop: "1rem",
                opacity: block.subtitleStyle?.opacity || 0.9,
              }}>
                {block?.subtitle}
              </p>
            ) : (
              <textarea
                className="w-full bg-transparent text-white text-lg font-medium outline-none mt-4 resize-none overflow-hidden"
                value={block?.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
                style={{
                  color: block.subtitleStyle?.textColor || "inherit",
                  textAlign: block.style?.textAlign || "left",
                  fontSize: block.subtitleStyle?.fontSize ? `${block.subtitleStyle.fontSize}px` : "1.125rem",
                  opacity: block.subtitleStyle?.opacity || 0.9,
                }}
              />
            )}

            <div
              style={readOnly ? {
                marginTop: '2rem',
                display: 'flex',
                justifyContent: block.style?.textAlign === 'center' ? 'center' : (block.style?.textAlign === 'right' ? 'flex-end' : 'flex-start')
              } : {}}
              className={!readOnly ? `mt-8 flex ${block.style?.textAlign === 'center' ? 'justify-center' : (block.style?.textAlign === 'right' ? 'justify-end' : 'justify-start')}` : ""}
            >
              {readOnly ? (
                <a
                  href={block.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: block.buttonStyle?.backgroundColor || '#FBBF24',
                    color: block.buttonStyle?.textColor || '#000000',
                    padding: '8px 24px',
                    borderRadius: block.buttonStyle?.borderRadius ? `${block.buttonStyle.borderRadius}px` : '9999px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                  className="transition transform hover:scale-105 shadow-lg"
                >
                  {block.buttonText}
                </a>
              ) : (
                <div className="flex flex-col gap-2 items-end">
                  <input
                    className="w-max px-4 py-2 rounded-full outline-none text-center cursor-pointer hover:scale-105 transition transform shadow-lg font-bold"
                    value={block.buttonText}
                    onChange={(e) => update("buttonText", e.target.value)}
                    style={{
                      backgroundColor: block.buttonStyle?.backgroundColor || '#FBBF24',
                      color: block.buttonStyle?.textColor || '#000000',
                      borderRadius: block.buttonStyle?.borderRadius ? `${block.buttonStyle.borderRadius}px` : '9999px',
                    }}
                  />
                  <input
                    className="bg-white/20 border border-white/30 text-[10px] text-white px-2 py-1 rounded w-40 outline-none placeholder:text-white/40"
                    placeholder="Button Link (URL)"
                    value={block.link}
                    onChange={(e) => update("link", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>


      );
    }


    // ✅ WAVE FOOTER
    if (block?.type === "waveFooter") {
      return (
        <div style={getCommonStyles(block)} className={!readOnly ? "relative group" : ""}>
          <div style={readOnly ? { position: 'absolute', top: 0, left: 0, width: '100%', lineHeight: 0, transform: 'translateY(-100%)' } : {}} className={!readOnly ? "absolute top-0 left-0 w-full leading-none transform -translate-y-full" : ""}>
            <svg viewBox="0 0 1440 320" style={readOnly ? { width: '100%', height: 'auto', display: 'block' } : {}} className={!readOnly ? "w-full h-auto block" : ""}>
              <path
                fill={block?.style?.backgroundColor || "transparent"}
                fillOpacity="1"
                d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
          <div style={readOnly ? { textAlign: 'center', padding: '40px 0', position: 'relative', zIndex: 10, color: block.style?.textColor } : {}} className={!readOnly ? "text-center py-10 relative z-10" : ""}>
            {readOnly ? (
              <div dangerouslySetInnerHTML={{ __html: block.content || "© 2026 Your Company" }} />
            ) : (
              <VariableTextarea
                className="w-full bg-transparent text-center outline-none resize-none"
                style={{ color: block.style?.textColor }}
                value={block.content}
                onChange={(e) => update("content", e.target.value)}
              />
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const content = renderContent();

  if (readOnly) {
    // Only wrap in <a> if it's NOT a complex block that handles its own links internally
    const typesWithInternalLinks = ["cardRow", "footerBlock", "heroSection"];
    const hasBlockLink = block.style?.link;
    const shouldWrap = hasBlockLink && !typesWithInternalLinks.includes(block?.type);

    if (shouldWrap) {
      return (
        <a
          href={block?.style.link}
          target={block?.style.linkTarget || "_self"}
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          {content}
        </a>
      );
    }
    return content;
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className={`relative cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 rounded-lg shadow-lg z-20' : 'hover:ring-1 hover:ring-blue-100'}`}
    >
      {content}
      {isSelected && (
        <div className="absolute -top-4 right-8 flex gap-2 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              update("duplicateBlock", block);
            }}
            className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-1"
          >
            <FaCopy size={10} /> Duplicate Row
          </button>
          <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            Editing
          </div>
        </div>
      )}
    </div>
  );

}