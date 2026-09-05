import { DEFAULT_FONT_NAME, b64toUint8Array, createDynamicLayoutSplitRange, getDefaultFont, getDynamicLayoutSplitRange, getFallbackFontName, isUrlSafeToFetch, mm2pt, pt2mm, pt2px } from "@pdfme/common";
import * as fontkit from "fontkit";
import { Buffer } from "buffer";
//#region src/text/constants.ts
var ALIGN_LEFT = "left";
var ALIGN_CENTER = "center";
var ALIGN_RIGHT = "right";
var ALIGN_JUSTIFY = "justify";
var DEFAULT_ALIGNMENT = ALIGN_LEFT;
var VERTICAL_ALIGN_MIDDLE = "middle";
var VERTICAL_ALIGN_BOTTOM = "bottom";
var DEFAULT_FONT_COLOR = "#000000";
var PLACEHOLDER_FONT_COLOR = "#A0A0A0";
var TEXT_FORMAT_PLAIN = "plain";
var TEXT_FORMAT_INLINE_MARKDOWN = "inline-markdown";
var DEFAULT_TEXT_FORMAT = TEXT_FORMAT_PLAIN;
var TEXT_OVERFLOW_VISIBLE = "visible";
var TEXT_OVERFLOW_EXPAND = "expand";
var DEFAULT_TEXT_OVERFLOW = TEXT_OVERFLOW_VISIBLE;
var FONT_VARIANT_FALLBACK_SYNTHETIC = "synthetic";
var FONT_VARIANT_FALLBACK_PLAIN = "plain";
var FONT_VARIANT_FALLBACK_ERROR = "error";
var DEFAULT_FONT_VARIANT_FALLBACK = FONT_VARIANT_FALLBACK_SYNTHETIC;
var SYNTHETIC_BOLD_OFFSET_RATIO = .03;
var SYNTHETIC_BOLD_CSS_TEXT_SHADOW = "0.025em 0 0 currentColor";
var CODE_BACKGROUND_COLOR = "#f2f3f5";
var CODE_HORIZONTAL_PADDING = 1.5;
var DYNAMIC_FIT_VERTICAL = "vertical";
var DYNAMIC_FIT_HORIZONTAL = "horizontal";
var DEFAULT_DYNAMIC_FIT = DYNAMIC_FIT_VERTICAL;
var FONT_SIZE_ADJUSTMENT = .25;
var LINE_START_FORBIDDEN_CHARS = [
	"、",
	"。",
	",",
	".",
	"」",
	"』",
	")",
	"}",
	"】",
	">",
	"≫",
	"]",
	"・",
	"ー",
	"―",
	"-",
	"!",
	"！",
	"?",
	"？",
	":",
	"：",
	";",
	"；",
	"/",
	"／",
	"ゝ",
	"々",
	"〃",
	"ぁ",
	"ぃ",
	"ぅ",
	"ぇ",
	"ぉ",
	"っ",
	"ゃ",
	"ゅ",
	"ょ",
	"ァ",
	"ィ",
	"ゥ",
	"ェ",
	"ォ",
	"ッ",
	"ャ",
	"ュ",
	"ョ"
];
var LINE_END_FORBIDDEN_CHARS = [
	"「",
	"『",
	"（",
	"｛",
	"【",
	"＜",
	"≪",
	"［",
	"〘",
	"〖",
	"〝",
	"‘",
	"“",
	"｟",
	"«"
];
//#endregion
//#region src/box.ts
var createBoxDimension = (value = 0) => ({
	top: value,
	right: value,
	bottom: value,
	left: value
});
var normalizeBoxDimension = (value) => ({
	top: value?.top ?? 0,
	right: value?.right ?? 0,
	bottom: value?.bottom ?? 0,
	left: value?.left ?? 0
});
var getBoxInsets = (schema) => ({
	borderWidth: normalizeBoxDimension(schema.borderWidth),
	padding: normalizeBoxDimension(schema.padding)
});
var getBoxVerticalInset = (schema) => {
	const { borderWidth, padding } = getBoxInsets(schema);
	return borderWidth.top + borderWidth.bottom + padding.top + padding.bottom;
};
var getBoxContentArea = (schema) => {
	const { borderWidth, padding } = getBoxInsets(schema);
	const leftInset = borderWidth.left + padding.left;
	const topInset = borderWidth.top + padding.top;
	const rightInset = borderWidth.right + padding.right;
	const bottomInset = borderWidth.bottom + padding.bottom;
	return {
		position: {
			x: schema.position.x + leftInset,
			y: schema.position.y + topInset
		},
		width: Math.max(0, schema.width - leftInset - rightInset),
		height: Math.max(0, schema.height - topInset - bottomInset),
		leftInset,
		topInset,
		rightInset,
		bottomInset
	};
};
var hasBoxDimension = (dimension) => {
	const resolved = normalizeBoxDimension(dimension);
	return resolved.top > 0 || resolved.right > 0 || resolved.bottom > 0 || resolved.left > 0;
};
var getSplitBoxDimension = (dimension, range, totalUnits) => {
	const resolved = normalizeBoxDimension(dimension);
	const end = range.end ?? totalUnits;
	return {
		top: range.start === 0 ? resolved.top : 0,
		right: resolved.right,
		bottom: end >= totalUnits ? resolved.bottom : 0,
		left: resolved.left
	};
};
var getBoxDimensionPropPanelSchema = (step = 1) => {
	const getCommonProp = () => ({
		type: "number",
		widget: "inputNumber",
		props: {
			min: 0,
			step
		},
		span: 6
	});
	return {
		top: {
			title: "Top",
			...getCommonProp()
		},
		right: {
			title: "Right",
			...getCommonProp()
		},
		bottom: {
			title: "Bottom",
			...getCommonProp()
		},
		left: {
			title: "Left",
			...getCommonProp()
		}
	};
};
//#endregion
//#region src/text/helper.ts
var getBrowserVerticalFontAdjustments = (fontKitFont, fontSize, lineHeight, verticalAlignment) => {
	const { ascent, descent, unitsPerEm } = fontKitFont;
	const fontBaseLineHeight = (ascent - descent) / unitsPerEm;
	const topAdjustment = (fontBaseLineHeight * fontSize - fontSize) / 2;
	if (verticalAlignment === "top") return {
		topAdj: pt2px(topAdjustment),
		bottomAdj: 0
	};
	let bottomAdjustment = 0;
	if (lineHeight < fontBaseLineHeight) bottomAdjustment = (fontBaseLineHeight - lineHeight) * fontSize / 2;
	return {
		topAdj: 0,
		bottomAdj: pt2px(bottomAdjustment)
	};
};
var getFontDescentInPt = (fontKitFont, fontSize) => {
	const { descent, unitsPerEm } = fontKitFont;
	return descent / unitsPerEm * fontSize;
};
var heightOfFontAtSize = (fontKitFont, fontSize) => {
	const { ascent, descent, bbox, unitsPerEm } = fontKitFont;
	const scale = 1e3 / unitsPerEm;
	let height = (ascent || bbox.maxY) * scale - (descent || bbox.minY) * scale;
	height -= Math.abs(descent * scale) || 0;
	return height / 1e3 * fontSize;
};
var calculateCharacterSpacing = (textContent, textCharacterSpacing) => {
	return (textContent.length - 1) * textCharacterSpacing;
};
var TEXT_WIDTH_CACHE_LIMIT = 5e3;
var textWidthCache = /* @__PURE__ */ new WeakMap();
var getTextWidthCache = (fontKitFont) => {
	let cache = textWidthCache.get(fontKitFont);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		textWidthCache.set(fontKitFont, cache);
	}
	return cache;
};
var widthOfTextAtSize = (text, fontKitFont, fontSize, characterSpacing) => {
	const cache = getTextWidthCache(fontKitFont);
	const cacheKey = `${fontSize}\0${characterSpacing}\0${text}`;
	const cachedWidth = cache.get(cacheKey);
	if (cachedWidth !== void 0) return cachedWidth;
	const { glyphs } = fontKitFont.layout(text);
	const scale = 1e3 / fontKitFont.unitsPerEm;
	const width = glyphs.reduce((totalWidth, glyph) => totalWidth + glyph.advanceWidth * scale, 0) * (fontSize / 1e3) + calculateCharacterSpacing(text, characterSpacing);
	if (cache.size >= TEXT_WIDTH_CACHE_LIMIT) cache.clear();
	cache.set(cacheKey, width);
	return width;
};
var getFallbackFont = (font) => {
	return font[getFallbackFontName(font)];
};
var getCacheKey = (fontName) => `getFontKitFont-${fontName}`;
var fetchRemoteFontData = async (url) => {
	if (!isUrlSafeToFetch(url)) throw Error("[@pdfme/schemas] Invalid or unsafe URL for font data. Only http: and https: URLs pointing to public hosts are allowed.");
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.arrayBuffer();
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw Error(`[@pdfme/schemas] Failed to fetch remote font data from ${url}. ${reason}`);
	}
};
var getFontKitFont = async (fontName, font, _cache) => {
	const fntNm = fontName || getFallbackFontName(font);
	const cacheKey = getCacheKey(fntNm);
	const fontCache = _cache;
	const cachedFont = fontCache.get(cacheKey);
	if (cachedFont) return await cachedFont;
	const currentFont = font[fntNm] || getFallbackFont(font) || getDefaultFont()[DEFAULT_FONT_NAME];
	const fontKitFontPromise = (async () => {
		let fontData = currentFont.data;
		if (typeof fontData === "string") {
			if (fontData.startsWith("http")) fontData = await fetchRemoteFontData(fontData);
			else fontData = b64toUint8Array(fontData);
		}
		let fontDataBuffer;
		if (fontData instanceof Buffer) fontDataBuffer = fontData;
		else fontDataBuffer = Buffer.from(fontData);
		return fontkit.create(fontDataBuffer);
	})();
	fontCache.set(cacheKey, fontKitFontPromise);
	try {
		const fontKitFont = await fontKitFontPromise;
		fontCache.set(cacheKey, fontKitFont);
		return fontKitFont;
	} catch (error) {
		if (fontCache.get(cacheKey) === fontKitFontPromise) fontCache.delete(cacheKey);
		throw error;
	}
};
/**
* If using dynamic font size, iteratively increment or decrement the
* font size to fit the containing box.
* Calculating space usage involves splitting lines where they exceed
* the box width based on the proposed size.
*/
var calculateDynamicFontSize = ({ textSchema, fontKitFont, value, startingFontSize }) => {
	const { fontSize: schemaFontSize, dynamicFontSize: dynamicFontSizeSetting, characterSpacing: schemaCharacterSpacing, lineHeight = 1 } = textSchema;
	const { width: boxWidth, height: boxHeight } = getBoxContentArea(textSchema);
	const fontSize = startingFontSize || schemaFontSize || 13;
	if (!dynamicFontSizeSetting) return fontSize;
	if (dynamicFontSizeSetting.max < dynamicFontSizeSetting.min) return fontSize;
	const characterSpacing = schemaCharacterSpacing ?? 0;
	const paragraphs = value.split("\n");
	let dynamicFontSize = fontSize;
	if (dynamicFontSize < dynamicFontSizeSetting.min) dynamicFontSize = dynamicFontSizeSetting.min;
	else if (dynamicFontSize > dynamicFontSizeSetting.max) dynamicFontSize = dynamicFontSizeSetting.max;
	const dynamicFontFit = dynamicFontSizeSetting.fit ?? "vertical";
	const calculateConstraints = (size) => {
		let totalWidthInMm = 0;
		let totalHeightInMm = 0;
		const boxWidthInPt = mm2pt(boxWidth);
		const firstLineTextHeight = heightOfFontAtSize(fontKitFont, size);
		const firstLineHeightInMm = pt2mm(firstLineTextHeight * lineHeight);
		const otherRowHeightInMm = pt2mm(size * lineHeight);
		paragraphs.forEach((paragraph, paraIndex) => {
			getSplittedLinesBySegmenter(paragraph, {
				font: fontKitFont,
				fontSize: size,
				characterSpacing,
				boxWidthInPt
			}).forEach((line, lineIndex) => {
				if (dynamicFontFit === "vertical") {
					const textWidth = widthOfTextAtSize(line.replace("\n", ""), fontKitFont, size, characterSpacing);
					const textWidthInMm = pt2mm(textWidth);
					totalWidthInMm = Math.max(totalWidthInMm, textWidthInMm);
				}
				if (paraIndex + lineIndex === 0) totalHeightInMm += firstLineHeightInMm;
				else totalHeightInMm += otherRowHeightInMm;
			});
			if (dynamicFontFit === "horizontal") {
				const textWidth = widthOfTextAtSize(paragraph, fontKitFont, size, characterSpacing);
				const textWidthInMm = pt2mm(textWidth);
				totalWidthInMm = Math.max(totalWidthInMm, textWidthInMm);
			}
		});
		return {
			totalWidthInMm,
			totalHeightInMm
		};
	};
	const shouldFontGrowToFit = (totalWidthInMm, totalHeightInMm) => {
		if (dynamicFontSize >= dynamicFontSizeSetting.max) return false;
		if (dynamicFontFit === "horizontal") return totalWidthInMm < boxWidth;
		return totalHeightInMm < boxHeight;
	};
	const shouldFontShrinkToFit = (totalWidthInMm, totalHeightInMm) => {
		if (dynamicFontSize <= dynamicFontSizeSetting.min || dynamicFontSize <= 0) return false;
		return totalWidthInMm > boxWidth || totalHeightInMm > boxHeight;
	};
	let { totalWidthInMm, totalHeightInMm } = calculateConstraints(dynamicFontSize);
	while (shouldFontGrowToFit(totalWidthInMm, totalHeightInMm)) {
		dynamicFontSize += FONT_SIZE_ADJUSTMENT;
		const { totalWidthInMm: newWidth, totalHeightInMm: newHeight } = calculateConstraints(dynamicFontSize);
		if (newHeight < boxHeight) {
			totalWidthInMm = newWidth;
			totalHeightInMm = newHeight;
		} else {
			dynamicFontSize -= FONT_SIZE_ADJUSTMENT;
			break;
		}
	}
	while (shouldFontShrinkToFit(totalWidthInMm, totalHeightInMm)) {
		dynamicFontSize -= FONT_SIZE_ADJUSTMENT;
		({totalWidthInMm, totalHeightInMm} = calculateConstraints(dynamicFontSize));
	}
	return dynamicFontSize;
};
var splitTextToSize = (arg) => {
	const { value, characterSpacing, fontSize, fontKitFont, boxWidthInPt } = arg;
	const fontWidthCalcValues = {
		font: fontKitFont,
		fontSize,
		characterSpacing,
		boxWidthInPt
	};
	let lines = [];
	value.split(/\r\n|\r|\n|\f|\v/g).forEach((line) => {
		lines = lines.concat(getSplittedLinesBySegmenter(line, fontWidthCalcValues));
	});
	return lines;
};
var isFirefox = () => navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
var wordSegmenter;
var getWordSegmenter = () => {
	wordSegmenter ?? (wordSegmenter = new Intl.Segmenter(void 0, { granularity: "word" }));
	return wordSegmenter;
};
var getSplittedLinesBySegmenter = (line, calcValues) => {
	if (line.trim() === "") return [""];
	const { font, fontSize, characterSpacing, boxWidthInPt } = calcValues;
	const iterator = getWordSegmenter().segment(line.trimEnd())[Symbol.iterator]();
	let lines = [];
	let lineCounter = 0;
	let currentTextSize = 0;
	while (true) {
		const chunk = iterator.next();
		if (chunk.done) break;
		const segment = chunk.value.segment;
		const textWidth = widthOfTextAtSize(segment, font, fontSize, characterSpacing);
		if (currentTextSize + textWidth <= boxWidthInPt) {
			if (lines[lineCounter]) {
				lines[lineCounter] += segment;
				currentTextSize += textWidth + characterSpacing;
			} else {
				lines[lineCounter] = segment;
				currentTextSize = textWidth + characterSpacing;
			}
		} else if (segment.trim() === "") {
			lines[++lineCounter] = "";
			currentTextSize = 0;
		} else if (textWidth <= boxWidthInPt) {
			lines[++lineCounter] = segment;
			currentTextSize = textWidth + characterSpacing;
		} else for (const char of segment) {
			const size = widthOfTextAtSize(char, font, fontSize, characterSpacing);
			if (currentTextSize + size <= boxWidthInPt) {
				if (lines[lineCounter]) {
					lines[lineCounter] += char;
					currentTextSize += size + characterSpacing;
				} else {
					lines[lineCounter] = char;
					currentTextSize = size + characterSpacing;
				}
			} else {
				lines[++lineCounter] = char;
				currentTextSize = size + characterSpacing;
			}
		}
	}
	if (lines.some(containsJapanese)) return adjustEndOfLine(filterEndJP(filterStartJP(lines)));
	else return adjustEndOfLine(lines);
};
var adjustEndOfLine = (lines) => {
	return lines.map((line, index) => {
		if (index === lines.length - 1) return line.trimEnd() + "\n";
		else return line.trimEnd();
	});
};
function containsJapanese(text) {
	return /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text);
}
var filterStartJP = (lines) => {
	const filtered = [];
	let charToAppend = null;
	lines.slice().reverse().forEach((line) => {
		if (line.trim().length === 0) filtered.push("");
		else {
			const charAtStart = line.charAt(0);
			if (LINE_START_FORBIDDEN_CHARS.includes(charAtStart)) {
				if (line.trim().length === 1) {
					filtered.push(line);
					charToAppend = null;
				} else {
					if (charToAppend) filtered.push(line.slice(1) + charToAppend);
					else filtered.push(line.slice(1));
					charToAppend = charAtStart;
				}
			} else if (charToAppend) {
				filtered.push(line + charToAppend);
				charToAppend = null;
			} else filtered.push(line);
		}
	});
	if (charToAppend) {
		const firstItem = filtered.length > 0 ? filtered[0] : "";
		return [String(charToAppend) + String(firstItem), ...filtered.slice(1)].reverse();
	} else return filtered.reverse();
};
var filterEndJP = (lines) => {
	const filtered = [];
	let charToPrepend = null;
	lines.forEach((line) => {
		if (line.trim().length === 0) filtered.push("");
		else {
			const chartAtEnd = line.slice(-1);
			if (LINE_END_FORBIDDEN_CHARS.includes(chartAtEnd)) {
				if (line.trim().length === 1) {
					filtered.push(line);
					charToPrepend = null;
				} else {
					if (charToPrepend) filtered.push(charToPrepend + line.slice(0, -1));
					else filtered.push(line.slice(0, -1));
					charToPrepend = chartAtEnd;
				}
			} else if (charToPrepend) {
				filtered.push(charToPrepend + line);
				charToPrepend = null;
			} else filtered.push(line);
		}
	});
	if (charToPrepend) {
		const lastItem = filtered.length > 0 ? filtered[filtered.length - 1] : "";
		const combinedItem = String(lastItem) + String(charToPrepend);
		return [...filtered.slice(0, -1), combinedItem];
	} else return filtered;
};
//#endregion
//#region src/splitRange.ts
var BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS = {
	tableBody: "tableBody",
	listItem: "listItem",
	textLine: "textLine"
};
var TABLE_BODY_SPLIT_UNIT = BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS.tableBody;
var LIST_ITEM_SPLIT_UNIT = BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS.listItem;
var TEXT_LINE_SPLIT_UNIT = BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS.textLine;
var createTableBodySplitRange = (start, end) => createDynamicLayoutSplitRange(TABLE_BODY_SPLIT_UNIT, start, end);
var createListItemSplitRange = (start, end) => createDynamicLayoutSplitRange(LIST_ITEM_SPLIT_UNIT, start, end);
var createTextLineSplitRange = (start, end) => createDynamicLayoutSplitRange(TEXT_LINE_SPLIT_UNIT, start, end);
var getTableBodyRange = (schema) => getDynamicLayoutSplitRange(schema, TABLE_BODY_SPLIT_UNIT);
var getListItemRange = (schema) => getDynamicLayoutSplitRange(schema, LIST_ITEM_SPLIT_UNIT);
var getTextLineRange = (schema) => getDynamicLayoutSplitRange(schema, TEXT_LINE_SPLIT_UNIT);
//#endregion
export { VERTICAL_ALIGN_MIDDLE as $, ALIGN_RIGHT as A, DYNAMIC_FIT_VERTICAL as B, getBoxInsets as C, ALIGN_CENTER as D, hasBoxDimension as E, DEFAULT_FONT_COLOR as F, PLACEHOLDER_FONT_COLOR as G, FONT_VARIANT_FALLBACK_ERROR as H, DEFAULT_FONT_VARIANT_FALLBACK as I, TEXT_FORMAT_INLINE_MARKDOWN as J, SYNTHETIC_BOLD_CSS_TEXT_SHADOW as K, DEFAULT_TEXT_FORMAT as L, CODE_HORIZONTAL_PADDING as M, DEFAULT_ALIGNMENT as N, ALIGN_JUSTIFY as O, DEFAULT_DYNAMIC_FIT as P, VERTICAL_ALIGN_BOTTOM as Q, DEFAULT_TEXT_OVERFLOW as R, getBoxDimensionPropPanelSchema as S, getSplitBoxDimension as T, FONT_VARIANT_FALLBACK_PLAIN as U, FONT_SIZE_ADJUSTMENT as V, FONT_VARIANT_FALLBACK_SYNTHETIC as W, TEXT_OVERFLOW_EXPAND as X, TEXT_FORMAT_PLAIN as Y, TEXT_OVERFLOW_VISIBLE as Z, isFirefox as _, createListItemSplitRange as a, createBoxDimension as b, getListItemRange as c, calculateDynamicFontSize as d, fetchRemoteFontData as f, heightOfFontAtSize as g, getFontKitFont as h, TEXT_LINE_SPLIT_UNIT as i, CODE_BACKGROUND_COLOR as j, ALIGN_LEFT as k, getTableBodyRange as l, getFontDescentInPt as m, LIST_ITEM_SPLIT_UNIT as n, createTableBodySplitRange as o, getBrowserVerticalFontAdjustments as p, SYNTHETIC_BOLD_OFFSET_RATIO as q, TABLE_BODY_SPLIT_UNIT as r, createTextLineSplitRange as s, BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS as t, getTextLineRange as u, splitTextToSize as v, getBoxVerticalInset as w, getBoxContentArea as x, widthOfTextAtSize as y, DYNAMIC_FIT_HORIZONTAL as z };

//# sourceMappingURL=splitRange-BHV0vb0Q.js.map