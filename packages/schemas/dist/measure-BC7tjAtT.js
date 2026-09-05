import { C as getBoxInsets, E as hasBoxDimension, M as CODE_HORIZONTAL_PADDING, T as getSplitBoxDimension, V as FONT_SIZE_ADJUSTMENT, d as calculateDynamicFontSize, g as heightOfFontAtSize, h as getFontKitFont, q as SYNTHETIC_BOLD_OFFSET_RATIO, u as getTextLineRange, v as splitTextToSize, w as getBoxVerticalInset, x as getBoxContentArea, y as widthOfTextAtSize } from "./splitRange-BHV0vb0Q.js";
import { getDefaultFont, getFallbackFontName, mm2pt, normalizeLinkHref, pt2mm } from "@pdfme/common";
//#region src/text/inlineMarkdown.ts
var MARKDOWN_ESCAPABLE_CHARS = /* @__PURE__ */ new Set([
	"\\",
	"*",
	"~",
	"`",
	"[",
	"]",
	"(",
	")"
]);
var MARKDOWN_ESCAPE_PATTERN = /[\\*~`[\]()]/g;
var MARKDOWN_UNESCAPE_PATTERN = /\\([\\*~`[\]()])/g;
var sameStyle = (a, b) => Boolean(a.bold) === Boolean(b.bold) && Boolean(a.italic) === Boolean(b.italic) && Boolean(a.strikethrough) === Boolean(b.strikethrough) && Boolean(a.code) === Boolean(b.code) && a.href === b.href;
var appendRun = (runs, text, style) => {
	if (!text) return;
	const lastRun = runs.at(-1);
	if (lastRun && sameStyle(lastRun, style)) {
		lastRun.text += text;
		return;
	}
	runs.push({
		text,
		...style.bold ? { bold: true } : {},
		...style.italic ? { italic: true } : {},
		...style.strikethrough ? { strikethrough: true } : {},
		...style.code ? { code: true } : {},
		...style.href ? { href: style.href } : {}
	});
};
var findClosingDelimiter = (value, delimiter, from) => {
	for (let i = from; i < value.length; i++) {
		if (value[i] === "\\") {
			i += 1;
			continue;
		}
		if (delimiter !== "`" && value[i] === "`") {
			const codeEnd = findClosingDelimiter(value, "`", i + 1);
			if (codeEnd === -1) continue;
			i = codeEnd;
			continue;
		}
		if (value.startsWith(delimiter, i)) return i;
	}
	return -1;
};
var getDelimiter = (value, index) => {
	if (value[index] === "`") return "`";
	if (value.startsWith("***", index)) return "***";
	if (value.startsWith("**", index)) return "**";
	if (value.startsWith("~~", index)) return "~~";
	if (value[index] === "*") return "*";
	return "";
};
var findLinkLabelEnd = (value, from, to) => {
	for (let index = from; index < to; index += 1) {
		if (value[index] === "\\") {
			index += 1;
			continue;
		}
		if (value[index] === "]") return index;
	}
	return -1;
};
var findLinkDestinationEnd = (value, from, to) => {
	let depth = 0;
	for (let index = from; index < to; index += 1) {
		if (value[index] === "\\") {
			index += 1;
			continue;
		}
		if (value[index] === "(") {
			depth += 1;
			continue;
		}
		if (value[index] === ")") {
			if (depth === 0) return index;
			depth -= 1;
		}
	}
	return -1;
};
var parseLinkAt = (value, index, to) => {
	if (value[index] !== "[") return void 0;
	const labelEnd = findLinkLabelEnd(value, index + 1, to);
	if (labelEnd === -1 || value[labelEnd + 1] !== "(") return void 0;
	const destinationStart = labelEnd + 2;
	const destinationEnd = findLinkDestinationEnd(value, destinationStart, to);
	if (destinationEnd === -1) return void 0;
	const href = value.slice(destinationStart, destinationEnd).replace(MARKDOWN_UNESCAPE_PATTERN, "$1");
	const safeHref = normalizeLinkHref(href);
	if (!safeHref) return void 0;
	return {
		labelStart: index + 1,
		labelEnd,
		href: safeHref,
		end: destinationEnd + 1
	};
};
var mergeStyle = (style, delimiter) => {
	if (delimiter === "***") return {
		...style,
		bold: true,
		italic: true
	};
	if (delimiter === "**") return {
		...style,
		bold: true
	};
	if (delimiter === "*") return {
		...style,
		italic: true
	};
	if (delimiter === "~~") return {
		...style,
		strikethrough: true
	};
	return style;
};
var parseRange = (value, from, to, style) => {
	const runs = [];
	let buffer = "";
	const flush = () => {
		appendRun(runs, buffer, style);
		buffer = "";
	};
	for (let index = from; index < to; index++) {
		const char = value[index];
		if (char === "\\" && index + 1 < to && MARKDOWN_ESCAPABLE_CHARS.has(value[index + 1])) {
			buffer += value[index + 1];
			index += 1;
			continue;
		}
		const link = style.href ? void 0 : parseLinkAt(value, index, to);
		if (link) {
			flush();
			parseRange(value, link.labelStart, link.labelEnd, {
				...style,
				href: link.href
			}).forEach((run) => appendRun(runs, run.text, run));
			index = link.end - 1;
			continue;
		}
		const delimiter = getDelimiter(value, index);
		if (!delimiter) {
			buffer += char;
			continue;
		}
		const closingIndex = findClosingDelimiter(value, delimiter, index + delimiter.length);
		if (closingIndex === -1 || closingIndex + delimiter.length > to) {
			buffer += char;
			continue;
		}
		flush();
		if (delimiter === "`") appendRun(runs, value.slice(index + 1, closingIndex).replace(MARKDOWN_UNESCAPE_PATTERN, "$1"), {
			...style,
			code: true
		});
		else parseRange(value, index + delimiter.length, closingIndex, mergeStyle(style, delimiter)).forEach((run) => appendRun(runs, run.text, run));
		index = closingIndex + delimiter.length - 1;
	}
	flush();
	return runs;
};
var parseInlineMarkdown = (value) => {
	if (!value) return [];
	return parseRange(value, 0, value.length, {});
};
var escapeInlineMarkdown = (value) => value.replace(MARKDOWN_ESCAPE_PATTERN, (char) => `\\${char}`);
var stripInlineMarkdown = (value) => parseInlineMarkdown(value).map((run) => run.text).join("");
//#endregion
//#region src/text/richText.ts
var richTextWordSegmenter = new Intl.Segmenter(void 0, { granularity: "word" });
var richTextGraphemeSegmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" });
var getBaseFontName = (schema, font) => schema.fontName && font[schema.fontName] ? schema.fontName : getFallbackFontName(font);
var getLoadedFontName = (font, fontName) => fontName && font[fontName] ? fontName : void 0;
var isInlineMarkdownTextSchema = (schema) => schema.textFormat === "inline-markdown" && !(schema.type === "text" && schema.readOnly !== true);
var resolveFontVariant = (run, schema, font) => {
	const baseFontName = getBaseFontName(schema, font);
	const variants = schema.fontVariants ?? {};
	const fallback = schema.fontVariantFallback ?? "synthetic";
	let fontName = baseFontName;
	let needsBold = Boolean(run.bold);
	let needsItalic = Boolean(run.italic);
	if (run.code) fontName = getLoadedFontName(font, variants.code) ?? baseFontName;
	else if (run.bold && run.italic) {
		const boldItalic = getLoadedFontName(font, variants.boldItalic);
		const italic = getLoadedFontName(font, variants.italic);
		const bold = getLoadedFontName(font, variants.bold);
		if (boldItalic) {
			fontName = boldItalic;
			needsBold = false;
			needsItalic = false;
		} else if (italic) {
			fontName = italic;
			needsItalic = false;
		} else if (bold) {
			fontName = bold;
			needsBold = false;
		}
	} else if (run.bold) {
		const bold = getLoadedFontName(font, variants.bold);
		if (bold) {
			fontName = bold;
			needsBold = false;
		}
	} else if (run.italic) {
		const italic = getLoadedFontName(font, variants.italic);
		if (italic) {
			fontName = italic;
			needsItalic = false;
		}
	}
	if ((needsBold || needsItalic || run.code && !getLoadedFontName(font, variants.code)) && fallback === "error") throw new Error(`[@pdfme/schemas] Missing font variant for markdown text in field "${schema.name}".`);
	return {
		fontName,
		syntheticBold: fallback !== "plain" && needsBold,
		syntheticItalic: fallback !== "plain" && needsItalic
	};
};
var resolveRichTextRuns = async (arg) => {
	const { runs, schema, font, _cache } = arg;
	const fontKitCache = /* @__PURE__ */ new Map();
	const getResolvedFontKitFont = async (fontName) => {
		const cached = fontKitCache.get(fontName);
		if (cached) return cached;
		const fontKitFont = await getFontKitFont(fontName, font, _cache);
		fontKitCache.set(fontName, fontKitFont);
		return fontKitFont;
	};
	return Promise.all(runs.map(async (run) => {
		const resolution = resolveFontVariant(run, schema, font);
		return {
			...run,
			...resolution,
			fontKitFont: await getResolvedFontKitFont(resolution.fontName)
		};
	}));
};
var measureRunText = (run, text, fontSize, characterSpacing) => {
	const syntheticBoldWidth = run.syntheticBold ? fontSize * SYNTHETIC_BOLD_OFFSET_RATIO * 2 : 0;
	const syntheticItalicWidth = run.syntheticItalic ? heightOfFontAtSize(run.fontKitFont, fontSize) * Math.tan(12 * Math.PI / 180) : 0;
	return widthOfTextAtSize(text, run.fontKitFont, fontSize, characterSpacing) + syntheticBoldWidth + syntheticItalicWidth + (run.code ? CODE_HORIZONTAL_PADDING * 2 : 0);
};
var createLine = () => ({
	runs: [],
	width: 0,
	hardBreak: false
});
var pushRunToLine = (line, run, text, fontSize, characterSpacing) => {
	if (!text) return;
	const width = measureRunText(run, text, fontSize, characterSpacing);
	const lastRun = line.runs[line.runs.length - 1];
	if (lastRun && canMergeRichTextRuns(lastRun, run)) {
		const previousWidth = lastRun.width;
		lastRun.text += text;
		lastRun.width = measureRunText(lastRun, lastRun.text, fontSize, characterSpacing);
		line.width += lastRun.width - previousWidth;
		return;
	}
	if (line.runs.length > 0) line.width += characterSpacing;
	line.runs.push({
		...run,
		text,
		width
	});
	line.width += width;
};
var canMergeRichTextRuns = (a, b) => a.fontName === b.fontName && a.fontKitFont === b.fontKitFont && a.syntheticBold === b.syntheticBold && a.syntheticItalic === b.syntheticItalic && a.bold === b.bold && a.italic === b.italic && a.strikethrough === b.strikethrough && a.code === b.code && a.href === b.href;
var measurePiecesWidth = (pieces, fontSize, characterSpacing) => {
	let width = 0;
	let hasText = false;
	pieces.forEach((piece) => {
		if (!piece.text) return;
		if (hasText) width += characterSpacing;
		width += measureRunText(piece.run, piece.text, fontSize, characterSpacing);
		hasText = true;
	});
	return width;
};
var sliceRunPieces = (pieces, startIndex, endIndex) => {
	const result = [];
	let offset = 0;
	pieces.forEach((piece) => {
		const pieceStart = offset;
		const pieceEnd = pieceStart + piece.text.length;
		const sliceStart = Math.max(startIndex, pieceStart);
		const sliceEnd = Math.min(endIndex, pieceEnd);
		if (sliceStart < sliceEnd) result.push({
			run: piece.run,
			text: piece.text.slice(sliceStart - pieceStart, sliceEnd - pieceStart)
		});
		offset = pieceEnd;
	});
	return result;
};
var segmentRunPiecesByWord = (runs, onSegment, onHardBreak) => {
	let paragraphPieces = [];
	const flushParagraph = () => {
		if (paragraphPieces.length === 0) return;
		const paragraphText = paragraphPieces.map((piece) => piece.text).join("");
		Array.from(richTextWordSegmenter.segment(paragraphText), ({ segment, index }) => {
			const pieces = sliceRunPieces(paragraphPieces, index, index + segment.length);
			if (pieces.length > 0) onSegment(pieces);
		});
		paragraphPieces = [];
	};
	runs.forEach((run) => {
		run.text.split(/(\r\n|\r|\n)/).forEach((part) => {
			if (part === "\r\n" || part === "\r" || part === "\n") {
				flushParagraph();
				onHardBreak();
				return;
			}
			if (part) paragraphPieces.push({
				run,
				text: part
			});
		});
	});
	flushParagraph();
};
var splitIntoGraphemes = (value) => Array.from(richTextGraphemeSegmenter.segment(value), ({ segment }) => segment);
var countRichTextLineGraphemes = (line) => splitIntoGraphemes(line.runs.map((run) => run.text).join("")).length;
var layoutRichTextLines = (arg) => {
	const { runs, fontSize, characterSpacing, boxWidthInPt } = arg;
	const lines = [];
	let currentLine = createLine();
	const pushCurrentLine = (hardBreak) => {
		currentLine.hardBreak = hardBreak;
		lines.push(currentLine);
		currentLine = createLine();
	};
	const pushPiecesToLine = (pieces) => {
		pieces.forEach((piece) => {
			pushRunToLine(currentLine, piece.run, piece.text, fontSize, characterSpacing);
		});
	};
	const pushOversizedText = (run, text) => {
		let remainingText = text;
		while (remainingText.length > 0) {
			const pendingSpacing = currentLine.runs.length > 0 ? characterSpacing : 0;
			const remainingWidth = Math.max(boxWidthInPt - currentLine.width - pendingSpacing, 0);
			const remainingTextWidth = measureRunText(run, remainingText, fontSize, characterSpacing);
			if (remainingTextWidth <= remainingWidth || currentLine.runs.length === 0 && remainingTextWidth <= boxWidthInPt) {
				pushRunToLine(currentLine, run, remainingText, fontSize, characterSpacing);
				return;
			}
			if (currentLine.runs.length > 0 && remainingTextWidth <= boxWidthInPt) {
				pushCurrentLine(false);
				continue;
			}
			const graphemes = splitIntoGraphemes(remainingText);
			let fittingText = "";
			let fittingLength = 0;
			for (const grapheme of graphemes) {
				const candidate = fittingText + grapheme;
				const candidateWidth = measureRunText(run, candidate, fontSize, characterSpacing);
				const maxWidth = currentLine.runs.length === 0 ? boxWidthInPt : remainingWidth;
				if (candidateWidth > maxWidth) {
					if (fittingText) break;
					if (currentLine.runs.length > 0) break;
				}
				fittingText = candidate;
				fittingLength += grapheme.length;
				if (candidateWidth > maxWidth) break;
			}
			if (!fittingText) {
				pushCurrentLine(false);
				continue;
			}
			pushRunToLine(currentLine, run, fittingText, fontSize, characterSpacing);
			remainingText = remainingText.slice(fittingLength);
			if (remainingText.length > 0) pushCurrentLine(false);
		}
	};
	const pushSegment = (pieces) => {
		const segmentWidth = measurePiecesWidth(pieces, fontSize, characterSpacing);
		const pendingSpacing = currentLine.runs.length > 0 ? characterSpacing : 0;
		if (segmentWidth <= Math.max(boxWidthInPt - currentLine.width - pendingSpacing, 0) || currentLine.runs.length === 0 && segmentWidth <= boxWidthInPt) {
			pushPiecesToLine(pieces);
			return;
		}
		if (currentLine.runs.length > 0) {
			pushCurrentLine(false);
			if (segmentWidth <= boxWidthInPt) {
				pushPiecesToLine(pieces);
				return;
			}
		}
		pieces.forEach((piece) => pushOversizedText(piece.run, piece.text));
	};
	segmentRunPiecesByWord(runs, pushSegment, () => pushCurrentLine(true));
	if (currentLine.runs.length > 0 || lines.length === 0) pushCurrentLine(false);
	return lines;
};
var measureParagraphWidths = (runs, fontSize, characterSpacing) => {
	const widths = [];
	let paragraphPieces = [];
	const pushWidth = () => {
		widths.push(measurePiecesWidth(paragraphPieces, fontSize, characterSpacing));
		paragraphPieces = [];
	};
	runs.forEach((run) => {
		run.text.split(/(\r\n|\r|\n)/).forEach((part) => {
			if (part === "\r\n" || part === "\r" || part === "\n") {
				pushWidth();
				return;
			}
			if (part) paragraphPieces.push({
				run,
				text: part
			});
		});
	});
	pushWidth();
	return widths;
};
var getLineHeightAtSize = (line, fontSize) => {
	if (line.runs.length === 0) return fontSize;
	return Math.max(...line.runs.map((run) => heightOfFontAtSize(run.fontKitFont, fontSize)));
};
var calculateDynamicRichTextFontSize = async (arg) => {
	const { value, schema, font, _cache, startingFontSize } = arg;
	const { fontSize: schemaFontSize, dynamicFontSize: dynamicFontSizeSetting, characterSpacing: schemaCharacterSpacing, lineHeight = 1 } = schema;
	const { width: boxWidth, height: boxHeight } = getBoxContentArea(schema);
	const fontSize = startingFontSize || schemaFontSize || 13;
	if (!dynamicFontSizeSetting) return fontSize;
	if (dynamicFontSizeSetting.max < dynamicFontSizeSetting.min) return fontSize;
	const resolvedRuns = await resolveRichTextRuns({
		runs: parseInlineMarkdown(value),
		schema,
		font,
		_cache
	});
	const characterSpacing = schemaCharacterSpacing ?? 0;
	const dynamicFontFit = dynamicFontSizeSetting.fit ?? "vertical";
	const boxWidthInPt = mm2pt(boxWidth);
	let dynamicFontSize = fontSize;
	if (dynamicFontSize < dynamicFontSizeSetting.min) dynamicFontSize = dynamicFontSizeSetting.min;
	else if (dynamicFontSize > dynamicFontSizeSetting.max) dynamicFontSize = dynamicFontSizeSetting.max;
	const calculateConstraints = (size) => {
		let totalWidthInMm = 0;
		let totalHeightInMm = 0;
		layoutRichTextLines({
			runs: resolvedRuns,
			fontSize: size,
			characterSpacing,
			boxWidthInPt
		}).forEach((line, lineIndex) => {
			if (dynamicFontFit === "vertical") totalWidthInMm = Math.max(totalWidthInMm, pt2mm(line.width));
			if (lineIndex === 0) totalHeightInMm += pt2mm(getLineHeightAtSize(line, size) * lineHeight);
			else totalHeightInMm += pt2mm(size * lineHeight);
		});
		if (dynamicFontFit === "horizontal") measureParagraphWidths(resolvedRuns, size, characterSpacing).forEach((paragraphWidth) => {
			totalWidthInMm = Math.max(totalWidthInMm, pt2mm(paragraphWidth));
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
//#endregion
//#region src/text/measure.ts
var applyTextLineRange = (lines, range) => {
	if (!range) return lines;
	return lines.slice(range.start, range.end ?? lines.length);
};
var plainTextLinesToValue = (lines) => lines.map((line) => line.replace(/[\r\n]+$/g, "")).join("\n");
var splitReplacementTextToLines = (value) => {
	const lines = [];
	let start = 0;
	for (let i = 0; i < value.length; i += 1) {
		const charCode = value.charCodeAt(i);
		if (charCode !== 10 && charCode !== 13) continue;
		lines.push(value.slice(start, i));
		if (charCode === 13 && value.charCodeAt(i + 1) === 10) i += 1;
		start = i + 1;
	}
	lines.push(value.slice(start));
	return lines;
};
var measureTextLines = async ({ value, schema, font = getDefaultFont(), _cache = /* @__PURE__ */ new Map(), ignoreDynamicFontSize = false }) => {
	const fontSize = schema.fontSize ?? 13;
	const lineHeight = schema.lineHeight ?? 1;
	const characterSpacing = schema.characterSpacing ?? 0;
	const boxWidthInPt = mm2pt(getBoxContentArea(schema).width);
	if (isInlineMarkdownTextSchema(schema)) {
		const resolvedRuns = await resolveRichTextRuns({
			runs: parseInlineMarkdown(value),
			schema,
			font,
			_cache
		});
		const resolvedFontSize = schema.dynamicFontSize && schema.height > 0 && !ignoreDynamicFontSize ? await calculateDynamicRichTextFontSize({
			value,
			schema,
			font,
			_cache
		}) : fontSize;
		const lines = layoutRichTextLines({
			runs: resolvedRuns,
			fontSize: resolvedFontSize,
			characterSpacing,
			boxWidthInPt
		});
		return {
			lines: lines.map((line) => line.runs.map((run) => run.text).join("")),
			lineHeights: measureRichTextLineHeights(lines, resolvedFontSize, lineHeight)
		};
	}
	const fontKitFont = await getFontKitFont(schema.fontName, font, _cache);
	const resolvedFontSize = schema.dynamicFontSize && schema.height > 0 && !ignoreDynamicFontSize ? calculateDynamicFontSize({
		textSchema: schema,
		fontKitFont,
		value
	}) : fontSize;
	const lines = splitTextToSize({
		value,
		characterSpacing,
		fontSize: resolvedFontSize,
		fontKitFont,
		boxWidthInPt
	});
	return {
		lines,
		lineHeights: measurePlainTextLineHeights(lines, fontKitFont, resolvedFontSize, lineHeight)
	};
};
var mergeTextLineRangeValue = async ({ value, replacement, schema, font = getDefaultFont(), _cache = /* @__PURE__ */ new Map() }) => {
	const range = getTextLineRange(schema);
	if (!range) return replacement;
	const { lines } = await measureTextLines({
		value,
		schema,
		font,
		_cache,
		ignoreDynamicFontSize: true
	});
	const { start, end = lines.length } = range;
	const nextLines = [...lines];
	nextLines.splice(start, end - start, ...splitReplacementTextToLines(replacement));
	return plainTextLinesToValue(nextLines);
};
var measureTextHeight = async (args) => {
	const { lineHeights } = await measureTextLines(args);
	return sumLineHeights(lineHeights) + getBoxVerticalInset(args.schema);
};
var sumLineHeights = (lineHeights) => lineHeights.reduce((sum, height) => sum + height, 0);
var getTextLineHeightsWithBox = (lineHeights, schema) => lineHeights.map((height, index) => height + getTextBoxVerticalInsetForRange(schema, {
	start: index,
	end: index + 1
}, lineHeights.length));
var getTextSplitBoxStyle = (schema, range, totalLines) => {
	const { borderWidth, padding } = getBoxInsets(schema);
	return {
		...hasBoxDimension(schema.borderWidth) ? { borderWidth: getSplitBoxDimension(borderWidth, range, totalLines) } : {},
		...hasBoxDimension(schema.padding) ? { padding: getSplitBoxDimension(padding, range, totalLines) } : {}
	};
};
var getTextBoxVerticalInsetForRange = (schema, range, totalLines) => {
	const { borderWidth, padding } = getBoxInsets(schema);
	const splitBorderWidth = getSplitBoxDimension(borderWidth, range, totalLines);
	const splitPadding = getSplitBoxDimension(padding, range, totalLines);
	return splitBorderWidth.top + splitBorderWidth.bottom + splitPadding.top + splitPadding.bottom;
};
var measurePlainTextLineHeights = (lines, fontKitFont, fontSize, lineHeight) => {
	if (lines.length === 0) return [];
	const firstLineHeight = heightOfFontAtSize(fontKitFont, fontSize) * lineHeight;
	const otherLineHeight = fontSize * lineHeight;
	return lines.map((_, index) => pt2mm(index === 0 ? firstLineHeight : otherLineHeight));
};
var measureRichTextLineHeights = (lines, fontSize, lineHeight) => {
	if (lines.length === 0) return [];
	return lines.map((line, index) => pt2mm((index === 0 ? getRichTextLineHeight(line, fontSize) : fontSize) * lineHeight));
};
var getRichTextLineHeight = (line, fontSize) => {
	if (line.runs.length === 0) return fontSize;
	return Math.max(...line.runs.map((run) => heightOfFontAtSize(run.fontKitFont, fontSize)));
};
//#endregion
export { stripInlineMarkdown as _, measureTextLines as a, sumLineHeights as c, isInlineMarkdownTextSchema as d, layoutRichTextLines as f, parseInlineMarkdown as g, escapeInlineMarkdown as h, measureTextHeight as i, calculateDynamicRichTextFontSize as l, resolveRichTextRuns as m, getTextLineHeightsWithBox as n, mergeTextLineRangeValue as o, resolveFontVariant as p, getTextSplitBoxStyle as r, plainTextLinesToValue as s, applyTextLineRange as t, countRichTextLineGraphemes as u };

//# sourceMappingURL=measure-BC7tjAtT.js.map