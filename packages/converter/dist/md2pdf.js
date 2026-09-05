import { normalizeLinkHref, pt2mm, resolvePageSize } from "@pdfme/common";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
//#region src/md2pdf.ts
var DEFAULT_PAGE_MARGIN = [
	20,
	15,
	20,
	15
];
var DEFAULT_FONT_SIZE = 10;
var DEFAULT_LINE_HEIGHT = 1.25;
var DEFAULT_FONT_COLOR = "#111827";
var DEFAULT_HEADING_SCALE = {
	1: 2,
	2: 1.65,
	3: 1.35,
	4: 1.15,
	5: 1,
	6: 1
};
var BLOCK_GAP = 4;
var LIST_ITEM_SPACING = 1.4;
var TABLE_HEADER_HEIGHT = 8.5;
var TABLE_ROW_HEIGHT = 7.5;
var IMAGE_HEIGHT = 45;
var CODE_BLOCK_BACKGROUND_COLOR = "#f6f8fa";
var CODE_BLOCK_BORDER_COLOR = "#d0d7de";
var CODE_BLOCK_BORDER_WIDTH = .1;
var CODE_BLOCK_PADDING = {
	top: 2,
	right: 3,
	bottom: 2,
	left: 3
};
var BLOCKQUOTE_BACKGROUND_COLOR = "#f8fafc";
var BLOCKQUOTE_BORDER_COLOR = "#d0d7de";
var BLOCKQUOTE_BORDER_WIDTH = {
	top: 0,
	right: 0,
	bottom: 0,
	left: .8
};
var BLOCKQUOTE_PADDING = {
	top: 2,
	right: 3,
	bottom: 2,
	left: 3
};
var HORIZONTAL_RULE_COLOR = "#d0d7de";
var HORIZONTAL_RULE_HEIGHT = .25;
var TABLE_BORDER_COLOR = "#d0d7de";
var TABLE_CELL_BORDER_WIDTH = .1;
var TABLE_HEAD_BACKGROUND_COLOR = "#f6f8fa";
var TABLE_BODY_ALTERNATE_BACKGROUND_COLOR = "#f9fafb";
var TABLE_CELL_PADDING = 3;
var MARKDOWN_ESCAPE_PATTERN = /[\\*~`[\]()]/g;
var DATA_IMAGE_PATTERN = /^data:image\/(?:png|jpe?g);base64,/i;
var RENDERABLE_BLOCK_TYPES = /* @__PURE__ */ new Set([
	"blockquote",
	"code",
	"heading",
	"html",
	"list",
	"paragraph",
	"table",
	"thematicBreak"
]);
var markdownProcessor = unified().use(remarkParse).use(remarkGfm);
var md2pdf = async (markdown, options = {}) => {
	const root = markdownProcessor.parse(markdown);
	const builder = createBuilder(options);
	root.children.forEach((node) => renderBlock(node, builder));
	return {
		template: {
			basePdf: builder.basePdf,
			schemas: [builder.schemas]
		},
		inputs: [{}]
	};
};
var createBuilder = (options) => {
	const basePdf = options.basePdf ?? createBlankPdf(options);
	const [top, right, bottom, left] = basePdf.padding;
	const headingScale = {
		...DEFAULT_HEADING_SCALE,
		...options.style?.headingScale
	};
	return {
		basePdf,
		contentFrame: {
			x: left,
			y: top,
			width: Math.max(0, basePdf.width - left - right),
			height: Math.max(0, basePdf.height - top - bottom)
		},
		cursorY: top,
		fontName: options.style?.fontName,
		fontSize: options.style?.fontSize ?? DEFAULT_FONT_SIZE,
		lineHeight: options.style?.lineHeight ?? DEFAULT_LINE_HEIGHT,
		fontColor: options.style?.fontColor ?? DEFAULT_FONT_COLOR,
		headingScale,
		nameCounters: {},
		schemas: [],
		usedNames: /* @__PURE__ */ new Set()
	};
};
var createBlankPdf = (options) => {
	const pageSize = resolvePageSize(options.page?.size ?? "A4", options.page?.orientation ?? "portrait");
	return {
		width: pageSize.width,
		height: pageSize.height,
		padding: resolveMargin(options.page?.margin ?? DEFAULT_PAGE_MARGIN)
	};
};
var resolveMargin = (margin) => {
	if (typeof margin === "number") return [
		margin,
		margin,
		margin,
		margin
	];
	if (Array.isArray(margin)) return margin;
	const x = margin.x ?? 0;
	const y = margin.y ?? 0;
	return [
		margin.top ?? y,
		margin.right ?? x,
		margin.bottom ?? y,
		margin.left ?? x
	];
};
var renderBlock = (node, builder) => {
	switch (node.type) {
		case "heading":
			renderHeading(node, builder);
			return;
		case "paragraph":
			renderParagraph(node, builder);
			return;
		case "list":
			renderList(node, builder);
			return;
		case "code":
			renderCode(node, builder);
			return;
		case "blockquote":
			renderBlockquote(node, builder);
			return;
		case "table":
			renderTable(node, builder);
			return;
		case "thematicBreak":
			renderLine(builder);
			return;
		case "html":
		case "definition":
		case "footnoteDefinition":
		case "yaml": return;
		default: renderNestedBlocks(node, builder);
	}
};
var renderNestedBlocks = (node, builder) => {
	if ("children" in node && Array.isArray(node.children)) node.children.forEach((child) => {
		if (isBlockContent(child)) renderBlock(child, builder);
	});
};
var renderHeading = (node, builder) => {
	const depth = Math.min(Math.max(node.depth, 1), 6);
	const content = renderInlineChildren(node.children);
	const fontSize = builder.fontSize * builder.headingScale[depth];
	addTextSchema(builder, {
		name: resolveName(builder, slugify(toPlainText(node)) || `heading_${depth}`),
		content,
		fontSize,
		height: estimateTextHeight(content, fontSize, builder.lineHeight),
		gap: depth <= 1 ? 5 : depth === 2 ? 4.5 : BLOCK_GAP,
		textFormat: "inline-markdown"
	});
};
var renderParagraph = (node, builder) => {
	if (node.children.length === 1 && node.children[0]?.type === "image") {
		renderImage(node.children[0], builder);
		return;
	}
	const content = renderInlineChildren(node.children);
	if (!content.trim()) return;
	addTextSchema(builder, {
		content,
		textFormat: "inline-markdown"
	});
};
var renderList = (node, builder) => {
	const items = collectListItems(node);
	if (items.length === 0) return;
	const fontSize = builder.fontSize;
	const height = items.length * estimateTextHeight("", fontSize, builder.lineHeight) + Math.max(0, items.length - 1) * LIST_ITEM_SPACING;
	addSchema(builder, {
		name: resolveAutoName(builder, "list"),
		type: "list",
		content: JSON.stringify(items),
		position: {
			x: builder.contentFrame.x,
			y: builder.cursorY
		},
		width: builder.contentFrame.width,
		height,
		readOnly: true,
		alignment: "left",
		verticalAlignment: "top",
		fontSize,
		fontName: builder.fontName,
		lineHeight: builder.lineHeight,
		characterSpacing: 0,
		fontColor: builder.fontColor,
		backgroundColor: "",
		listStyle: node.ordered ? "ordered" : "bullet",
		markerWidth: 6,
		markerGap: 2,
		indentSize: 6,
		itemSpacing: LIST_ITEM_SPACING,
		textFormat: "inline-markdown",
		overflow: "expand"
	});
};
var renderCode = (node, builder) => {
	const content = node.value;
	addTextSchema(builder, {
		content,
		backgroundColor: CODE_BLOCK_BACKGROUND_COLOR,
		borderColor: CODE_BLOCK_BORDER_COLOR,
		borderWidth: resolveBoxSides(CODE_BLOCK_BORDER_WIDTH),
		padding: CODE_BLOCK_PADDING,
		textFormat: "plain"
	});
};
var renderBlockquote = (node, builder) => {
	const content = node.children.map((child) => blockToMarkdown(child)).join("\n").trim();
	if (!content.trim()) return;
	addTextSchema(builder, {
		content,
		backgroundColor: BLOCKQUOTE_BACKGROUND_COLOR,
		borderColor: BLOCKQUOTE_BORDER_COLOR,
		borderWidth: BLOCKQUOTE_BORDER_WIDTH,
		padding: BLOCKQUOTE_PADDING,
		textFormat: "inline-markdown"
	});
};
var renderTable = (node, builder) => {
	const rows = node.children.map(tableRowToStrings).filter((row) => row.length > 0);
	if (rows.length === 0) return;
	const columnCount = Math.max(...rows.map((row) => row.length));
	const head = normalizeRowLength(rows[0], columnCount);
	const body = rows.slice(1).map((row) => normalizeRowLength(row, columnCount));
	const height = TABLE_HEADER_HEIGHT + Math.max(1, body.length) * TABLE_ROW_HEIGHT;
	const columnWidths = Array.from({ length: columnCount }, () => 100 / columnCount);
	addSchema(builder, {
		name: resolveAutoName(builder, "table"),
		type: "table",
		content: JSON.stringify(body),
		position: {
			x: builder.contentFrame.x,
			y: builder.cursorY
		},
		width: builder.contentFrame.width,
		height,
		readOnly: true,
		showHead: true,
		repeatHead: false,
		head,
		headWidthPercentages: columnWidths,
		tableStyles: {
			borderColor: TABLE_BORDER_COLOR,
			borderWidth: .2
		},
		headStyles: {
			...defaultCellStyle(builder),
			backgroundColor: TABLE_HEAD_BACKGROUND_COLOR,
			borderColor: TABLE_BORDER_COLOR,
			borderWidth: resolveBoxSides(TABLE_CELL_BORDER_WIDTH)
		},
		bodyStyles: {
			...defaultCellStyle(builder),
			borderColor: TABLE_BORDER_COLOR,
			borderWidth: resolveBoxSides(TABLE_CELL_BORDER_WIDTH),
			alternateBackgroundColor: TABLE_BODY_ALTERNATE_BACKGROUND_COLOR
		},
		columnStyles: {}
	});
};
var renderImage = (node, builder) => {
	if (!DATA_IMAGE_PATTERN.test(node.url)) {
		const link = normalizeLinkHref(node.url);
		const label = node.alt || node.title || node.url;
		addTextSchema(builder, {
			content: link ? `[${escapeInlineMarkdown(label)}](${escapeLinkDestination(link)})` : escapeInlineMarkdown(label),
			textFormat: "inline-markdown"
		});
		return;
	}
	addSchema(builder, {
		name: resolveAutoName(builder, "image"),
		type: "image",
		content: node.url,
		position: {
			x: builder.contentFrame.x,
			y: builder.cursorY
		},
		width: builder.contentFrame.width,
		height: IMAGE_HEIGHT,
		readOnly: true
	});
};
var renderLine = (builder) => {
	addSchema(builder, {
		name: resolveAutoName(builder, "line"),
		type: "line",
		position: {
			x: builder.contentFrame.x,
			y: builder.cursorY
		},
		width: builder.contentFrame.width,
		height: HORIZONTAL_RULE_HEIGHT,
		readOnly: true,
		color: HORIZONTAL_RULE_COLOR
	});
};
var addTextSchema = (builder, options) => {
	const fontSize = options.fontSize ?? builder.fontSize;
	const content = options.content;
	const boxVerticalInset = getBoxVerticalInset(options);
	addSchema(builder, {
		name: options.name ?? resolveAutoName(builder, "text"),
		type: "text",
		content,
		position: {
			x: options.x ?? builder.contentFrame.x,
			y: builder.cursorY
		},
		width: options.width ?? builder.contentFrame.width,
		height: (options.height ?? estimateTextHeight(content, fontSize, builder.lineHeight)) + boxVerticalInset,
		readOnly: true,
		alignment: "left",
		verticalAlignment: "top",
		fontSize,
		fontName: builder.fontName,
		lineHeight: builder.lineHeight,
		characterSpacing: 0,
		fontColor: builder.fontColor,
		backgroundColor: options.backgroundColor ?? "",
		borderColor: options.borderColor,
		borderWidth: options.borderWidth,
		padding: options.padding,
		textFormat: options.textFormat ?? "plain",
		overflow: "expand"
	}, options.gap);
};
var addSchema = (builder, schema, gap = BLOCK_GAP) => {
	builder.schemas.push(schema);
	builder.cursorY += schema.height + gap;
};
var collectListItems = (node, level = 0) => node.children.flatMap((item) => {
	const prefix = typeof item.checked === "boolean" ? `[${item.checked ? "x" : " "}] ` : "";
	const text = item.children.filter((child) => child.type !== "list").map((child) => blockToMarkdown(child)).join(" ").trim();
	return [`${"	".repeat(level)}${prefix}${text}`, ...item.children.filter(isList).flatMap((child) => collectListItems(child, level + 1))];
});
var blockToMarkdown = (node) => {
	switch (node.type) {
		case "paragraph":
		case "heading": return renderInlineChildren(node.children);
		case "code": return node.value;
		case "list": return collectListItems(node).join("\n");
		case "blockquote": return node.children.map(blockToMarkdown).join("\n");
		case "table": return node.children.map((row) => tableRowToStrings(row).join(" | ")).join("\n");
		case "thematicBreak": return "---";
		default: return "";
	}
};
var renderInlineChildren = (children) => children.map(renderInline).join("");
var renderInline = (node) => {
	switch (node.type) {
		case "text": return escapeInlineMarkdown(node.value);
		case "emphasis": return `*${renderInlineChildren(node.children)}*`;
		case "strong": return `**${renderInlineChildren(node.children)}**`;
		case "delete": return `~~${renderInlineChildren(node.children)}~~`;
		case "inlineCode": return renderInlineCode(node);
		case "break": return "\n";
		case "link": return renderLink(node);
		case "image": return renderInlineImage(node);
		case "html": return "";
		default: return "children" in node && Array.isArray(node.children) ? renderInlineChildren(node.children) : "";
	}
};
var renderInlineCode = (node) => `\`${node.value.replaceAll("`", "\\`")}\``;
var renderLink = (node) => {
	const label = renderInlineChildren(node.children);
	const href = normalizeLinkHref(node.url);
	if (!href) return label;
	return `[${label}](${escapeLinkDestination(href)})`;
};
var renderInlineImage = (node) => {
	const label = node.alt || node.title || node.url;
	const href = normalizeLinkHref(node.url);
	if (!href) return escapeInlineMarkdown(label);
	return `[${escapeInlineMarkdown(label)}](${escapeLinkDestination(href)})`;
};
var tableRowToStrings = (row) => row.children.map(tableCellToString);
var tableCellToString = (cell) => cell.children.map(inlineToPlainText).join("");
var normalizeRowLength = (row, columnCount) => Array.from({ length: columnCount }, (_, index) => row[index] ?? "");
var defaultCellStyle = (builder) => ({
	fontName: builder.fontName,
	alignment: "left",
	verticalAlignment: "middle",
	fontSize: builder.fontSize,
	lineHeight: builder.lineHeight,
	characterSpacing: 0,
	fontColor: builder.fontColor,
	backgroundColor: "#ffffff",
	borderColor: TABLE_BORDER_COLOR,
	borderWidth: resolveBoxSides(TABLE_CELL_BORDER_WIDTH),
	padding: resolveBoxSides(TABLE_CELL_PADDING)
});
var resolveBoxSides = (value) => {
	if (typeof value === "number") return {
		top: value,
		right: value,
		bottom: value,
		left: value
	};
	const x = value.x ?? 0;
	const y = value.y ?? 0;
	return {
		top: value.top ?? y,
		right: value.right ?? x,
		bottom: value.bottom ?? y,
		left: value.left ?? x
	};
};
var getBoxVerticalInset = (value) => (value.borderWidth?.top ?? 0) + (value.borderWidth?.bottom ?? 0) + (value.padding?.top ?? 0) + (value.padding?.bottom ?? 0);
var resolveAutoName = (builder, prefix) => {
	let name = "";
	do {
		builder.nameCounters[prefix] = (builder.nameCounters[prefix] ?? 0) + 1;
		name = `${prefix}_${builder.nameCounters[prefix]}`;
	} while (builder.usedNames.has(name));
	builder.usedNames.add(name);
	return name;
};
var resolveName = (builder, baseName) => {
	let name = baseName;
	let index = 0;
	while (builder.usedNames.has(name)) {
		index += 1;
		name = `${baseName}_${index}`;
	}
	builder.usedNames.add(name);
	return name;
};
var estimateTextHeight = (content, fontSize, lineHeight) => {
	const lineCount = Math.max(1, content.split("\n").length);
	return Math.max(4, lineCount * pt2mm(fontSize * lineHeight) + 1);
};
var escapeInlineMarkdown = (value) => value.replace(MARKDOWN_ESCAPE_PATTERN, (match) => `\\${match}`);
var escapeLinkDestination = (href) => encodeURI(href).replace(/[\\()]/g, (match) => `\\${match}`);
var slugify = (value) => value.trim().toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "");
var toPlainText = (node) => node.children.map((child) => {
	if ("value" in child && typeof child.value === "string") return child.value;
	if ("alt" in child && typeof child.alt === "string") return child.alt;
	if ("children" in child && Array.isArray(child.children)) return child.children.map((grandchild) => toPlainInlineText(grandchild)).join("");
	return "";
}).join("");
var toPlainInlineText = (node) => {
	if ("value" in node && typeof node.value === "string") return node.value;
	if ("alt" in node && typeof node.alt === "string") return node.alt;
	if ("children" in node && Array.isArray(node.children)) return node.children.map(toPlainInlineText).join("");
	return "";
};
var inlineToPlainText = (node) => {
	switch (node.type) {
		case "text":
		case "inlineCode": return node.value;
		case "break": return "\n";
		case "image": return node.alt || node.title || node.url;
		case "link":
		case "emphasis":
		case "strong":
		case "delete": return node.children.map(inlineToPlainText).join("");
		case "html": return "";
		default: return "children" in node && Array.isArray(node.children) ? node.children.map(inlineToPlainText).join("") : "";
	}
};
var isBlockContent = (node) => typeof node === "object" && node !== null && "type" in node && typeof node.type === "string" && RENDERABLE_BLOCK_TYPES.has(node.type);
var isList = (node) => node.type === "list";
//#endregion
export { md2pdf };

//# sourceMappingURL=md2pdf.js.map