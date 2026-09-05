import { a as createListItemSplitRange, h as getFontKitFont, v as splitTextToSize } from "./splitRange-BHV0vb0Q.js";
import { getDefaultFont, mm2pt, pt2mm } from "@pdfme/common";
//#region src/list/constants.ts
var LIST_STYLE_BULLET = "bullet";
var LIST_STYLE_ORDERED = "ordered";
var DEFAULT_LIST_STYLE = LIST_STYLE_BULLET;
//#endregion
//#region src/list/helper.ts
var normalizeListItems = (value) => {
	if (Array.isArray(value)) return value.map((item) => String(item));
	if (typeof value !== "string") return value == null ? [] : [String(value)];
	const trimmed = value.trim();
	if (!trimmed) return [];
	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) return parsed.map((item) => String(item));
	} catch {}
	return value.split(/\r\n|\r|\n/g);
};
var parseListItem = (value) => {
	const indent = value.match(/^\t+/)?.[0].length ?? 0;
	return {
		level: Math.min(indent, 8),
		text: value.slice(indent)
	};
};
var normalizeListItemEntries = (value) => normalizeListItems(value).map(parseListItem);
var formatListItem = (item) => `${"	".repeat(Math.max(0, item.level))}${item.text}`;
var serializeListItems = (items) => {
	const lines = items.map(formatListItem);
	return JSON.stringify(lines);
};
var getListMarkers = (schema, items) => {
	if ((schema.listStyle ?? "bullet") !== "ordered") return items.map(() => "•");
	const counters = Array.from({ length: 9 }, () => 0);
	return items.map((rawItem) => {
		const { level } = parseListItem(rawItem);
		counters[level] += 1;
		counters.fill(0, level + 1);
		return `${counters[level]}.`;
	});
};
var calculateListLayout = async (arg) => {
	const { schema, items, markerItems, startIndex, options, _cache } = arg;
	const markerWidth = schema.markerWidth ?? 6;
	const markerGap = schema.markerGap ?? 2;
	const indentSize = schema.indentSize ?? 6;
	const font = options.font || getDefaultFont();
	const fontKitFont = await getFontKitFont(schema.fontName, font, _cache);
	const fontSize = schema.fontSize ?? 13;
	const lineHeight = schema.lineHeight ?? 1;
	const characterSpacing = schema.characterSpacing ?? 0;
	const itemSpacing = schema.itemSpacing ?? 1;
	const lineHeightMm = pt2mm(fontSize * lineHeight);
	const markers = markerItems ? getListMarkers(schema, markerItems).slice(startIndex, startIndex + items.length) : getListMarkers(schema, items);
	const layoutItems = items.map((rawItem, index) => {
		const item = parseListItem(rawItem);
		const markerX = item.level * indentSize;
		const bodyX = markerX + markerWidth + markerGap;
		const bodyWidth = Math.max(schema.width - bodyX, 0);
		const lines = splitTextToSize({
			value: item.text,
			characterSpacing,
			boxWidthInPt: mm2pt(Math.max(bodyWidth, .1)),
			fontSize,
			fontKitFont
		});
		const height = Math.max(lines.length, 1) * lineHeightMm + (index === items.length - 1 ? 0 : itemSpacing);
		return {
			item: item.text,
			itemIndex: startIndex + index,
			level: item.level,
			marker: markers[index],
			lines,
			height,
			markerX,
			bodyX,
			bodyWidth
		};
	});
	return {
		items: layoutItems,
		totalHeight: layoutItems.reduce((sum, item) => sum + item.height, 0),
		markerWidth,
		markerGap,
		indentSize
	};
};
//#endregion
//#region src/list/dynamicTemplate.ts
var getDynamicLayoutForList = async (value, args) => {
	if (args.schema.type !== "list") return { heights: [args.schema.height] };
	const schema = args.schema;
	const items = normalizeListItems(value);
	if (items.length === 0) return { heights: [0] };
	return {
		heights: (await calculateListLayout({
			schema,
			items,
			startIndex: 0,
			options: args.options,
			_cache: args._cache
		})).items.map((item) => item.height),
		avoidFirstUnitOnly: false,
		patchSplitSchema: ({ start, end, isSplit }) => ({
			__splitRange: createListItemSplitRange(start, end),
			__isSplit: isSplit
		})
	};
};
//#endregion
export { normalizeListItems as a, LIST_STYLE_BULLET as c, normalizeListItemEntries as i, LIST_STYLE_ORDERED as l, calculateListLayout as n, serializeListItems as o, getListMarkers as r, DEFAULT_LIST_STYLE as s, getDynamicLayoutForList as t };

//# sourceMappingURL=dynamicTemplate-DQF7c6NR.js.map