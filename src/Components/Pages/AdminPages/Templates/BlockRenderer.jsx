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
      if (s.gridTemplateColumns) style.gridTemplateColumns = s.gridTemplateColumns;
      if (s.alignItems) style.alignItems = s.alignItems;
      if (s.justifyContent) style.justifyContent = s.justifyContent;
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
    const nodeStyle = extractStyles(node);

    // 0. Detect Block Types by Class Name
    if (tag !== "style" && tag !== "script") {
      const classes = Array.from(node.classList);
      // Find class starting with block- but ignore block-component/id and UUIDs (8-4-4-4-12 hex)
      const blockTypeClass = classes.find(c => c.startsWith("block-") && !c.startsWith("block-component") && !c.startsWith("block-id-") && !/block-[0-9a-f]{8}-/.test(c));

      if (blockTypeClass) {
        const type = blockTypeClass.replace("block-", "");

        // 1. Heading
        if (type === "heading") {
          return createBlock("heading", {
            content: node.innerText,
            style: { ...nodeStyle, fontSize: parseInt(nodeStyle.fontSize) || 24, fontWeight: "bold" }
          });
        }

        // 2. Text
        if (type === "text") {
          return createBlock("text", {
            content: node.innerHTML,
            style: { fontSize: 16, ...nodeStyle }
          });
        }

        // 3. Image
        if (type === "image") {
          const img = node.querySelector("img");
          return createBlock("image", {
            url: img ? img.getAttribute("src") : "",
            style: { ...nodeStyle, width: "100%" }
          });
        }

        // 4. Section Grid
        if (type === "sectionGrid") {
          // Try to find columns
          // Structure: .block-sectionGrid > .wrapper > .column*
          // OR if flattened: .block-sectionGrid > .column* (if no wrapper)
          let columns = [];
          const children = Array.from(node.children);

          // Check if first child is a wrapper (display flex/grid)
          const wrapper = children.find(c => c.style.display === "flex" || c.style.display === "grid");

          if (wrapper) {
            Array.from(wrapper.children).forEach(col => {
              columns.push(processNodeList(col.childNodes));
            });
          } else {
            // Fallback: assume direct children are columns if they look like it, or just wrap content
            if (children.length > 0) {
              // If direct children are divs, treat as columns?
              children.forEach(col => {
                columns.push(processNodeList(col.childNodes));
              });
            }
          }

          if (columns.length > 0) {
            return createBlock("sectionGrid", {
              columns,
              style: { ...nodeStyle, display: "grid", gap: 20 }
            });
          }
        }

        // 5. Button
        if (type === "btn") {
          const btn = node.querySelector("button, a.btn") || node;
          return createBlock("btn", {
            content: btn.innerText,
            url: btn.getAttribute("href") || "#",
            style: { ...nodeStyle, ...extractStyles(btn) }
          });
        }

        // 6. Card Row
        if (type === "cardRow") {
          const cards = [];
          Array.from(node.children).forEach(child => {
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

            const title = child.querySelector("h1, h2, h3, h4, h5, strong") ||
              (child.querySelector(".font-bold") && child.querySelector("div")) || // Fallback for simple divs
              child.querySelector("div"); // Ultimate fallback

            // Refined Title Logic: Try to find the most likely title element
            if (child.querySelector("h4")) card.title = child.querySelector("h4").innerText;
            else if (child.querySelector("strong")) card.title = child.querySelector("strong").innerText;
            else if (title && title.innerText.length < 50) card.title = title.innerText;

            const desc = child.querySelector("p");
            if (desc) card.description = desc.innerText;
            else {
              // Try to find a div that is NOT the title
              const divs = Array.from(child.querySelectorAll("div"));
              const textDiv = divs.find(d => d.innerText !== card.title && d.innerText.length > 5);
              if (textDiv) card.description = textDiv.innerText;
            }

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

        // Fallback for other known types if content is simple

        // 7. InfoBox
        if (type === "infoBox") {
          const items = [];

          // Try to find items by looking for pairs of Label/Value or just text
          // In the snippet, it's: div > div (flex col) > div (Label) + div (Value)
          // Try to find items by looking for pairs of Label/Value or just text
          // In the snippet, it's: div > div (flex col) > div (Label) + div (Value)
          // FIX: Don't use .block-infoBox selector as it might be the node itself.
          // Look for nested divs that act as columns.
          let itemDivs = [];
          // If the node has a wrapper div, use that
          if (node.children.length === 1 && node.children[0].tagName === "DIV") {
            itemDivs = Array.from(node.children[0].children);
          } else {
            itemDivs = Array.from(node.children);
          }

          // Filter to only those that look like columns (have children)
          itemDivs = itemDivs.filter(d => d.tagName === "DIV" && d.children.length > 0);

          // Check if these "columns" have the specific column class or structure
          // Or just proceed with the assumption they might be columns if they contain multiple pairs
          const hasMultiplePairs = itemDivs.some(d => d.children.length >= 4); // At least 2 pairs

          if (hasMultiplePairs) {
            itemDivs.forEach(div => {
              // Inside each column, there are rows of Label/Value pairs?
              // Snippet: 4 columns.
              // Inside column: multiple label/value pairs?
              // Snippet shows: div (col) -> div (Label), div (Value), div (Label), div (Value)...

              // Let's iterate children of the column
              const children = Array.from(div.children);
              for (let i = 0; i < children.length; i += 2) {
                const label = children[i]?.innerText;
                const value = children[i + 1]?.innerHTML;
                if (label && value) {
                  items.push({ label, value });
                }
              }
            });
          } else {
            // TRY GENERIC GRID/ROW DETECTION
            // If the node has a single child that is a flex/grid container, use that.
            // Or if the node itself is a flex/grid container, use its children.
            const container = (node.children.length === 1 && (node.children[0].style.display === 'flex' || node.children[0].style.display === 'grid' || node.children[0].className.includes('grid') || node.children[0].className.includes('flex')))
              ? node.children[0]
              : node;

            const children = Array.from(container.children);
            // If children look like columns (contain multiple items), iterate them
            // Heuristic: if a child has multiple div children, treat as column
            // If a child has only 2 div children (or text + div), treat as Item

            children.forEach(child => {
              const grandChildren = Array.from(child.children);
              if (grandChildren.length > 2) {
                // Child is likely a column containing items
                // Iterate pairs
                for (let i = 0; i < grandChildren.length; i += 2) {
                  const label = grandChildren[i]?.innerText;
                  const value = grandChildren[i + 1]?.innerHTML;
                  if (label && value) items.push({ label, value });
                }
              } else if (grandChildren.length === 2) {
                // Child is likely an Item itself (Label + Value)
                const label = grandChildren[0]?.innerText;
                const value = grandChildren[1]?.innerHTML;
                if (label && value) items.push({ label, value });
              }
            });
          }

          if (items.length === 0) {
            const potentialLabels = Array.from(node.querySelectorAll("div, strong, b, h4, h5, h6")).filter(el => {
              const style = extractStyles(el);
              return style.fontWeight === "bold" || parseInt(style.fontWeight) >= 600 || el.tagName === "STRONG" || el.tagName === "B";
            });

            potentialLabels.forEach(labelEl => {
              // Avoid using values that are too long as labels
              if (labelEl.innerText.length > 100) return;

              let valueEl = labelEl.nextElementSibling;
              // If next sibling is a BR, skip it
              if (valueEl && valueEl.tagName === "BR") valueEl = valueEl.nextElementSibling;

              if (valueEl) {
                items.push({ label: labelEl.innerText, value: valueEl.innerHTML });
              }
            });

            // If still no items, try dl/dt/dd
            if (items.length === 0) {
              const dts = Array.from(node.querySelectorAll("dt"));
              dts.forEach(dt => {
                const dd = dt.nextElementSibling;
                if (dd && dd.tagName === "DD") {
                  items.push({ label: dt.innerText, value: dd.innerHTML });
                }
              });
            }
          }

          if (items.length > 0) {
            return createBlock("infoBox", {
              items,
              style: { ...nodeStyle, display: "flex", flexDirection: "row", gap: 16, flexWrap: "wrap" }
            });
          }
          // If no items found, return default or empty?
          // Better to return empty infoBox than sectionGrid
          return createBlock("infoBox", {
            items: [{ label: "Label", value: "Value" }],
            style: { ...nodeStyle }
          });
        }

        // 8. Multiple Info Box
        if (type === "multipleInfoBox") {
          const boxes = [];
          // Expecting structure: div (box style) > h4 (title) + div (grid items)
          const boxNodes = Array.from(node.children);

          boxNodes.forEach(boxNode => {
            // Check if this node looks like a box (has style, padding, etc)
            // Or just check if it has children
            if (boxNode.children.length === 0) return;

            const box = {
              id: crypto.randomUUID(),
              title: "Info Box",
              items: []
            };

            // Title
            const titleEl = boxNode.querySelector("h4, h3, strong");
            if (titleEl) box.title = titleEl.innerText;

            // Items
            // Usually in a grid container
            const gridContainer = boxNode.querySelector("div[style*='grid']") || boxNode.querySelector("div[class*='grid']");
            const itemsContainer = gridContainer || boxNode;

            // Items are usually cols -> label/value pairs
            // Based on user snippet: block-multipleInfoBox > div (box) > div.grid > div.gap-1 (item) > Label + Value
            // FIX: Be more permissive. Iterate all children of the grid/items container.
            const itemNodes = Array.from(itemsContainer.children);

            if (itemNodes.length > 0) {
              itemNodes.forEach(itemNode => {
                // Check if it has 2 children (Label, Value)
                // Or just text (Label) + parsing innerHTML (Value) ?
                // If itemNode has children, assume first is label, second is value.
                if (itemNode.children.length >= 1) {
                  const label = itemNode.children[0]?.innerText;
                  const value = itemNode.children[1]?.innerHTML || "";
                  if (label) {
                    box.items.push({ label, value });
                  }
                }
              });
            } else {
              // Fallback: try to find bold labels followed by values
              const boldDivs = Array.from(boxNode.querySelectorAll("div")).filter(d => d.style.fontWeight == "700" || d.style.fontWeight == "bold");
              boldDivs.forEach(labelDiv => {
                const valueDiv = labelDiv.nextElementSibling;
                if (valueDiv) {
                  box.items.push({ label: labelDiv.innerText, value: valueDiv.innerHTML });
                }
              });
            }
            boxes.push(box);
          });

          if (boxes.length > 0) {
            return createBlock("multipleInfoBox", {
              boxes,
              style: { ...nodeStyle, display: "grid", gap: 20, columns: Math.min(boxes.length, 2) }
            });
          }
        }

        // 9. Footer Block
        if (type === "footerBlock") {
          const footerData = {
            shopText: "Shop Online",
            shopLink: "#",
            logoUrl: "",
            bottomBarStyle: {}
          };

          const img = node.querySelector("img");
          if (img) footerData.logoUrl = img.getAttribute("src");

          // Shop Link
          const shopLinkEl = node.querySelector("a");
          if (shopLinkEl) {
            footerData.shopLink = shopLinkEl.getAttribute("href");
            footerData.shopText = shopLinkEl.innerText.trim();
          }

          // Bottom Bar (Copyright)
          // Find div with copyright symbol
          const allDivs = Array.from(node.querySelectorAll("div"));
          const copyrightDiv = allDivs.find(d => d.innerText.includes("©") || d.innerText.toLowerCase().includes("copyright"));

          if (copyrightDiv) {
            const s = extractStyles(copyrightDiv);
            footerData.bottomBarStyle = {
              backgroundColor: s.backgroundColor,
              borderColor: s.borderTopColor || s.borderColor || "rgba(255,255,255,0.1)",
              borderTop: copyrightDiv.style.borderTop || "1px solid",
              fontSize: s.fontSize || 12,
              textColor: s.textColor || "rgba(255,255,255,0.7)"
            };
          }

          return createBlock("footerBlock", {
            ...footerData,
            style: { ...nodeStyle }
          });
        }

        // 10. Hero Section
        if (type === "heroSection") {
          const heroData = {
            title: "Hero Title",
            subtitle: "",
            buttonText: "Click Me",
            link: "#",
            titleStyle: {},
            subtitleStyle: {},
            buttonStyle: {}
          };

          const h2 = node.querySelector("h2, h1");
          if (h2) {
            heroData.title = h2.innerText;
            heroData.titleStyle = extractStyles(h2);
          }

          const p = node.querySelector("p");
          if (p) {
            heroData.subtitle = p.innerText;
            heroData.subtitleStyle = extractStyles(p);
          }

          const btn = node.querySelector("a, button");
          if (btn) {
            heroData.buttonText = btn.innerText;
            heroData.link = btn.getAttribute("href");
            heroData.buttonStyle = extractStyles(btn);
          }

          return createBlock("heroSection", {
            ...heroData,
            style: { ...nodeStyle }
          });
        }

        // 11. Note Section
        if (type === "noteSection") {
          const noteData = {
            heading: "Note Heading",
            headingStyle: {},
            rows: []
          };

          const h2 = node.querySelector("h2, h3");
          if (h2) {
            noteData.heading = h2.innerText;
            noteData.headingStyle = extractStyles(h2);
          }

          // Rows? Note section usually has rows of boxes
          // structure: note section > div (row) > div (box)
          // Let's assume direct children (excluding heading) are rows?
          // Or look for grid/flex containers
          const potentialRows = Array.from(node.children).filter(c => c.tagName !== "H2" && c.tagName !== "H3");

          potentialRows.forEach(rowNode => {
            const row = {
              id: crypto.randomUUID(),
              boxes: []
            };
            // Boxes in row
            Array.from(rowNode.children).forEach(boxNode => {
              // Parse box (similar to infoBox or multipleInfoBox box)
              const box = {
                id: crypto.randomUUID(),
                type: "infoBox",
                items: [],
                style: extractStyles(boxNode)
              };

              // Extract items from box
              const boldDivs = Array.from(boxNode.querySelectorAll("div")).filter(d => d.style.fontWeight == "800" || d.style.fontWeight == "bold");
              boldDivs.forEach(labelDiv => {
                const valueDiv = labelDiv.nextElementSibling;
                if (valueDiv) {
                  box.items.push({ label: labelDiv.innerText, value: valueDiv.innerHTML });
                }
              });

              if (box.items.length === 0) {
                // Try simple text content
                box.items.push({ label: "Info", value: boxNode.innerText });
              }

              row.boxes.push(box);
            });
            if (row.boxes.length > 0) noteData.rows.push(row);
          });

          return createBlock("noteSection", {
            ...noteData,
            style: { ...nodeStyle }
          });
        }

        // These are complex to reverse-engineer perfectly without specific logic
        // For now, let generic logic specific to them below handle (or add later if needed)
        // But if we return nothing here, it falls through to generic parsing which might be safer
        // unless we want to force the type.
        // Let's NOT return here for complex types yet to avoid empty blocks.
      }
    }


    if (node.classList.contains("heading")) {
      return createBlock("heading", {
        content: node.innerText,
        style: {
          ...nodeStyle,
          fontSize: nodeStyle.fontSize || 24,
          fontWeight: "bold"
        }
      });
    }
    if (node.classList.contains("text")) {
      // Parse inner HTML to keep formatting but treat as single text block
      return createBlock("text", {
        content: node.innerHTML,
        style: { fontSize: 16, ...nodeStyle }
      });
    }





    // 0. Skip style and script tags (Prevents CSS showing as text)
    if (tag === "style" || tag === "script") return null;

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

    // 2. Handle Flex / Row Divs / Card Rows / Grid Rows
    if (tag === "div" && (
      node.style.display === "flex" ||
      node.classList.contains("row") ||
      node.classList.contains("card-row") ||
      node.classList.contains("grid-row") ||
      node.classList.contains("section-grid")
    )) {
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

const VariableTextarea = ({ value, onChange, className, placeholder, style, showVariables = true }) => {
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
      {showVariables && (
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
      )}
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

const parseUnit = (val) => {
  if (val === undefined || val === null || val === "" || Number.isNaN(val)) return undefined;
  if (typeof val === "number") return `${val}px`;
  if (typeof val === "string" && /^-?\d+(\.\d+)?$/.test(val.trim())) return `${val.trim()}px`;
  return val;
};

const getCommonStyles = (b) => {
  if (!b || !b.style) return {};
  const s = b.style;

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

    // Grid support
    gridTemplateColumns: s.gridTemplateColumns || (s.columns && s.columns !== "auto" ? `repeat(${s.columns}, minmax(0, 1fr))` : undefined),

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
    return <div className={`block-component block-${block.type} block-${block.id}`} style={{ ...getCommonStyles(block), overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: block.content }} />
  }

  return (
    <div
      className={`relative group ${isSelected ? "ring-2 ring-blue-500" : ""} block-component block-${block.type} block-${block.id}`}
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

  // ✅ Handle Nested Selection (e.g., InfoBox inside Grid)
  let targetBlock = block;
  let isNested = false;

  if (block.type === "sectionGrid" && block.selectedChildId) {
    const findChild = (cols) => {
      for (const col of cols) {
        const found = col.find(c => c.id === block.selectedChildId);
        if (found) return found;
      }
      return null;
    };
    const child = findChild(block.columns || []);
    if (child) {
      targetBlock = child;
      isNested = true;
    }
  }

  const updateStyle = (key, value, rootKey = null) => {
    if (isNested) {
      // We need to update the CHILD block, not the parent grid directly
      // However, `rawUpdateStyle` usually updates the ROOT block passed to it.
      // We need a way to propagate changes to the child.
      // Since `rawUpdateStyle` in `TemplateBuilder` likely only updates the `selectedBlock` (the Grid),
      // we might need to update the Grid's columns to update the child.

      // But `AdvancedStyleControls` receives `updateStyle` which might be `updateBox` or state setter.
      // If `BlockRenderer` is used, `updateStyle` is passed from parent.

      // The current `rawUpdateStyle` passed from `BlockRenderer` (line 3300) might not be enough if it's top-level.
      // CHECK: Where is AdvancedStyleControls called? 
      // It is called in `TemplateBuilder.jsx` or `CreateTemplate.jsx`.

      // Let's assume we need to update the parent block (Grid) by modifying its columns to update the child.
      // But `rawUpdateStyle` usually takes (key, value).

      // Use a custom update for nested blocks:
      rawUpdateStyle("childUpdate", { childId: targetBlock.id, key, value, rootKey });
    } else {
      rawUpdateStyle(key, value, rootKey);
    }
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
            value={targetBlock?.style?.fontFamily || "inherit"}
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
          <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({targetBlock?.style?.fontSize}px)</label>
          <input type="range" min="10" max="100" value={targetBlock?.style?.fontSize || 16} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Weight</label>
          <select value={targetBlock?.style?.fontWeight || "normal"} onChange={(e) => updateStyle("fontWeight", e.target.value)} className="text-xs border rounded p-1 bg-white h-8">
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
              <button key={opt.val} onClick={() => updateStyle("textAlign", opt.val)} className={`p-1 rounded ${targetBlock?.style?.textAlign === opt.val ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {opt.icon}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
          <input type="color" value={targetBlock?.style?.textColor || "#000000"} onChange={(e) => updateStyle("textColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
        </div>
      </Section>

      {targetBlock?.type === "heroSection" && (
        <>
          <Section id="heroTitleStyles" title="Hero Title Style" icon={<FaHeading />}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({targetBlock.titleStyle?.fontSize || 36}px)</label>
              <input type="range" min="20" max="100" value={targetBlock.titleStyle?.fontSize || 36} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "titleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Weight</label>
              <select value={targetBlock.titleStyle?.fontWeight || "600"} onChange={(e) => updateStyle("fontWeight", e.target.value, "titleStyle")} className="text-xs border rounded p-1 bg-white h-8">
                <option value="normal">Normal</option>
                <option value="600">Semi-Bold</option>
                <option value="700">Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
              <input type="color" value={targetBlock.titleStyle?.textColor || "#ffffff"} onChange={(e) => updateStyle("textColor", e.target.value, "titleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
          </Section>

          <Section id="heroSubtitleStyles" title="Hero Subtitle Style" icon={<FaAlignLeft />}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Size ({targetBlock.subtitleStyle?.fontSize || 18}px)</label>
              <input type="range" min="12" max="40" value={targetBlock.subtitleStyle?.fontSize || 18} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "subtitleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
              <input type="color" value={targetBlock.subtitleStyle?.textColor || "#ffffff"} onChange={(e) => updateStyle("textColor", e.target.value, "subtitleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Opacity ({Math.round((targetBlock.subtitleStyle?.opacity || 0.9) * 100)}%)</label>
              <input type="range" min="0" max="1" step="0.1" value={targetBlock.subtitleStyle?.opacity || 0.9} onChange={(e) => updateStyle("opacity", parseFloat(e.target.value), "subtitleStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </Section>

          <Section id="heroButtonStyles" title="Hero Button Style" icon={<FaMousePointer />}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">BG Color</label>
              <input type="color" value={targetBlock.buttonStyle?.backgroundColor || "#FBBF24"} onChange={(e) => updateStyle("backgroundColor", e.target.value, "buttonStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Text Color</label>
              <input type="color" value={targetBlock.buttonStyle?.textColor || "#000000"} onChange={(e) => updateStyle("textColor", e.target.value, "buttonStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Radius ({targetBlock.buttonStyle?.borderRadius || 30}px)</label>
              <input type="range" min="0" max="50" value={targetBlock.buttonStyle?.borderRadius || 30} onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value), "buttonStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
          </Section>
        </>
      )}

      {targetBlock?.type === "footerBlock" && (
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

      {targetBlock?.type === "sectionGrid" && (
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
              {(targetBlock.columns || []).map((_, i) => (
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

      {(targetBlock?.type === "cardRow" || targetBlock?.type === "infoBox" || targetBlock?.type === "multipleInfoBox" || (targetBlock?.type === "sectionGrid" && targetBlock?.style?.display === "grid")) && (
        <>
          <Section id="cardLayout" title="Grid Layout" icon={<FaLayerGroup />}>
            {/* Width Controls */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Width</label>
              <input
                type="text"
                placeholder="e.g. 100% or 1200"
                value={targetBlock?.style?.width || ""}
                onChange={(e) => updateStyle("width", e.target.value)}
                className="text-xs border rounded p-1 w-full h-8"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Max Width</label>
              <input
                type="text"
                placeholder="e.g. 1200"
                value={targetBlock?.style?.maxWidth || ""}
                onChange={(e) => updateStyle("maxWidth", e.target.value)}
                className="text-xs border rounded p-1 w-full h-8"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Height</label>
              <input
                type="text"
                placeholder="e.g. auto or 500"
                value={targetBlock?.style?.height || ""}
                onChange={(e) => updateStyle("height", e.target.value)}
                className="text-xs border rounded p-1 w-full h-8"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Gap (px)</label>
              <input type="number" value={targetBlock?.style?.gap !== undefined ? targetBlock?.style?.gap : 16} onChange={(e) => updateStyle("gap", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Columns</label>
              <select
                value={targetBlock?.style?.columns || "auto"}
                onChange={(e) => updateStyle("columns", e.target.value)}
                className="text-xs border rounded p-1 bg-white h-8"
              >
                <option value="auto">Auto (Responsive)</option>
                <option value="1">1 Column</option>
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
                <option value="4">4 Columns</option>
                <option value="5">5 Columns</option>
                <option value="6">6 Columns</option>
              </select>
            </div>

            {/* Alignment for Grid */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Align (Vertical)</label>
              <select value={targetBlock?.style?.alignItems || "stretch"} onChange={(e) => updateStyle("alignItems", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
                <option value="stretch">Stretch</option>
                <option value="center">Center</option>
                <option value="flex-start">Start</option>
                <option value="flex-end">End</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Justify (Horiz)</label>
              <select value={targetBlock?.style?.justifyContent || "start"} onChange={(e) => updateStyle("justifyContent", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
              </select>
            </div>
          </Section>
        </>
      )}

      {(targetBlock?.type === "cardRow" || targetBlock?.type === "multipleInfoBox") && (
        <Section id="cardStyle" title={targetBlock.type === "multipleInfoBox" ? "Unit Style" : "Card Style"} icon={<FaBorderAll />}>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{targetBlock.type === "multipleInfoBox" ? "Unit BG" : "Card BG"}</label>
            <input
              type="color"
              value={targetBlock.type === "multipleInfoBox" ? (targetBlock.boxStyle?.backgroundColor || "#ffffff") : (targetBlock.cardStyle?.backgroundColor || "#ffffff")}
              onChange={(e) => updateStyle("backgroundColor", e.target.value, targetBlock.type === "multipleInfoBox" ? "boxStyle" : "cardStyle")}
              className="w-8 h-8 rounded border-none p-0 cursor-pointer"
            />
          </div>

          {targetBlock.type === "multipleInfoBox" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Items Columns</label>
              <select
                value={targetBlock.boxStyle?.columns || "1"}
                onChange={(e) => updateStyle("columns", parseInt(e.target.value), "boxStyle")}
                className="text-xs border rounded p-1 bg-white h-8"
              >
                <option value="1">1 Column</option>
                <option value="2">2 Columns</option>
                <option value="3">3 Columns</option>
                <option value="4">4 Columns</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Padding ({targetBlock.type === "multipleInfoBox" ? (targetBlock.boxStyle?.padding || 20) : (targetBlock.cardStyle?.padding || 16)}px)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={targetBlock.type === "multipleInfoBox" ? (targetBlock.boxStyle?.padding || 20) : (targetBlock.cardStyle?.padding || 16)}
              onChange={(e) => updateStyle("padding", parseInt(e.target.value), targetBlock.type === "multipleInfoBox" ? "boxStyle" : "cardStyle")}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Radius ({targetBlock.type === "multipleInfoBox" ? (targetBlock.boxStyle?.borderRadius || 12) : (targetBlock.cardStyle?.borderRadius || 12)}px)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={targetBlock.type === "multipleInfoBox" ? (targetBlock.boxStyle?.borderRadius || 12) : (targetBlock.cardStyle?.borderRadius || 12)}
              onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value), targetBlock.type === "multipleInfoBox" ? "boxStyle" : "cardStyle")}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Border Color</label>
            <input
              type="color"
              value={targetBlock.type === "multipleInfoBox" ? (targetBlock.boxStyle?.borderColor || "#eeeeee") : (targetBlock.cardStyle?.borderColor || "#eeeeee")}
              onChange={(e) => updateStyle("borderColor", e.target.value, targetBlock.type === "multipleInfoBox" ? "boxStyle" : "cardStyle")}
              className="w-8 h-8 rounded border-none p-0 cursor-pointer"
            />
          </div>

          {targetBlock.type === "multipleInfoBox" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Border Width</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={targetBlock.boxStyle?.borderWidth || 0}
                  onChange={(e) => updateStyle("borderWidth", parseInt(e.target.value), "boxStyle")}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Top Border Width</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={targetBlock.boxStyle?.topBorderWidth || 0}
                  onChange={(e) => updateStyle("topBorderWidth", parseInt(e.target.value), "boxStyle")}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Top Border Color</label>
                <input
                  type="color"
                  value={targetBlock.boxStyle?.topBorderColor || "#10b981"}
                  onChange={(e) => updateStyle("topBorderColor", e.target.value, "boxStyle")}
                  className="w-8 h-8 rounded border-none p-0 cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Separator Color</label>
                <input
                  type="color"
                  value={targetBlock.boxStyle?.separatorColor || "#e5e7eb"}
                  onChange={(e) => updateStyle("separatorColor", e.target.value, "boxStyle")}
                  className="w-8 h-8 rounded border-none p-0 cursor-pointer"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="showSeparators"
                  checked={targetBlock.boxStyle?.showSeparators || false}
                  onChange={(e) => updateStyle("showSeparators", e.target.checked, "boxStyle")}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showSeparators" className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer">Show Vertical Separators</label>
              </div>
            </>
          )}

          {targetBlock.type !== "multipleInfoBox" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Card Min Width</label>
              <input
                type="text"
                placeholder="e.g. 200 or 300"
                value={targetBlock.cardStyle?.minWidth || ""}
                onChange={(e) => updateStyle("minWidth", e.target.value, "cardStyle")}
                className="text-xs border rounded p-1 w-full h-8"
              />
            </div>
          )}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Shadow</label>
            <input
              type="text"
              placeholder="e.g. 0 4px 10px rgba(0,0,0,0.1)"
              value={targetBlock.type === "multipleInfoBox" ? (targetBlock.boxStyle?.boxShadow || "") : (targetBlock.cardStyle?.boxShadow || "")}
              onChange={(e) => updateStyle("boxShadow", e.target.value, targetBlock.type === "multipleInfoBox" ? "boxStyle" : "cardStyle")}
              className="text-xs border rounded p-1 w-full h-8"
            />
          </div>

          {targetBlock.type === "multipleInfoBox" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Title Color</label>
                <input type="color" value={targetBlock.boxStyle?.titleColor || "#111827"} onChange={(e) => updateStyle("titleColor", e.target.value, "boxStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Label Color</label>
                <input type="color" value={targetBlock.boxStyle?.labelColor || "#6b7280"} onChange={(e) => updateStyle("labelColor", e.target.value, "boxStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Value Color</label>
                <input type="color" value={targetBlock.boxStyle?.valueColor || "#111827"} onChange={(e) => updateStyle("valueColor", e.target.value, "boxStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Title Size</label>
                <input type="number" value={targetBlock.boxStyle?.titleFontSize || 18} onChange={(e) => updateStyle("titleFontSize", parseInt(e.target.value), "boxStyle")} className="text-xs border rounded p-1 w-full h-8" />
              </div>
            </>
          )}

          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Content Alignment</label>
            <div className="flex bg-white rounded border border-gray-200 p-1 gap-1 justify-center h-8 items-center">
              {[{ val: "left", icon: <FaAlignLeft /> }, { val: "center", icon: <FaAlignCenter /> }, { val: "right", icon: <FaAlignRight /> }].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => updateStyle("textAlign", opt.val, targetBlock.type === "multipleInfoBox" ? "boxStyle" : "cardStyle")}
                  className={`p-1 rounded ${(targetBlock.type === "multipleInfoBox" ? targetBlock.boxStyle?.textAlign : targetBlock.cardStyle?.textAlign) === opt.val ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>

          {targetBlock.type === "multipleInfoBox" && (
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Item Layout (Label/Value)</label>
              <div className="flex gap-2">
                <select
                  value={targetBlock.boxStyle?.itemLayout || "stacked"}
                  onChange={(e) => updateStyle("itemLayout", e.target.value, "boxStyle")}
                  className="text-xs border rounded p-1 bg-white h-8 flex-1"
                >
                  <option value="stacked">Stacked (Default)</option>
                  <option value="inline">Inline (Side-by-Side)</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="4"
                  placeholder="Cols"
                  value={targetBlock.boxStyle?.columns || 1}
                  onChange={(e) => updateStyle("columns", parseInt(e.target.value), "boxStyle")}
                  className="text-xs border rounded p-1 w-16 h-8"
                  title="Items per Row"
                />
              </div>
            </div>
          )}

        </Section>
      )
      }

      <Section id="cardContent" title="Card Content" icon={<FaHeading />}>
        {/* Image Controls */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Image Height</label>
          <input
            type="text"
            placeholder="e.g. 150 or 200px"
            value={targetBlock.cardImageStyle?.height || ""}
            onChange={(e) => updateStyle("height", e.target.value, "cardImageStyle")}
            className="text-xs border rounded p-1 w-full h-8"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Image Width</label>
          <input
            type="text"
            placeholder="e.g. 100% or 150"
            value={targetBlock.cardImageStyle?.width || ""}
            onChange={(e) => updateStyle("width", e.target.value, "cardImageStyle")}
            className="text-xs border rounded p-1 w-full h-8"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Image Fit</label>
          <select
            value={targetBlock.cardImageStyle?.objectFit || "cover"}
            onChange={(e) => updateStyle("objectFit", e.target.value, "cardImageStyle")}
            className="text-xs border rounded p-1 bg-white h-8"
          >
            <option value="cover">Cover (Fill)</option>
            <option value="contain">Contain (Show All)</option>
            <option value="fill">Stretch</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Img Radius</label>
          <input type="number" value={parseInt(targetBlock.cardImageStyle?.borderRadius) || 8} onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value), "cardImageStyle")} className="text-xs border rounded p-1 w-full h-8" />
        </div>

        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Image Alignment</label>
          <div className="flex bg-white rounded border border-gray-200 p-1 gap-1 justify-center h-8 items-center">
            {[
              { val: "0 auto 0 0", icon: <FaAlignLeft />, label: "Left" },
              { val: "0 auto", icon: <FaAlignCenter />, label: "Center" },
              { val: "0 0 0 auto", icon: <FaAlignRight />, label: "Right" }
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => updateStyle("margin", opt.val, "cardImageStyle")}
                className={`flex-1 flex items-center justify-center gap-1 text-[9px] py-1 rounded ${targetBlock.cardImageStyle?.margin === opt.val ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Img Margin T</label>
          <input type="number" value={parseInt(targetBlock.cardImageStyle?.marginTop) || 0} onChange={(e) => updateStyle("marginTop", parseInt(e.target.value), "cardImageStyle")} className="text-xs border rounded p-1 w-full h-8" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Img Margin B</label>
          <input type="number" value={parseInt(targetBlock.cardImageStyle?.marginBottom) || 16} onChange={(e) => updateStyle("marginBottom", parseInt(e.target.value), "cardImageStyle")} className="text-xs border rounded p-1 w-full h-8" />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Title Size</label>
          <input type="number" value={targetBlock.cardTitleStyle?.fontSize || 16} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "cardTitleStyle")} className="text-xs border rounded p-1 w-full h-8" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Title Color</label>
          <input type="color" value={targetBlock.cardTitleStyle?.textColor || "#000000"} onChange={(e) => updateStyle("textColor", e.target.value, "cardTitleStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
        </div>
        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Desc Size</label>
          <input type="number" value={targetBlock.cardDescStyle?.fontSize || 14} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "cardDescStyle")} className="text-xs border rounded p-1 w-full h-8" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Desc Color</label>
          <input type="color" value={targetBlock.cardDescStyle?.textColor || "#666666"} onChange={(e) => updateStyle("textColor", e.target.value, "cardDescStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
        </div>
      </Section>

      {/* Spacing & Layout */}
      <Section id="spacing" title="Spacing & Layout" icon={<FaLayerGroup />}>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Padding ({targetBlock?.style?.padding || 0}px)</label>
          <input type="range" min="0" max="100" value={targetBlock?.style?.padding || 0} onChange={(e) => updateStyle("padding", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Margin Top</label>
          <input type="number" value={targetBlock?.style?.marginTop} onChange={(e) => updateStyle("marginTop", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" placeholder="px" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Margin Btm</label>
          <input type="number" value={targetBlock?.style?.marginBottom} onChange={(e) => updateStyle("marginBottom", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" placeholder="px" />
        </div>
        {targetBlock?.type !== "cardRow" && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Display</label>
            <select value={targetBlock?.style?.display || "block"} onChange={(e) => updateStyle("display", e.target.value)} className="text-xs border rounded p-1 bg-white w-full h-8">
              <option value="block">Block</option>
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
            </select>
          </div>
        )}
        {(targetBlock?.style?.display === "flex" || targetBlock?.style?.display === "grid") && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Direction</label>
              <select value={targetBlock?.style?.flexDirection || "row"} onChange={(e) => updateStyle("flexDirection", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
                <option value="row">Row</option>
                <option value="column">Column</option>
                <option value="row-reverse">Row Reverse</option>
                <option value="column-reverse">Column Reverse</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Gap</label>
              <input type="number" value={targetBlock?.style?.gap} onChange={(e) => updateStyle("gap", parseInt(e.target.value))} className="text-xs border rounded p-1 w-full h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Align Items</label>
              <select value={targetBlock?.style?.alignItems || "stretch"} onChange={(e) => updateStyle("alignItems", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
                <option value="stretch">Stretch</option>
                <option value="center">Center</option>
                <option value="flex-start">Start</option>
                <option value="flex-end">End</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Justify Content</label>
              <select value={targetBlock?.style?.justifyContent || "start"} onChange={(e) => updateStyle("justifyContent", e.target.value)} className="text-xs border rounded p-1 w-full h-8">
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
            <input type="color" value={targetBlock?.style?.backgroundColor || "#ffffff"} onChange={(e) => updateStyle("backgroundColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Background Image</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Image URL"
              value={targetBlock?.style?.backgroundImage?.replace(/url\(["']?|["']?\)/g, '') || ""}
              onChange={(e) => updateStyle("backgroundImage", e.target.value ? `url("${e.target.value}")` : "")}
              className="text-xs border rounded p-1 flex-1 h-8"
            />
            <input
              id={`bg-img-upload-${targetBlock.id}`}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateStyle("backgroundImage", `url("${URL.createObjectURL(file)}")`);
              }}
            />
            <label htmlFor={`bg-img-upload-${targetBlock.id}`} className="bg-blue-50 text-blue-600 p-2 rounded cursor-pointer hover:bg-blue-100 transition h-8 flex items-center justify-center">
              <FaImage />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">BG Size</label>
          <select value={targetBlock?.style?.backgroundSize || "cover"} onChange={(e) => updateStyle("backgroundSize", e.target.value)} className="text-xs border rounded p-1 bg-white h-8">
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="auto">Auto</option>
            <option value="100% 100%">Stretch</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">BG Position</label>
          <select value={targetBlock?.style?.backgroundPosition || "center"} onChange={(e) => updateStyle("backgroundPosition", e.target.value)} className="text-xs border rounded p-1 bg-white h-8">
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
            <input type="color" value={targetBlock?.style?.borderColor || "#000000"} onChange={(e) => updateStyle("borderColor", e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Radius ({targetBlock?.style?.borderRadius || 0})</label>
          <input type="range" min="0" max="50" value={targetBlock?.style?.borderRadius || 0} onChange={(e) => updateStyle("borderRadius", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Border Width</label>
          <input type="range" min="0" max="20" value={targetBlock?.style?.borderWidth || 0} onChange={(e) => updateStyle("borderWidth", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Box Shadow</label>
          <input type="text" placeholder="e.g. 0 4px 6px rgba(0,0,0,0.1)" value={targetBlock?.style?.boxShadow || ""} onChange={(e) => updateStyle("boxShadow", e.target.value)} className="text-xs border rounded p-1 w-full h-8" />
        </div>
      </Section>

      {/* Advanced / Custom CSS */}
      <Section id="advanced" title="Advanced" icon={<FaArrowsAltV />}>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Width / Max-Width</label>
          <div className="flex gap-2">
            <input placeholder="Width (100%)" value={targetBlock?.style?.width} onChange={(e) => updateStyle("width", e.target.value)} className="text-xs border rounded p-1 w-1/2 h-8" />
            <input placeholder="Max Width" value={targetBlock?.style?.maxWidth} onChange={(e) => updateStyle("maxWidth", e.target.value)} className="text-xs border rounded p-1 w-1/2 h-8" />
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Height</label>
          <input placeholder="Height (auto)" value={targetBlock?.style?.height} onChange={(e) => updateStyle("height", e.target.value)} className="text-xs border rounded p-1 w-full h-8" />
        </div>
        {(targetBlock?.type === "image" || targetBlock?.type === "heroSection" || targetBlock?.type === "customSection") && (
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Image Fit (Object Fit)</label>
            <select value={targetBlock?.style?.objectFit || "cover"} onChange={(e) => updateStyle("objectFit", e.target.value)} className="text-xs border rounded p-1 bg-white w-full h-8">
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
        targetBlock?.type === "footerBlock" && (
          <>
            <Section id="footerSettings" title="Footer Settings" icon={<FaCog />}>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Logo URL</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={targetBlock.logoUrl || targetBlock.style?.logoUrl || ""}
                    onChange={(e) => updateStyle("logoUrl", e.target.value, true)}
                    className="text-xs border rounded p-1 flex-1 h-8"
                    placeholder="https://..."
                  />
                  <input
                    id={`footer-logo-upload-${targetBlock.id}`}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateStyle("logoUrl", URL.createObjectURL(file), true);
                    }}
                  />
                  <label htmlFor={`footer-logo-upload-${targetBlock.id}`} className="bg-blue-50 text-blue-600 p-2 rounded cursor-pointer hover:bg-blue-100 transition h-8 flex items-center justify-center">
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
                <label className="text-[10px] font-bold text-gray-400 uppercase">Logo Width ({targetBlock?.style?.logoWidth || 120}px)</label>
                <input type="range" min="50" max="400" value={targetBlock?.style?.logoWidth || 120} onChange={(e) => updateStyle("logoWidth", parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Shop Text</label>
                <input type="text" value={targetBlock.shopText || targetBlock.style?.shopText || "Shop Online"} onChange={(e) => updateStyle("shopText", e.target.value, true)} className="text-xs border rounded p-1 w-full h-8" />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Shop URL</label>
                <input type="text" value={targetBlock.shopLink || targetBlock.style?.shopLink || ""} onChange={(e) => updateStyle("shopLink", e.target.value, true)} className="text-xs border rounded p-1 w-full h-8" placeholder="https://..." />
              </div>
            </Section>
            <Section id="bottomBarStyles" title="Footer Bottom Style" icon={<FaBorderAll />}>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Background</label>
                <input type="color" value={targetBlock.bottomBarStyle?.backgroundColor || "#041b5c"} onChange={(e) => updateStyle("backgroundColor", e.target.value, "bottomBarStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Text Size ({targetBlock.bottomBarStyle?.fontSize || 12}px)</label>
                <input type="range" min="8" max="24" value={targetBlock.bottomBarStyle?.fontSize || 12} onChange={(e) => updateStyle("fontSize", parseInt(e.target.value), "bottomBarStyle")} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Border Top</label>
                <div className="flex gap-2 items-center text-xs">
                  <input type="color" value={targetBlock.bottomBarStyle?.borderColor || "rgba(255,255,255,0.1)"} onChange={(e) => updateStyle("borderColor", e.target.value, "bottomBarStyle")} className="w-8 h-8 rounded border-none p-0 cursor-pointer" />
                  <input type="text" placeholder="1px solid rgba(255,255,255,0.1)" value={targetBlock.bottomBarStyle?.borderTop || "1px solid"} onChange={(e) => updateStyle("borderTop", e.target.value, "bottomBarStyle")} className="border rounded p-1 flex-1 h-8" />
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
              value={targetBlock?.style?.link || ""}
              onChange={(e) => updateStyle("link", e.target.value)}
              className="text-xs border rounded p-1 flex-1 h-8"
            />
            <select
              value={targetBlock?.style?.linkTarget || "_self"}
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
      className={`relative group ${isSelected ? "ring-2 ring-blue-500" : ""} block-component block-${block.type} block-${block.id}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect();
      }}
    >
      <div className="relative z-10 flex items-center justify-between gap-4 flex-nowrap">
        {/* 1. Logo */}
        <div className="flex-shrink-0">
          <img
            src={block.style?.logoUrl || block.logoUrl || "/DashboardIcons/sss-logo.png"}
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
            href={block.style?.shopLink || block.shopLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-[#062375] px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl hover:bg-gray-100 transition whitespace-nowrap"
          >
            <FaShoppingCart size={16} /> {block.style?.shopText || block.shopText || "Shop Online"}
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

  if (!style.borderRadius) containerStyle.borderRadius = "16px";
  if (!style.padding) containerStyle.padding = "20px";
  if (!style.gap) containerStyle.gap = "16px";
  if (!style.display) containerStyle.display = "flex";
  if (!style.border && !style.borderWidth) containerStyle.border = "1px solid #e5e7eb";

  return (
    <div
      className={`block-component block-${block.type} block-${block.id}`}
      style={{
        ...containerStyle,
        display: style.display || "flex",
        flexWrap: "wrap",
        flexDirection: style.flexDirection || "column",
        gap: `${style.gap !== undefined ? style.gap : 16}px`
      }}
    >
      {(block.items || []).map((item, i) => {
        const columns = style.columns || "auto";
        const gap = style.gap !== undefined ? style.gap : 16;
        const isGrid = style.display === "grid";

        const flexBasis = !isGrid && columns !== "auto"
          ? `calc(100% / ${columns} - ${(gap * (columns - 1)) / columns}px)`
          : undefined;

        return (
          <div
            key={i}
            className={!readOnly ? "group relative" : ""}
            style={{
              flex: isGrid ? undefined : (style.flexDirection === "row"
                ? (columns === "auto" ? "1 1 0px" : `0 0 ${flexBasis}`)
                : "1 1 auto"),
              minWidth: isGrid ? undefined : (style.flexDirection === "row"
                ? (columns === "auto" ? (readOnly ? "80px" : "100px") : "auto")
                : "100%"),
              maxWidth: isGrid ? undefined : (style.flexDirection === "row" && columns !== "auto" ? flexBasis : "100%"),
            }}
          >
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
                <FaCopy size={10} />
              </button>
            )}

            {!readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newItems = (block.items || []).filter((_, idx) => idx !== i);
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
                  <div style={{ textAlign: 'left', fontWeight: style.labelFontWeight || 800, fontSize: style.labelFontSize ? `${style.labelFontSize}px` : "14px", color: style.labelColor || "#34353B", marginBottom: "6px", whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
                    {item.label}
                  </div>
                  <div style={{ textAlign: 'left', fontSize: style.valueFontSize ? `${style.valueFontSize}px` : "14px", color: style.valueColor || "#111827", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word", width: "100%" }} dangerouslySetInnerHTML={{ __html: item.value || "" }} />
                </a>
              ) : (
                <>
                  <div style={{ textAlign: 'left', fontWeight: style.labelFontWeight || 800, fontSize: style.labelFontSize ? `${style.labelFontSize}px` : "14px", color: style.labelColor || "#111827", marginBottom: "6px", whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
                    {item.label}
                  </div>
                  <div style={{ textAlign: 'left', fontSize: style.valueFontSize ? `${style.valueFontSize}px` : "14px", color: style.valueColor || "#111827", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word", width: "100%" }} dangerouslySetInnerHTML={{ __html: item.value || "" }} />
                </>
              )
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                <VariableTextarea
                  value={item.label || ""}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[i] = { ...newItems[i], label: e.target.value };
                    update("items", newItems);
                  }}
                  className="w-full text-xs font-bold bg-transparent outline-none resize-none overflow-hidden pb-1"
                  style={{ color: style.labelColor || "#34353B" }}
                  placeholder="Label"
                  showVariables={false}
                />
                <VariableTextarea
                  value={item.value || ""}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[i] = { ...newItems[i], value: e.target.value };
                    update("items", newItems);
                  }}
                  className="w-full text-xs bg-transparent outline-none resize-none overflow-hidden"
                  style={{ color: style.valueColor || "#111827" }}
                  placeholder="Value"
                  showVariables={false}
                />
                <input
                  value={item.link || ""}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
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

      {!readOnly && (
        <button
          onClick={() => update("items", [...(block.items || []), { label: "Label", value: "Value" }])}
          className="text-xl font-bold text-gray-400 hover:text-blue-500"
        >
          +
        </button>
      )}
    </div>
  );
};

const MultipleInfoBoxRenderer = ({ block, update, readOnly }) => {
  const style = block.style || {};
  const boxStyle = block.boxStyle || {};

  const isGrid = style.display === "grid";
  const isFlex = style.display === "flex";

  const containerStyle = {
    ...getCommonStyles(block),
    display: style.display || "grid",
    // Grid Props
    gridTemplateColumns: isGrid ? `repeat(${style.columns || 1}, minmax(0, 1fr))` : undefined,
    gap: style.gap ? `${style.gap}px` : "16px",
    // Flex Props
    flexDirection: isFlex ? (style.flexDirection || "row") : undefined,
    flexWrap: isFlex ? "wrap" : undefined,
    justifyContent: isFlex ? (style.justifyContent || "flex-start") : undefined,
    alignItems: isFlex ? (style.alignItems || "stretch") : undefined,
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
            borderTop: boxStyle.topBorderWidth ? `${boxStyle.topBorderWidth}px solid ${boxStyle.topBorderColor || boxStyle.borderColor || "#10b981"}` : undefined,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            textAlign: boxStyle.textAlign || "left",
            width: isFlex ? (style.flexDirection === "column" ? "100%" : undefined) : undefined,
            flex: isFlex ? "1 1 0px" : undefined, // Distribute evenly in flex
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
            {(box.items || []).map((item, idx) => {
              // Calculate Separator Logic
              const cols = boxStyle.columns || 1;
              const isLastInRow = (idx + 1) % cols === 0;
              const isLastItem = idx === (box.items || []).length - 1;
              const showSeparator = boxStyle.showSeparators && !isLastInRow && !isLastItem;

              return (
                <div
                  key={idx}
                  className={!readOnly
                    ? `relative group/item gap-1 ${boxStyle.itemLayout === 'inline' ? 'flex flex-row justify-between items-center' : 'flex flex-col'}`
                    : `gap-1 ${boxStyle.itemLayout === 'inline' ? 'flex flex-row justify-between items-center' : 'flex flex-col'}`
                  }
                  style={{
                    borderRight: showSeparator ? `1px solid ${boxStyle.separatorColor || "#e5e7eb"}` : undefined,
                    paddingRight: showSeparator ? "16px" : undefined,
                    marginRight: showSeparator ? "0px" : undefined
                  }}
                >
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
                    <>
                      <div style={{
                        fontWeight: 700,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        color: boxStyle.labelColor || "#6b7280",
                        marginBottom: boxStyle.itemLayout === 'inline' ? "0" : "2px"
                      }}>{item.label}</div>
                      <div style={{
                        fontSize: "14px",
                        color: boxStyle.valueColor || "#111827",
                        textAlign: boxStyle.itemLayout === 'inline' ? "right" : "left"
                      }} dangerouslySetInnerHTML={{ __html: item.value || "" }} />
                    </>
                  ) : (
                    <>
                      <input
                        className="text-[10px] font-bold uppercase bg-transparent outline-none"
                        value={item.label || ""}
                        onChange={(e) => updateBoxItem(box.id, idx, "label", e.target.value)}
                        placeholder="Label"
                        style={{
                          width: boxStyle.itemLayout === 'inline' ? '40%' : '100%',
                          color: boxStyle.labelColor || "#6b7280"
                        }}
                      />
                      <VariableTextarea
                        className="text-sm bg-transparent outline-none resize-none overflow-hidden"
                        value={item.value || ""}
                        onChange={(e) => updateBoxItem(box.id, idx, "value", e.target.value)}
                        placeholder="Value"
                        showVariables={false}
                        style={{
                          width: boxStyle.itemLayout === 'inline' ? '55%' : '100%',
                          textAlign: boxStyle.itemLayout === 'inline' ? 'right' : 'left',
                          color: boxStyle.valueColor || "#111827"
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}

            {/* Add Item Button */}
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
    let items = convertHtmlToBlocks(block.content);
    if (items.length === 0) return;

    // ✅ RECURSIVE FLATTEN: Strip wrapper grids (1-column grids) to expose content
    const flattenBlocks = (list) => {
      return list.flatMap(b => {
        if (b.type === "sectionGrid" && b.columns?.length === 1) {
          return flattenBlocks(b.columns[0]); // Recursively unwrap
        }
        return b;
      });
    };

    items = flattenBlocks(items);

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
        <div style={getCommonStyles(block)} className={`${!readOnly ? "relative min-h-[300px] flex flex-col justify-center overflow-hidden hover:shadow-lg transition-shadow duration-300" : ""} block-component block-${block.type} block-${block.id}`}>
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
        <div style={{ ...getCommonStyles(block) }} className={`block-component block-${block.type} block-${block.id}`}>
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
        <div style={{ ...getCommonStyles(block) }} className={`block-component block-${block.type} block-${block.id}`}>
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

    // INFO BOX
    if (block?.type === "infoBox") {
      return (
        <InfoBoxRenderer
          block={block}
          update={update}
          readOnly={readOnly}
        />
      );
    }



    // INPUT (Original implementation, no StyleControls added as per new code)
    if (block?.type === "input")
      return (
        <input
          className={`w-full border p-3 border-gray-200 rounded-md block-component block-${block.type} block-${block.id}`}
          placeholder={block.placeholder}
        />
      );


    // DIVIDER
    if (block?.type === "divider") {
      return (
        <div style={{ ...getCommonStyles(block) }} className={`block-component block-${block.type} block-${block.id}`}>
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
        <div style={{ ...getCommonStyles(block) }} className={`block-component block-${block.type} block-${block.id}`}>
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
        <div style={{ ...getCommonStyles(block) }} className={`block-component block-${block.type} block-${block.id}`}>
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
        <div style={getCommonStyles(block)} className={`block-component block-${block.type} block-${block.id}`}>
          <div
            style={{
              display: block.style?.display === "flex" ? "flex" : "grid",
              flexDirection: block.style?.flexDirection,
              gap: block.style?.gap !== undefined ? `${block.style.gap}px` : "16px",

              gridTemplateColumns: block.style?.display === "flex" ? undefined : (block.style?.gridTemplateColumns || (block.style?.columns && block.style?.columns !== "auto" ? `repeat(${block.style.columns}, minmax(0, 1fr))` : (readOnly
                ? `repeat(${block.columns.length}, minmax(0, 1fr))`
                : `repeat(${block.columns.length}, minmax(200px, 1fr)) 60px`))),
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
                            { type: "cardRow", icon: <FaLayerGroup />, label: "Cards" },
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
                          {["text", "image", "heading", "btn", "cardRow", "infoBox", "noteSection"].map((t) => (
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
                    <div key={child.id} style={readOnly ? { padding: '4px' } : {}} className={!readOnly ? "p-1 relative group hover:z-50 transition-all" : ""}>
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
          className={`block-component block-${block.type} block-${block.id}`}
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
                boxShadow: block.cardStyle?.boxShadow || "0 2px 4px rgba(0,0,0,0.05)",
                textAlign: block.cardStyle?.textAlign || "left",

                // Flex Layout
                flex: columns && columns !== "auto" ? `0 0 ${flexBasis}` : "1 1 auto",
                maxWidth: columns && columns !== "auto" ? flexBasis : undefined,
                minWidth: parseUnit(block.cardStyle?.minWidth) || (columns && columns !== "auto" ? "auto" : "200px"),

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
                          width: parseUnit(block.cardImageStyle?.width) || "100%",
                          height: parseUnit(block.cardImageStyle?.height) || "128px",
                          objectFit: block.cardImageStyle?.objectFit || "cover",
                          borderRadius: parseUnit(block.cardImageStyle?.borderRadius) || "8px",
                          marginTop: parseUnit(block.cardImageStyle?.marginTop) || "0px",
                          marginBottom: parseUnit(block.cardImageStyle?.marginBottom) || "16px",
                          margin: block.cardImageStyle?.margin || "0 auto",
                          display: "block"
                        }}
                      />
                    </a>
                  ) : (
                    <img
                      src={card.url}
                      alt=""
                      className={
                        !readOnly
                          ? "rounded-lg"
                          : ""
                      }
                      style={{
                        width: parseUnit(block.cardImageStyle?.width) || "100%",
                        height: parseUnit(block.cardImageStyle?.height) || "128px",
                        objectFit: block.cardImageStyle?.objectFit || "cover",
                        borderRadius: parseUnit(block.cardImageStyle?.borderRadius) || "8px",
                        marginTop: parseUnit(block.cardImageStyle?.marginTop) || "0px",
                        marginBottom: parseUnit(block.cardImageStyle?.marginBottom) || "16px",
                        margin: block.cardImageStyle?.margin || "0 auto",
                        display: "block"
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
                        marginBottom: "4px",
                        textAlign: block.cardStyle?.textAlign || "left"
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
                        textAlign: block.cardStyle?.textAlign || "left"
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
          className={`${!readOnly ? "group" : ""} block-component block-${block.type} block-${block.id}`}
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
        <div style={getCommonStyles(block)} className={`${!readOnly ? "relative group" : ""} block-component block-${block.type} block-${block.id}`}>
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

    // ✅ INFO BOX
    if (block?.type === "infoBox") {
      return (
        <InfoBoxRenderer
          block={block}
          update={update}
          readOnly={readOnly}
        />
      );
    }

    // ✅ MULTIPLE INFO BOX
    if (block?.type === "multipleInfoBox") {
      return (
        <MultipleInfoBoxRenderer
          block={block}
          update={update}
          readOnly={readOnly}
        />
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
      className={`relative cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 rounded-lg shadow-lg z-20' : 'hover:ring-1 hover:ring-blue-100'} block-component block-${block.type} block-${block.id}`}
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