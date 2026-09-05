import { a as isPdfJsxElement, n as cloneElementWithChildren, o as isPdfJsxFragment, r as createElementNode } from "./node-B6TrQFvN.js";
import { getDefaultFont, isBlankPdf, pt2mm, resolvePageSize } from "@pdfme/common";
import { escapeInlineMarkdown, getVariableNames, measureTextHeight, visitVariables } from "@pdfme/schemas/utils";
//#region src/components.ts
var makeBuiltin = (kind) => (props) => createElementNode(kind, props);
var Document = makeBuiltin("document");
var Page = makeBuiltin("page");
var Static = makeBuiltin("static");
var Header = makeBuiltin("header");
var Footer = makeBuiltin("footer");
var Absolute = makeBuiltin("absolute");
var Stack = makeBuiltin("stack");
var Row = makeBuiltin("row");
var Box = makeBuiltin("box");
var Spacer = makeBuiltin("spacer");
var Text = makeBuiltin("text");
var MultiVariableText = makeBuiltin("multiVariableText");
var Image = makeBuiltin("image");
var Svg = makeBuiltin("svg");
var Rectangle = makeBuiltin("rectangle");
var Ellipse = makeBuiltin("ellipse");
var Line = makeBuiltin("line");
var List = makeBuiltin("list");
var Table = makeBuiltin("table");
var PageBreak = (props) => createElementNode("pagebreak", props);
//#endregion
//#region src/render.ts
var DEFAULT_FONT_SIZE = 10;
var DEFAULT_LINE_HEIGHT = 1;
var DEFAULT_CHARACTER_SPACING = 0;
var DEFAULT_FONT_COLOR = "#000000";
var DEFAULT_VISUAL_HEIGHT = 40;
var DEFAULT_LINE_THICKNESS = .5;
var DEFAULT_LINE_COLOR = "#000000";
var DEFAULT_SHAPE_BORDER_COLOR = "#000000";
var DEFAULT_DYNAMIC_FONT_SIZE = {
	min: 4,
	max: 72,
	fit: "vertical"
};
var renderToTemplate = async (node, options = {}) => {
	validatePageBreakPlacement(node);
	const root = resolveRenderRoot(node);
	validateAbsolutePlacement(root.children);
	validateStaticPlacement(root.children, root.hasDocument);
	const { pages: rawPages, blocks: staticBlocks } = extractDocumentChildren(root);
	const pages = rawPages.map((page) => applyDocumentPageDefaults(page, root.documentProps));
	if (pages.length === 0) throw new Error("@pdfme/jsx: renderToTemplate root must contain at least one <Page>.");
	const firstPageProps = pages[0]?.props;
	const firstMargin = resolveBoxSides(firstPageProps.margin);
	const pageSize = resolvePageSize(firstPageProps.size, firstPageProps.orientation);
	validateConsistentPageProps(pages, pageSize, firstMargin);
	const inputs = {};
	const usedNames = /* @__PURE__ */ new Set();
	const nameCounters = {};
	const font = options.font ?? getDefaultFont();
	const _cache = /* @__PURE__ */ new Map();
	const pageSchemas = [];
	const staticSchemas = [];
	const hasStaticChildren = hasStaticBlocks(staticBlocks);
	if (hasStaticChildren && options.basePdf != null && !isBlankPdf(options.basePdf)) throw new Error("@pdfme/jsx: <Header>, <Footer>, and <Static> are supported only with a blank basePdf.");
	if (hasStaticChildren) await layoutStaticBlocks({
		blocks: staticBlocks,
		margin: firstMargin,
		pageSize,
		staticSchemas,
		inputs,
		usedNames,
		nameCounters,
		defaultFont: firstPageProps.font,
		font,
		_cache
	});
	for (const page of pages) {
		const props = page.props;
		const margin = resolveBoxSides(props.margin);
		const frame = {
			x: margin.left,
			y: margin.top,
			width: pageSize.width - margin.left - margin.right,
			height: pageSize.height - margin.top - margin.bottom
		};
		const ctx = {
			schemas: [],
			inputs,
			usedNames,
			nameCounters,
			defaultFont: props.font,
			font,
			_cache
		};
		await layoutChildren(page.children, frame, "stack", {
			gap: 0,
			alignItems: "stretch",
			justifyContent: "start"
		}, ctx);
		pageSchemas.push(ctx.schemas);
	}
	const basePdf = options.basePdf ?? {
		width: pageSize.width,
		height: pageSize.height,
		padding: [
			firstMargin.top,
			firstMargin.right,
			firstMargin.bottom,
			firstMargin.left
		]
	};
	return {
		template: {
			basePdf: staticSchemas.length > 0 && isBlankPdf(basePdf) ? {
				...basePdf,
				staticSchema: [...basePdf.staticSchema ?? [], ...staticSchemas]
			} : basePdf,
			schemas: pageSchemas
		},
		inputs: [inputs]
	};
};
var flattenChildren = (children) => {
	if (children == null || children === false || children === true) return [];
	if (typeof children === "string" || typeof children === "number") return [children];
	if (Array.isArray(children)) return children.flatMap((child) => flattenChildren(child));
	if (isPdfJsxFragment(children)) return flattenChildren(children.children);
	if (isPdfJsxElement(children)) return [children];
	return [];
};
var childrenToString = (children) => flattenChildren(children).map((child) => {
	if (typeof child === "string" || typeof child === "number") return String(child);
	return childrenToString(child.children);
}).join("");
var splitChildrenByPageBreak = (children) => {
	const segments = [[]];
	for (const child of flattenForSplitting(children)) {
		if (isPdfJsxElement(child) && child.kind === "pagebreak") {
			segments.push([]);
			continue;
		}
		if (isPdfJsxElement(child) && (child.kind === "page" || child.kind === "stack" || child.kind === "box")) {
			const childSegments = splitChildrenByPageBreak(child.children);
			if (childSegments.length === 1) {
				segments[segments.length - 1]?.push(child);
				continue;
			}
			segments[segments.length - 1]?.push(cloneElementWithChildren(child, childSegments[0] ?? []));
			for (let i = 1; i < childSegments.length; i += 1) segments.push([cloneElementWithChildren(child, childSegments[i] ?? [])]);
			continue;
		}
		segments[segments.length - 1]?.push(child);
	}
	return segments;
};
var flattenForSplitting = (children) => {
	if (children == null || children === false || children === true) return [];
	if (Array.isArray(children)) return children.flatMap((child) => flattenForSplitting(child));
	if (isPdfJsxFragment(children)) return flattenForSplitting(children.children);
	return [children];
};
var expandPageBreaks = (node) => splitChildrenByPageBreak(node).flat();
var STATIC_DIRECT_KINDS = /* @__PURE__ */ new Set([
	"header",
	"footer",
	"static"
]);
var createEmptyStaticBlocks = () => ({
	footer: [],
	header: [],
	staticBottom: [],
	staticTop: []
});
var resolveRenderRoot = (node) => {
	const topLevelChildren = flattenChildren(node);
	const documents = topLevelChildren.filter((child) => isPdfJsxElement(child) && child.kind === "document");
	if (documents.length === 0) return {
		children: expandPageBreaks(node),
		hasDocument: false
	};
	if (documents.length > 1) throw new Error("@pdfme/jsx: only one <Document> root is supported.");
	if (topLevelChildren.some((child) => child !== documents[0])) throw new Error("@pdfme/jsx: <Document> must be the only root element.");
	const document = documents[0];
	return {
		children: expandPageBreaks(document.children),
		documentProps: document.props,
		hasDocument: true
	};
};
var extractDocumentChildren = (root) => {
	const blocks = createEmptyStaticBlocks();
	const pages = [];
	for (const child of flattenChildren(root.children)) {
		if (!isPdfJsxElement(child)) continue;
		if (child.kind === "page") {
			pages.push(child);
			continue;
		}
		if (!root.hasDocument || !STATIC_DIRECT_KINDS.has(child.kind)) continue;
		if (child.kind === "header") blocks.header.push(...child.children);
		else if (child.kind === "footer") blocks.footer.push(...child.children);
		else if (child.kind === "static") blocks[getStaticPlacement(child) === "top" ? "staticTop" : "staticBottom"].push(...child.children);
	}
	return {
		pages,
		blocks
	};
};
var applyDocumentPageDefaults = (page, documentProps) => {
	if (!documentProps) return page;
	const { children: _children, ...props } = documentProps;
	return {
		...page,
		props: {
			...props,
			...page.props
		}
	};
};
var hasStaticBlocks = (blocks) => blocks.header.length > 0 || blocks.footer.length > 0 || blocks.staticTop.length > 0 || blocks.staticBottom.length > 0;
var layoutStaticBlocks = async (arg) => {
	const contentWidth = Math.max(0, arg.pageSize.width - arg.margin.left - arg.margin.right);
	const blockFrames = [
		{
			children: arg.blocks.staticTop,
			frame: {
				x: 0,
				y: 0,
				width: arg.pageSize.width,
				height: arg.pageSize.height
			}
		},
		{
			children: arg.blocks.header,
			frame: {
				x: arg.margin.left,
				y: 0,
				width: contentWidth,
				height: arg.margin.top
			}
		},
		{
			children: arg.blocks.footer,
			frame: {
				x: arg.margin.left,
				y: arg.pageSize.height - arg.margin.bottom,
				width: contentWidth,
				height: arg.margin.bottom
			}
		},
		{
			children: arg.blocks.staticBottom,
			frame: {
				x: 0,
				y: 0,
				width: arg.pageSize.width,
				height: arg.pageSize.height
			},
			placement: "bottom"
		}
	];
	for (const { children, frame, placement } of blockFrames) {
		if (children.length === 0) continue;
		const schemas = [];
		const size = await layoutChildren(children, frame, "stack", {
			gap: 0,
			alignItems: "stretch",
			justifyContent: "start"
		}, {
			schemas,
			inputs: arg.inputs,
			usedNames: arg.usedNames,
			nameCounters: arg.nameCounters,
			defaultFont: arg.defaultFont,
			font: arg.font,
			_cache: arg._cache
		});
		if (placement === "bottom") shiftSchemas(schemas, 0, schemas.length, 0, Math.max(0, frame.height - size.height));
		arg.staticSchemas.push(...schemas);
	}
};
var layoutChildren = async (children, frame, mode, opts, ctx) => {
	const items = flattenChildren(children);
	const flowItems = items.filter((item) => !isAbsoluteElement(item));
	const widths = mode === "row" ? resolveRowWidths(flowItems, frame.width, opts.gap) : void 0;
	let cursor = 0;
	let crossMax = 0;
	let flowIndex = 0;
	const layoutItems = [];
	for (let i = 0; i < items.length; i += 1) {
		const child = items[i];
		if (isAbsoluteElement(child)) {
			await renderAbsolute(child.props, child.children, frame, ctx);
			continue;
		}
		const margin = getChildMargin(child);
		const width = mode === "row" ? widths?.[flowIndex] ?? 0 : resolveStackChildWidth(child, frame.width, margin);
		const childFrame = mode === "stack" ? {
			x: frame.x,
			y: frame.y + cursor,
			width,
			height: Math.max(0, frame.height - cursor)
		} : {
			x: frame.x + cursor,
			y: frame.y,
			width,
			height: frame.height
		};
		childFrame.x += margin.left;
		childFrame.y += margin.top;
		childFrame.height = Math.max(0, childFrame.height - margin.top - margin.bottom);
		const schemaStart = ctx.schemas.length;
		const size = typeof child === "string" || typeof child === "number" ? await renderText({ children: String(child) }, childFrame, ctx) : await renderElement(child, childFrame, mode, ctx);
		const schemaEnd = ctx.schemas.length;
		const mainSize = mode === "stack" ? margin.top + size.height + margin.bottom : margin.left + width + margin.right;
		const outerHeight = margin.top + size.height + margin.bottom;
		layoutItems.push({
			schemaStart,
			schemaEnd,
			outerHeight
		});
		if (mode === "stack") {
			const outerWidth = margin.left + size.width + margin.right;
			const dx = resolveAlignOffset(frame.width, outerWidth, opts.alignItems);
			if (dx !== 0) shiftSchemas(ctx.schemas, schemaStart, schemaEnd, dx, 0);
		}
		cursor += mainSize + (flowIndex < flowItems.length - 1 ? opts.gap : 0);
		flowIndex += 1;
		crossMax = Math.max(crossMax, mode === "stack" ? margin.left + size.width + margin.right : margin.top + size.height + margin.bottom);
	}
	const contentMainSize = cursor;
	const containerMainSize = opts.mainSize ?? contentMainSize;
	applyJustifyContent(ctx.schemas, layoutItems, mode, contentMainSize, containerMainSize, opts);
	if (mode === "row") {
		const rowHeight = opts.crossSize ?? crossMax;
		for (const item of layoutItems) {
			const dy = resolveAlignOffset(rowHeight, item.outerHeight, opts.alignItems);
			if (dy !== 0) shiftSchemas(ctx.schemas, item.schemaStart, item.schemaEnd, 0, dy);
		}
		return {
			width: containerMainSize,
			height: rowHeight
		};
	}
	return {
		width: crossMax,
		height: containerMainSize
	};
};
var resolveRowWidths = (items, frameWidth, gap) => {
	let usedWidth = 0;
	let totalGrow = 0;
	const parts = items.map((item) => {
		const margin = getChildMargin(item);
		const width = getChildWidth(item);
		const grow = getChildFlexGrow(item) ?? (width == null ? 1 : 0);
		const basis = width ?? 0;
		usedWidth += basis + margin.left + margin.right;
		totalGrow += grow;
		return {
			basis,
			grow
		};
	});
	const remaining = Math.max(0, frameWidth - usedWidth - Math.max(0, items.length - 1) * gap);
	const flexUnit = totalGrow > 0 ? remaining / totalGrow : 0;
	return parts.map(({ basis, grow }) => basis + grow * flexUnit);
};
var getChildMargin = (child) => {
	if (typeof child === "string" || typeof child === "number") return resolveBoxSides();
	return resolveBoxSides(child.props.margin);
};
var getChildWidth = (child) => {
	if (typeof child === "string" || typeof child === "number") return void 0;
	const width = child.props.width;
	return typeof width === "number" ? width : void 0;
};
var getChildFlexGrow = (child) => {
	if (typeof child === "string" || typeof child === "number") return void 0;
	const props = child.props;
	const flexGrow = props.flexGrow ?? props.flex;
	return typeof flexGrow === "number" ? Math.max(0, flexGrow) : void 0;
};
var isAbsoluteElement = (child) => isPdfJsxElement(child) && child.kind === "absolute";
var getStaticPlacement = (element) => {
	const placement = element.props.placement ?? "top";
	if (placement !== "top" && placement !== "bottom") throw new Error("@pdfme/jsx: <Static> placement must be \"top\" or \"bottom\".");
	return placement;
};
var resolveStackChildWidth = (child, frameWidth, margin) => {
	const width = getChildWidth(child);
	if (width != null) return width;
	return Math.max(0, frameWidth - margin.left - margin.right);
};
var applyJustifyContent = (schemas, items, mode, contentMainSize, containerMainSize, opts) => {
	const extraSpace = Math.max(0, containerMainSize - contentMainSize);
	if (extraSpace === 0 || opts.justifyContent === "start") return;
	const extraGap = opts.justifyContent === "space-between" && items.length > 1 ? extraSpace / (items.length - 1) : 0;
	const startOffset = opts.justifyContent === "center" ? extraSpace / 2 : opts.justifyContent === "end" ? extraSpace : 0;
	let runningExtraGap = 0;
	for (const item of items) {
		const offset = startOffset + runningExtraGap;
		if (offset !== 0) shiftSchemas(schemas, item.schemaStart, item.schemaEnd, mode === "row" ? offset : 0, mode === "stack" ? offset : 0);
		runningExtraGap += extraGap;
	}
};
var resolveAlignOffset = (containerSize, itemSize, alignItems) => {
	if (alignItems === "center") return Math.max(0, (containerSize - itemSize) / 2);
	if (alignItems === "end") return Math.max(0, containerSize - itemSize);
	return 0;
};
var shiftSchemas = (schemas, start, end, dx, dy) => {
	for (let i = start; i < end; i += 1) {
		const schema = schemas[i];
		if (!schema) continue;
		schema.position = {
			x: schema.position.x + dx,
			y: schema.position.y + dy
		};
	}
};
var renderElement = async (element, frame, parentMode, ctx) => {
	const props = parentMode === "row" && getChildFlexGrow(element) != null ? {
		...element.props,
		width: frame.width
	} : element.props;
	switch (element.kind) {
		case "stack": return renderStack(props, element.children, frame, ctx);
		case "row": return renderRow(props, element.children, frame, ctx);
		case "box": return renderBox(props, element.children, frame, parentMode, ctx);
		case "spacer": return Promise.resolve(renderSpacer(props));
		case "text": return renderText({
			...props,
			children: element.children
		}, frame, ctx);
		case "multiVariableText": return renderMultiVariableText({
			...props,
			children: element.children
		}, frame, ctx);
		case "image": return renderImage(props, frame, ctx);
		case "svg": return renderSvg({
			...props,
			children: element.children
		}, frame, ctx);
		case "rectangle": return renderShape("rectangle", props, frame, ctx);
		case "ellipse": return renderShape("ellipse", props, frame, ctx);
		case "line": return renderLine(props, frame, ctx);
		case "list": return renderList({
			...props,
			children: element.children
		}, frame, ctx);
		case "table": return renderTable(props, frame, ctx);
		case "document": throw new Error("@pdfme/jsx: <Document> must be the root element.");
		case "header":
		case "footer":
		case "static": throw new Error("@pdfme/jsx: <Header>, <Footer>, and <Static> can only be used as direct children of <Document>.");
		case "absolute": return renderAbsolute(props, element.children, frame, ctx);
		default: return {
			width: 0,
			height: 0
		};
	}
};
var renderAbsolute = async (props, children, frame, ctx) => {
	const x = props.x ?? 0;
	const y = props.y ?? 0;
	await layoutChildren(children, {
		x: frame.x + x,
		y: frame.y + y,
		width: props.width ?? Math.max(0, frame.width - x),
		height: props.height ?? Math.max(0, frame.height - y)
	}, "stack", {
		gap: 0,
		alignItems: "stretch",
		justifyContent: "start"
	}, ctx);
	return {
		width: 0,
		height: 0
	};
};
var renderStack = (props, children, frame, ctx) => layoutChildren(children, {
	...frame,
	width: props.width ?? frame.width,
	height: props.height ?? frame.height
}, "stack", {
	gap: props.gap ?? 0,
	alignItems: props.alignItems ?? "stretch",
	justifyContent: props.justifyContent ?? "start",
	mainSize: props.height
}, ctx);
var renderRow = (props, children, frame, ctx) => layoutChildren(children, {
	...frame,
	width: props.width ?? frame.width,
	height: props.height ?? frame.height
}, "row", {
	gap: props.gap ?? 0,
	alignItems: props.alignItems ?? "start",
	justifyContent: props.justifyContent ?? "start",
	mainSize: props.width,
	crossSize: props.height
}, ctx);
var renderBox = async (props, children, frame, _parentMode, ctx) => {
	const width = props.width ?? frame.width;
	const padding = resolveBoxSides(props.padding);
	const needsRect = Boolean(props.background || props.borderColor || props.borderWidth);
	const beforeCount = ctx.schemas.length;
	if (needsRect) ctx.schemas.push({
		name: resolveName(ctx, "box"),
		type: "rectangle",
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height: 0,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly: true,
		color: props.background ?? "",
		borderColor: props.borderColor ?? "",
		borderWidth: props.borderWidth ?? 0,
		radius: props.radius ?? 0
	});
	const childSize = await layoutChildren(children, {
		x: frame.x + padding.left,
		y: frame.y + padding.top,
		width: width - padding.left - padding.right,
		height: (props.height ?? frame.height) - padding.top - padding.bottom
	}, "stack", {
		gap: 0,
		alignItems: "stretch",
		justifyContent: "start"
	}, ctx);
	const height = props.height ?? childSize.height + padding.top + padding.bottom;
	if (needsRect) ctx.schemas[beforeCount] = {
		...ctx.schemas[beforeCount],
		height
	};
	return {
		width,
		height
	};
};
var renderSpacer = (props) => ({
	width: props.width ?? 0,
	height: props.height ?? 0
});
var renderText = async (props, frame, ctx) => {
	const fontSize = props.size ?? DEFAULT_FONT_SIZE;
	const lineHeight = props.lineHeight ?? DEFAULT_LINE_HEIGHT;
	const width = props.width ?? frame.width;
	const value = childrenToString(props.children);
	const readOnly = props.readOnly ?? props.name == null;
	const textFormat = props.textFormat ?? "plain";
	if (!readOnly && textFormat === "inline-markdown") throw new Error("@pdfme/jsx: editable <Text> does not support textFormat=\"inline-markdown\". Use read-only <Text> or <MultiVariableText>.");
	const name = resolveName(ctx, "text", props.name);
	const schema = {
		name,
		type: "text",
		content: value,
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height: props.height ?? 0,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly,
		required: props.required,
		alignment: props.align ?? "left",
		verticalAlignment: props.valign ?? "top",
		fontSize,
		fontName: props.font ?? ctx.defaultFont,
		lineHeight,
		characterSpacing: props.spacing ?? DEFAULT_CHARACTER_SPACING,
		fontColor: props.color ?? DEFAULT_FONT_COLOR,
		backgroundColor: props.background ?? "",
		textFormat,
		overflow: props.overflow,
		strikethrough: props.strikethrough ?? false,
		underline: props.underline ?? false
	};
	if (props.borderColor) schema.borderColor = props.borderColor;
	if (props.borderWidth != null) schema.borderWidth = resolveBoxSides(props.borderWidth);
	if (props.padding != null) schema.padding = resolveBoxSides(props.padding);
	if (props.dynamicFontSize) schema.dynamicFontSize = {
		min: props.dynamicFontSize.min ?? DEFAULT_DYNAMIC_FONT_SIZE.min,
		max: props.dynamicFontSize.max ?? DEFAULT_DYNAMIC_FONT_SIZE.max,
		fit: props.dynamicFontSize.fit ?? DEFAULT_DYNAMIC_FONT_SIZE.fit
	};
	if (props.height == null) schema.height = await measureTextHeight({
		value,
		schema,
		font: ctx.font,
		_cache: ctx._cache
	});
	if (!readOnly) ctx.inputs[name] = value;
	ctx.schemas.push(schema);
	return {
		width,
		height: schema.height
	};
};
var renderMultiVariableText = async (props, frame, ctx) => {
	const fontSize = props.size ?? DEFAULT_FONT_SIZE;
	const lineHeight = props.lineHeight ?? DEFAULT_LINE_HEIGHT;
	const width = props.width ?? frame.width;
	const templateText = props.text ?? childrenToString(props.children);
	const values = normalizeMultiVariableTextValues(props.values);
	const variables = resolveMultiVariableTextVariables(templateText, props.variables, values);
	const name = resolveName(ctx, "multiVariableText", props.name);
	const readOnly = props.readOnly ?? props.name == null;
	const textFormat = props.textFormat ?? "plain";
	const content = readOnly ? substituteMultiVariableText(templateText, values, textFormat === "inline-markdown") : JSON.stringify(values);
	const schema = {
		name,
		type: "multiVariableText",
		content,
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height: props.height ?? 0,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly,
		required: props.required,
		alignment: props.align ?? "left",
		verticalAlignment: props.valign ?? "top",
		fontSize,
		fontName: props.font ?? ctx.defaultFont,
		lineHeight,
		characterSpacing: props.spacing ?? DEFAULT_CHARACTER_SPACING,
		fontColor: props.color ?? DEFAULT_FONT_COLOR,
		backgroundColor: props.background ?? "",
		textFormat,
		overflow: props.overflow,
		strikethrough: props.strikethrough ?? false,
		underline: props.underline ?? false,
		text: templateText,
		variables
	};
	if (props.borderColor) schema.borderColor = props.borderColor;
	if (props.borderWidth != null) schema.borderWidth = resolveBoxSides(props.borderWidth);
	if (props.padding != null) schema.padding = resolveBoxSides(props.padding);
	if (props.dynamicFontSize) schema.dynamicFontSize = {
		min: props.dynamicFontSize.min ?? DEFAULT_DYNAMIC_FONT_SIZE.min,
		max: props.dynamicFontSize.max ?? DEFAULT_DYNAMIC_FONT_SIZE.max,
		fit: props.dynamicFontSize.fit ?? DEFAULT_DYNAMIC_FONT_SIZE.fit
	};
	if (props.height == null) {
		const measureValue = readOnly ? content : substituteMultiVariableText(templateText, values, textFormat === "inline-markdown");
		schema.height = await measureTextHeight({
			value: measureValue,
			schema,
			font: ctx.font,
			_cache: ctx._cache
		});
	}
	if (!readOnly) ctx.inputs[name] = content;
	ctx.schemas.push(schema);
	return {
		width,
		height: schema.height
	};
};
var renderImage = (props, frame, ctx) => {
	const width = props.width ?? frame.width;
	const height = props.height ?? DEFAULT_VISUAL_HEIGHT;
	const name = resolveName(ctx, "image", props.name);
	const readOnly = props.readOnly ?? props.name == null;
	const content = props.src ?? "";
	const schema = {
		name,
		type: "image",
		content,
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly,
		required: props.required
	};
	if (!readOnly) ctx.inputs[name] = content;
	ctx.schemas.push(schema);
	return {
		width,
		height
	};
};
var renderSvg = (props, frame, ctx) => {
	const width = props.width ?? frame.width;
	const height = props.height ?? DEFAULT_VISUAL_HEIGHT;
	const name = resolveName(ctx, "svg", props.name);
	const readOnly = props.readOnly ?? props.name == null;
	const content = props.svg ?? childrenToString(props.children);
	const schema = {
		name,
		type: "svg",
		content,
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly,
		required: props.required
	};
	if (!readOnly) ctx.inputs[name] = content;
	ctx.schemas.push(schema);
	return {
		width,
		height
	};
};
var renderShape = (type, props, frame, ctx) => {
	const width = props.width ?? frame.width;
	const height = props.height ?? DEFAULT_VISUAL_HEIGHT;
	const fill = props.fill ?? "";
	const borderWidth = props.borderWidth ?? (props.borderColor || !fill ? 1 : 0);
	const schema = {
		name: resolveName(ctx, type, props.name),
		type,
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly: true,
		borderWidth,
		borderColor: props.borderColor ?? (borderWidth > 0 ? DEFAULT_SHAPE_BORDER_COLOR : ""),
		color: fill,
		radius: type === "rectangle" ? props.radius ?? 0 : 0
	};
	ctx.schemas.push(schema);
	return {
		width,
		height
	};
};
var renderLine = (props, frame, ctx) => {
	const width = props.width ?? frame.width;
	const height = props.height ?? DEFAULT_LINE_THICKNESS;
	const schema = {
		name: resolveName(ctx, "line", props.name),
		type: "line",
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly: true,
		color: props.color ?? DEFAULT_LINE_COLOR
	};
	ctx.schemas.push(schema);
	return {
		width,
		height
	};
};
var renderList = (props, frame, ctx) => {
	const fontSize = props.size ?? DEFAULT_FONT_SIZE;
	const lineHeight = props.lineHeight ?? DEFAULT_LINE_HEIGHT;
	const items = normalizeListItems(props);
	const serialized = JSON.stringify(items.map(serializeListItem));
	const width = props.width ?? frame.width;
	const height = props.height ?? Math.max(1, items.length) * estimateTextHeight(fontSize, lineHeight) + Math.max(0, items.length - 1) * (props.itemSpacing ?? 1);
	const name = resolveName(ctx, "list", props.name);
	const readOnly = props.readOnly ?? props.name == null;
	const schema = {
		name,
		type: "list",
		content: serialized,
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly,
		required: props.required,
		alignment: props.align ?? "left",
		verticalAlignment: "top",
		fontSize,
		fontName: props.font ?? ctx.defaultFont,
		lineHeight,
		characterSpacing: props.spacing ?? DEFAULT_CHARACTER_SPACING,
		fontColor: props.color ?? DEFAULT_FONT_COLOR,
		backgroundColor: props.background ?? "",
		listStyle: props.listStyle ?? "bullet",
		markerWidth: props.markerWidth ?? 6,
		markerGap: props.markerGap ?? 2,
		indentSize: props.indentSize ?? 6,
		itemSpacing: props.itemSpacing ?? 1
	};
	if (!readOnly) ctx.inputs[name] = serialized;
	ctx.schemas.push(schema);
	return {
		width,
		height
	};
};
var renderTable = (props, frame, ctx) => {
	const rows = (props.rows ?? props.data ?? []).map((row) => row.map(String));
	const width = props.width ?? frame.width;
	const showHead = props.showHead ?? true;
	const headerHeight = props.headerHeight ?? 9;
	const rowHeight = props.rowHeight ?? 6.5;
	const height = props.height ?? (showHead ? headerHeight : 0) + Math.max(1, rows.length) * rowHeight;
	const name = resolveName(ctx, "table", props.name);
	const readOnly = props.readOnly ?? props.name == null;
	const value = JSON.stringify(rows);
	const schema = {
		name,
		type: "table",
		content: value,
		position: {
			x: frame.x,
			y: frame.y
		},
		width,
		height,
		rotate: props.rotate ?? 0,
		opacity: props.opacity ?? 1,
		readOnly,
		required: props.required,
		showHead,
		repeatHead: props.repeatHead ?? false,
		head: props.head,
		headWidthPercentages: normalizeColumnWeights(props.columnWeights, props.head.length),
		tableStyles: {
			borderColor: props.tableStyles?.borderColor ?? "#000000",
			borderWidth: props.tableStyles?.borderWidth ?? .3
		},
		headStyles: {
			...defaultCellStyle(props.font ?? ctx.defaultFont, props.fontSize),
			fontColor: "#ffffff",
			backgroundColor: "#2980ba",
			...normalizeCellStyle(props.headStyles)
		},
		bodyStyles: {
			...defaultCellStyle(props.font ?? ctx.defaultFont, props.fontSize),
			alternateBackgroundColor: "#f5f5f5",
			...normalizeCellStyle(props.bodyStyles)
		},
		columnStyles: props.columnStyles ?? {}
	};
	if (!readOnly) ctx.inputs[name] = value;
	ctx.schemas.push(schema);
	return {
		width,
		height
	};
};
var normalizeListItems = (props) => {
	if (props.items) return props.items.map((item) => typeof item === "string" ? {
		text: item,
		level: 0
	} : {
		text: item.text,
		level: item.level ?? 0
	});
	return childrenToString(props.children).split("\n").map((item) => item.trim()).filter(Boolean).map((text) => ({
		text,
		level: 0
	}));
};
var serializeListItem = (item) => `${"	".repeat(Math.max(0, item.level))}${item.text}`;
var normalizeMultiVariableTextValues = (values) => {
	const normalized = {};
	Object.entries(values ?? {}).forEach(([key, value]) => {
		normalized[key] = value == null ? "" : String(value);
	});
	return normalized;
};
var resolveMultiVariableTextVariables = (templateText, variables, values) => {
	const result = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (name) => {
		if (!seen.has(name)) {
			seen.add(name);
			result.push(name);
		}
	};
	variables?.forEach(add);
	getVariableNames(templateText).forEach(add);
	Object.keys(values).forEach(add);
	return result;
};
var substituteMultiVariableText = (templateText, values, escapeMarkdown) => {
	let result = "";
	let lastIndex = 0;
	visitVariables(templateText, ({ name, startIndex, endIndex }) => {
		result += templateText.slice(lastIndex, startIndex);
		const value = values[name];
		if (value != null) result += escapeMarkdown ? escapeInlineMarkdown(value) : value;
		lastIndex = endIndex + 1;
	});
	return result + templateText.slice(lastIndex);
};
var normalizeColumnWeights = (columnWeights, columnCount) => {
	if (columnWeights && columnWeights.length > 0) {
		const normalizedWidths = Array.from({ length: columnCount }, (_, index) => {
			const width = columnWeights[index];
			return typeof width === "number" && Number.isFinite(width) && width > 0 ? width : 1;
		});
		const totalWidth = normalizedWidths.reduce((sum, width) => sum + width, 0);
		if (totalWidth > 0) return normalizedWidths.map((width) => width / totalWidth * 100);
	}
	if (columnCount <= 0) return [];
	return Array.from({ length: columnCount }, () => 100 / columnCount);
};
var defaultCellStyle = (fontName, fontSize = 10) => ({
	fontName,
	alignment: "left",
	verticalAlignment: "middle",
	fontSize,
	lineHeight: 1,
	characterSpacing: 0,
	fontColor: "#000000",
	backgroundColor: "#ffffff",
	borderColor: "#000000",
	borderWidth: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	},
	padding: {
		top: 5,
		right: 5,
		bottom: 5,
		left: 5
	}
});
var normalizeCellStyle = (style) => {
	if (!style) return {};
	const { borderWidth, padding, ...rest } = style;
	return {
		...rest,
		...borderWidth != null ? { borderWidth: resolveBoxSides(borderWidth) } : {},
		...padding != null ? { padding: resolveBoxSides(padding) } : {}
	};
};
var resolveBoxSides = (value) => {
	if (value == null) return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	};
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
var resolveName = (ctx, prefix, userName) => {
	if (userName) {
		if (ctx.usedNames.has(userName)) throw new Error(`@pdfme/jsx: duplicate schema name "${userName}"`);
		ctx.usedNames.add(userName);
		return userName;
	}
	let name = "";
	do {
		ctx.nameCounters[prefix] = (ctx.nameCounters[prefix] ?? 0) + 1;
		name = `${prefix}_${ctx.nameCounters[prefix]}`;
	} while (ctx.usedNames.has(name));
	ctx.usedNames.add(name);
	return name;
};
var estimateTextHeight = (fontSize, lineHeight) => Math.max(4, pt2mm(fontSize * lineHeight));
var validateConsistentPageProps = (pages, firstPageSize, firstMargin) => {
	for (let i = 1; i < pages.length; i += 1) {
		const props = pages[i]?.props;
		const pageSize = resolvePageSize(props.size, props.orientation);
		const margin = resolveBoxSides(props.margin);
		if (!isSameSize(pageSize, firstPageSize) || !isSameBoxSides(margin, firstMargin)) throw new Error("@pdfme/jsx: all <Page> nodes must use the same size, orientation, and margin. pdfme templates have one blank basePdf size and padding.");
	}
};
var isSameSize = (first, second) => first.width === second.width && first.height === second.height;
var isSameBoxSides = (first, second) => first.top === second.top && first.right === second.right && first.bottom === second.bottom && first.left === second.left;
var PAGE_BREAK_PARENT_KINDS = /* @__PURE__ */ new Set([
	"page",
	"stack",
	"box"
]);
var STATIC_CONTAINER_KINDS = /* @__PURE__ */ new Set([
	"absolute",
	"stack",
	"row",
	"box"
]);
var STATIC_LEAF_KINDS = /* @__PURE__ */ new Set([
	"spacer",
	"text",
	"image",
	"svg",
	"rectangle",
	"ellipse",
	"line"
]);
var ABSOLUTE_PARENT_KINDS = /* @__PURE__ */ new Set([
	"page",
	"header",
	"footer",
	"static",
	"box"
]);
var STATIC_BLOCK_KINDS = /* @__PURE__ */ new Set([
	"header",
	"footer",
	"static"
]);
var validatePageBreakPlacement = (node, parentKind = void 0, canBreak = false) => {
	for (const child of flattenForSplitting(node)) {
		if (!isPdfJsxElement(child)) continue;
		if (child.kind === "pagebreak") {
			if (!canBreak || !parentKind || !PAGE_BREAK_PARENT_KINDS.has(parentKind)) throw new Error("@pdfme/jsx: <PageBreak> can only be used inside <Page>, <Stack>, or <Box>.");
			continue;
		}
		const childCanBreak = child.kind === "page" ? true : canBreak && PAGE_BREAK_PARENT_KINDS.has(child.kind);
		validatePageBreakPlacement(child.children, child.kind, childCanBreak);
	}
};
var validateAbsolutePlacement = (node, parentKind = void 0) => {
	for (const child of flattenForSplitting(node)) {
		if (!isPdfJsxElement(child)) continue;
		if (child.kind === "absolute" && (!parentKind || !ABSOLUTE_PARENT_KINDS.has(parentKind))) throw new Error("@pdfme/jsx: <Absolute> can only be used inside <Page>, <Header>, <Footer>, <Static>, or <Box>.");
		validateAbsolutePlacement(child.children, child.kind);
	}
};
var validateStaticPlacement = (children, hasDocument) => {
	for (const child of flattenChildren(children)) {
		if (!isPdfJsxElement(child)) {
			if (hasDocument && String(child).trim() !== "") throw new Error("@pdfme/jsx: <Document> children must be <Header>, <Footer>, <Static>, or <Page>.");
			continue;
		}
		if (STATIC_BLOCK_KINDS.has(child.kind)) {
			if (!hasDocument) throw new Error("@pdfme/jsx: <Header>, <Footer>, and <Static> can only be used as direct children of <Document>.");
			if (child.kind === "static") {
				if (getStaticPlacement(child) === "bottom" && hasElementKind(child.children, "absolute")) throw new Error("@pdfme/jsx: <Absolute> is not supported inside bottom <Static>. Use top <Static>, <Header>, <Footer>, or <Page> for fixed page coordinates.");
			}
			validateStaticChildren(child.children);
			continue;
		}
		if (hasDocument && child.kind !== "page") throw new Error("@pdfme/jsx: <Document> children must be <Header>, <Footer>, <Static>, or <Page>.");
		validateNoNestedStaticBlock(child);
	}
};
var validateNoNestedStaticBlock = (node) => {
	if (!isPdfJsxElement(node)) return;
	for (const child of flattenForSplitting(node.children)) {
		if (isPdfJsxElement(child) && STATIC_BLOCK_KINDS.has(child.kind)) throw new Error("@pdfme/jsx: <Header>, <Footer>, and <Static> can only be used as direct children of <Document>.");
		validateNoNestedStaticBlock(child);
	}
};
var hasElementKind = (node, kind) => {
	for (const child of flattenForSplitting(node)) {
		if (!isPdfJsxElement(child)) continue;
		if (child.kind === kind || hasElementKind(child.children, kind)) return true;
	}
	return false;
};
var validateStaticChildren = (children) => {
	for (const child of flattenForSplitting(children)) {
		if (!isPdfJsxElement(child)) continue;
		if (STATIC_CONTAINER_KINDS.has(child.kind)) {
			validateStaticChildren(child.children);
			continue;
		}
		if (!STATIC_LEAF_KINDS.has(child.kind)) throw new Error(`@pdfme/jsx: <Static> does not support <${child.kind}> children. Supported: read-only Stack, Row, Box, Spacer, Text, Image, Svg, Rectangle, Ellipse, and Line.`);
		validateStaticLeafProps(child);
	}
};
var validateStaticLeafProps = (element) => {
	if (element.kind !== "text" && element.kind !== "image" && element.kind !== "svg") return;
	const props = element.props;
	if (props.readOnly === false || props.name != null && props.readOnly !== true) throw new Error("@pdfme/jsx: <Static> children must be read-only.");
};
//#endregion
export { Absolute, Box, Document, Ellipse, Footer, Header, Image, Line, List, MultiVariableText, Page, PageBreak, Rectangle, Row, Spacer, Stack, Static, Svg, Table, Text, renderToTemplate };

//# sourceMappingURL=index.js.map