import { $ as VERTICAL_ALIGN_MIDDLE, A as ALIGN_RIGHT, B as DYNAMIC_FIT_VERTICAL, C as getBoxInsets, D as ALIGN_CENTER, E as hasBoxDimension, F as DEFAULT_FONT_COLOR, G as PLACEHOLDER_FONT_COLOR, H as FONT_VARIANT_FALLBACK_ERROR, I as DEFAULT_FONT_VARIANT_FALLBACK, J as TEXT_FORMAT_INLINE_MARKDOWN, K as SYNTHETIC_BOLD_CSS_TEXT_SHADOW, L as DEFAULT_TEXT_FORMAT, M as CODE_HORIZONTAL_PADDING, N as DEFAULT_ALIGNMENT, O as ALIGN_JUSTIFY, P as DEFAULT_DYNAMIC_FIT, Q as VERTICAL_ALIGN_BOTTOM, R as DEFAULT_TEXT_OVERFLOW, S as getBoxDimensionPropPanelSchema, U as FONT_VARIANT_FALLBACK_PLAIN, W as FONT_VARIANT_FALLBACK_SYNTHETIC, X as TEXT_OVERFLOW_EXPAND, Y as TEXT_FORMAT_PLAIN, Z as TEXT_OVERFLOW_VISIBLE, _ as isFirefox, b as createBoxDimension, d as calculateDynamicFontSize, f as fetchRemoteFontData, g as heightOfFontAtSize, h as getFontKitFont, j as CODE_BACKGROUND_COLOR, m as getFontDescentInPt, p as getBrowserVerticalFontAdjustments, q as SYNTHETIC_BOLD_OFFSET_RATIO, u as getTextLineRange, v as splitTextToSize, x as getBoxContentArea, y as widthOfTextAtSize, z as DYNAMIC_FIT_HORIZONTAL } from "./splitRange-BHV0vb0Q.js";
import { _ as stripInlineMarkdown, d as isInlineMarkdownTextSchema, f as layoutRichTextLines, g as parseInlineMarkdown, l as calculateDynamicRichTextFontSize, m as resolveRichTextRuns, s as plainTextLinesToValue, t as applyTextLineRange, u as countRichTextLineGraphemes } from "./measure-BC7tjAtT.js";
import { c as HEX_COLOR_PATTERN } from "./dynamicTemplate-BgH01dcs.js";
import { c as isEditable, i as createSvgStr, n as convertForPdfLayoutProps, o as hex2PrintingColor, u as rotatePoint } from "./utils-nI6J7wZM.js";
import { DEFAULT_FONT_NAME, getDefaultFont, getFallbackFontName, getInternalLinkTarget, isBlankPdf, mm2pt, normalizeLinkHref, normalizeSafeLinkUri, registerInternalLinkAnnotation } from "@pdfme/common";
import { PDFName, PDFString } from "@pdfme/pdf-lib";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Strikethrough, TextCursorInput, Underline } from "lucide";
//#region src/text/linkAnnotation.ts
var addUriLinkAnnotation = (arg) => {
	const { pdfDoc, page, uri, rect, borderWidth = 0 } = arg;
	const safeUri = normalizeSafeLinkUri(uri);
	if (!safeUri || rect.width <= 0 || rect.height <= 0) return;
	const annotationRef = pdfDoc.context.register(pdfDoc.context.obj({
		Type: PDFName.of("Annot"),
		Subtype: PDFName.of("Link"),
		Rect: [
			rect.x,
			rect.y,
			rect.x + rect.width,
			rect.y + rect.height
		],
		Border: [
			0,
			0,
			borderWidth
		],
		A: {
			Type: PDFName.of("Action"),
			S: PDFName.of("URI"),
			URI: PDFString.of(safeUri)
		}
	}));
	page.node.addAnnot(annotationRef);
};
//#endregion
//#region src/text/richTextPdfRender.ts
var getSyntheticBoldWidth = (run, fontSize) => run.syntheticBold ? fontSize * SYNTHETIC_BOLD_OFFSET_RATIO * 2 : 0;
var getSyntheticItalicWidth = (run, fontSize) => run.syntheticItalic ? heightOfFontAtSize(run.fontKitFont, fontSize) * Math.tan(12 * Math.PI / 180) : 0;
var getRunWidth = (run, fontSize, characterSpacing) => widthOfTextAtSize(run.text, run.fontKitFont, fontSize, characterSpacing) + getSyntheticBoldWidth(run, fontSize) + getSyntheticItalicWidth(run, fontSize) + (run.code ? CODE_HORIZONTAL_PADDING * 2 : 0);
var getPdfFontFromObj = (run, pdfFontObj) => {
	const pdfFont = pdfFontObj[run.fontName];
	if (!pdfFont) throw new Error(`[@pdfme/schemas] Missing embedded font "${run.fontName}".`);
	return pdfFont;
};
var embedFontsForRuns = async (runs, embedPdfFont) => {
	const fontNames = Array.from(new Set(runs.map((run) => run.fontName)));
	const pdfFonts = await Promise.all(fontNames.map(async (fontName) => [fontName, await embedPdfFont(fontName)]));
	return Object.fromEntries(pdfFonts);
};
var drawDecorationLine = (arg) => {
	const { page, x, y, width, rotate, pivotPoint, fontSize, color, opacity } = arg;
	if (width <= 0) return;
	page.drawLine({
		start: rotatePoint({
			x,
			y
		}, pivotPoint, rotate.angle),
		end: rotatePoint({
			x: x + width,
			y
		}, pivotPoint, rotate.angle),
		thickness: 1 / 12 * fontSize,
		color,
		opacity
	});
};
var getAxisAlignedRect = (arg) => {
	const { x, y, width, height, rotate, pivotPoint } = arg;
	if (rotate.angle === 0) return {
		x,
		y,
		width,
		height
	};
	const points = [
		{
			x,
			y
		},
		{
			x: x + width,
			y
		},
		{
			x: x + width,
			y: y + height
		},
		{
			x,
			y: y + height
		}
	].map((point) => rotatePoint(point, pivotPoint, rotate.angle));
	const xs = points.map((point) => point.x);
	const ys = points.map((point) => point.y);
	const minX = Math.min(...xs);
	const minY = Math.min(...ys);
	return {
		x: minX,
		y: minY,
		width: Math.max(...xs) - minX,
		height: Math.max(...ys) - minY
	};
};
var getLinkAnnotationRect = (arg) => {
	const { run, x, y, width, rotate, pivotPoint, fontSize } = arg;
	const textHeight = heightOfFontAtSize(run.fontKitFont, fontSize);
	const descent = getFontDescentInPt(run.fontKitFont, fontSize);
	return getAxisAlignedRect({
		x,
		y: y + descent,
		width,
		height: textHeight - descent,
		rotate,
		pivotPoint
	});
};
var drawRun = (arg) => {
	const { page, pdfLib, run, pdfFont, x, y, rotate, pivotPoint, fontSize, lineHeight, color, opacity, colorType, characterSpacing, strikethrough, underline } = arg;
	const runWidth = getRunWidth(run, fontSize, characterSpacing);
	const codePadding = run.code ? CODE_HORIZONTAL_PADDING : 0;
	const textX = x + codePadding;
	const textWidth = runWidth - codePadding * 2;
	const textHeight = heightOfFontAtSize(run.fontKitFont, fontSize);
	if (run.code) {
		const bgX = x;
		const bgY = y - textHeight * .2;
		const bgPoint = rotate.angle === 0 ? {
			x: bgX,
			y: bgY
		} : rotatePoint({
			x: bgX,
			y: bgY
		}, pivotPoint, rotate.angle);
		page.drawRectangle({
			x: bgPoint.x,
			y: bgPoint.y,
			width: runWidth,
			height: textHeight * 1.2,
			rotate,
			color: hex2PrintingColor(CODE_BACKGROUND_COLOR, colorType),
			opacity
		});
	}
	if (strikethrough && runWidth > 0) drawDecorationLine({
		page,
		x: textX,
		y: y + textHeight / 3,
		width: textWidth,
		rotate,
		pivotPoint,
		fontSize,
		color,
		opacity
	});
	if (underline && runWidth > 0) drawDecorationLine({
		page,
		x: textX,
		y: y - textHeight / 12,
		width: textWidth,
		rotate,
		pivotPoint,
		fontSize,
		color,
		opacity
	});
	const drawAt = (drawX) => {
		const point = rotate.angle === 0 ? {
			x: drawX,
			y
		} : rotatePoint({
			x: drawX,
			y
		}, pivotPoint, rotate.angle);
		page.drawText(run.text, {
			x: point.x,
			y: point.y,
			rotate,
			size: fontSize,
			color,
			lineHeight: lineHeight * fontSize,
			font: pdfFont,
			opacity,
			...run.syntheticItalic ? { ySkew: pdfLib.degrees(12) } : {}
		});
	};
	drawAt(textX);
	if (run.syntheticBold) {
		const offset = fontSize * SYNTHETIC_BOLD_OFFSET_RATIO;
		for (let i = 1; i <= 2; i++) drawAt(textX + offset * i);
	}
};
var renderInlineMarkdownText = async (arg) => {
	const { value, schema, font, embedPdfFont, fontKitFont, pdfDoc, page, pdfLib, _cache, colorType, fontSize, color, alignment, verticalAlignment, lineHeight, characterSpacing, x, y, width, height, pivotPoint, rotate, opacity } = arg;
	const richTextRuns = parseInlineMarkdown(value);
	const resolvedRuns = await resolveRichTextRuns({
		runs: richTextRuns,
		schema,
		font,
		_cache
	});
	const allLines = layoutRichTextLines({
		runs: resolvedRuns,
		fontSize,
		characterSpacing,
		boxWidthInPt: width
	});
	const lineRange = getTextLineRange(schema);
	const lines = applyTextLineRange(allLines, lineRange);
	const lineRangeStart = lineRange?.start ?? 0;
	const pdfFontObj = await embedFontsForRuns(lines.flatMap((line) => line.runs), embedPdfFont);
	const firstLineTextHeight = heightOfFontAtSize(fontKitFont, fontSize);
	const descent = getFontDescentInPt(fontKitFont, fontSize);
	const halfLineHeightAdjustment = lineHeight === 0 ? 0 : (lineHeight - 1) * fontSize / 2;
	let yOffset = 0;
	if (verticalAlignment === "top") yOffset = firstLineTextHeight + halfLineHeightAdjustment;
	else {
		const otherLinesHeight = lineHeight * fontSize * (lines.length - 1);
		if (verticalAlignment === "bottom") yOffset = height - otherLinesHeight + descent - halfLineHeightAdjustment;
		else if (verticalAlignment === "middle") yOffset = (height - otherLinesHeight - firstLineTextHeight + descent) / 2 + firstLineTextHeight;
	}
	lines.forEach((line, rowIndex) => {
		if (line.runs.length === 0) return;
		let textWidth = line.width;
		let spacing = characterSpacing;
		if (alignment === "justify" && !line.hardBreak && lineRangeStart + rowIndex < allLines.length - 1) {
			const graphemeCount = countRichTextLineGraphemes(line);
			if (graphemeCount > 0) {
				spacing += (width - textWidth) / graphemeCount;
				textWidth = width;
			}
		}
		let xLine = x;
		if (alignment === "center") xLine += (width - textWidth) / 2;
		else if (alignment === "right") xLine += width - textWidth;
		const yLine = y + height - yOffset - lineHeight * fontSize * rowIndex;
		page.pushOperators(pdfLib.setCharacterSpacing(spacing));
		if (schema.strikethrough || schema.underline) {
			const textHeight = Math.max(...line.runs.map((run) => heightOfFontAtSize(run.fontKitFont, fontSize)));
			if (schema.strikethrough) drawDecorationLine({
				page,
				x: xLine,
				y: yLine + textHeight / 3,
				width: textWidth,
				rotate,
				pivotPoint,
				fontSize,
				color,
				opacity
			});
			if (schema.underline) drawDecorationLine({
				page,
				x: xLine,
				y: yLine - textHeight / 12,
				width: textWidth,
				rotate,
				pivotPoint,
				fontSize,
				color,
				opacity
			});
		}
		line.runs.reduce((currentX, run, runIndex) => {
			const runWidth = getRunWidth(run, fontSize, spacing);
			const pdfFont = getPdfFontFromObj(run, pdfFontObj);
			drawRun({
				page,
				pdfLib,
				run,
				pdfFont,
				x: currentX,
				y: yLine,
				rotate,
				pivotPoint,
				fontSize,
				lineHeight,
				color,
				opacity,
				colorType,
				characterSpacing: spacing,
				strikethrough: Boolean(run.strikethrough),
				underline: Boolean(run.href) && !schema.underline
			});
			if (run.href) {
				const rect = getLinkAnnotationRect({
					run,
					x: currentX,
					y: yLine,
					width: runWidth,
					rotate,
					pivotPoint,
					fontSize
				});
				const targetName = getInternalLinkTarget(run.href);
				if (targetName) registerInternalLinkAnnotation({
					_cache,
					page,
					targetName,
					rect
				});
				else addUriLinkAnnotation({
					pdfDoc,
					page,
					uri: run.href,
					rect
				});
			}
			return currentX + runWidth + (runIndex === line.runs.length - 1 ? 0 : spacing);
		}, xLine);
	});
};
//#endregion
//#region src/text/overflow.ts
var TEXT_OVERFLOW_EXPAND_SCHEMA_TYPES = /* @__PURE__ */ new Set(["text", "multiVariableText"]);
var isTextOverflowExpandSchema = (schema) => schema.type === void 0 || TEXT_OVERFLOW_EXPAND_SCHEMA_TYPES.has(schema.type);
var canUseTextOverflowExpand = (schema, basePdf) => !isTextOverflowExpandSchema(schema) || basePdf === void 0 || isBlankPdf(basePdf);
var isTextOverflowExpand = (schema, basePdf) => canUseTextOverflowExpand(schema, basePdf) && schema.overflow === "expand";
var shouldUseDynamicFontSize = (schema, basePdf) => Boolean(schema.dynamicFontSize) && !isTextOverflowExpand(schema, basePdf);
//#endregion
//#region src/text/pdfRender.ts
var PDF_FONT_CACHE_KEY = "text-pdf-font-cache";
var getPdfFontCache = (_cache) => {
	let pdfFontCache = _cache.get(PDF_FONT_CACHE_KEY);
	if (!pdfFontCache) {
		pdfFontCache = {};
		_cache.set(PDF_FONT_CACHE_KEY, pdfFontCache);
	}
	return pdfFontCache;
};
var embedAndGetFont = (arg) => {
	const { pdfDoc, font, fontName, _cache } = arg;
	const pdfFontCache = getPdfFontCache(_cache);
	const cachedFont = pdfFontCache[fontName];
	if (cachedFont) return cachedFont;
	const fontValue = font[fontName];
	if (!fontValue) return Promise.reject(/* @__PURE__ */ new Error(`[@pdfme/schemas] Font "${fontName}" is not found.`));
	const pdfFontPromise = (async () => {
		let fontData = fontValue.data;
		if (typeof fontData === "string" && fontData.startsWith("http")) fontData = await fetchRemoteFontData(fontData);
		return pdfDoc.embedFont(fontData, { subset: typeof fontValue.subset === "undefined" ? true : fontValue.subset });
	})();
	pdfFontCache[fontName] = pdfFontPromise;
	return pdfFontPromise;
};
var getFontProp = ({ value, fontKitFont, schema, basePdf, colorType, fontSize: resolvedFontSize }) => {
	const fontSize = resolvedFontSize ?? (shouldUseDynamicFontSize(schema, basePdf) ? calculateDynamicFontSize({
		textSchema: schema,
		fontKitFont,
		value
	}) : schema.fontSize ?? 13);
	const color = hex2PrintingColor(schema.fontColor || "#000000", colorType);
	return {
		alignment: schema.alignment ?? "left",
		verticalAlignment: schema.verticalAlignment ?? "top",
		lineHeight: schema.lineHeight ?? 1,
		characterSpacing: schema.characterSpacing ?? 0,
		fontSize,
		color
	};
};
var graphemeSegmenter;
var getGraphemeSegmenter = () => {
	graphemeSegmenter ?? (graphemeSegmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" }));
	return graphemeSegmenter;
};
var pdfRender = async (arg) => {
	const { value, pdfDoc, pdfLib, page, options, schema, basePdf, _cache } = arg;
	const { font = getDefaultFont(), colorType } = options;
	const pageHeight = page.getHeight();
	const { width, height, rotate, position: { x, y }, opacity } = convertForPdfLayoutProps({
		schema,
		pageHeight,
		applyRotateTranslate: false
	});
	const pivotPoint = {
		x: x + width / 2,
		y: pageHeight - mm2pt(schema.position.y) - height / 2
	};
	drawTextBoxDecoration({
		page,
		schema,
		colorType,
		x,
		y,
		width,
		height,
		rotate,
		pivotPoint
	});
	if (!value) return;
	const fontName = schema.fontName ? schema.fontName : getFallbackFontName(font);
	const enableInlineMarkdown = isInlineMarkdownTextSchema(schema);
	const contentArea = getBoxContentArea(schema);
	const contentX = x + mm2pt(contentArea.leftInset);
	const contentY = y + mm2pt(contentArea.bottomInset);
	const contentWidth = mm2pt(contentArea.width);
	const contentHeight = mm2pt(contentArea.height);
	const pdfFontValuePromise = enableInlineMarkdown ? void 0 : embedAndGetFont({
		pdfDoc,
		font,
		fontName,
		_cache
	});
	const fontKitFont = await getFontKitFont(schema.fontName, font, _cache);
	const { fontSize, color, alignment, verticalAlignment, lineHeight, characterSpacing } = getFontProp({
		value: enableInlineMarkdown ? stripInlineMarkdown(value) : value,
		fontKitFont,
		schema,
		basePdf,
		colorType,
		fontSize: enableInlineMarkdown && shouldUseDynamicFontSize(schema, basePdf) ? await calculateDynamicRichTextFontSize({
			value,
			schema,
			font,
			_cache
		}) : void 0
	});
	if (enableInlineMarkdown) {
		await renderInlineMarkdownText({
			value,
			schema,
			font,
			embedPdfFont: (fontName) => embedAndGetFont({
				pdfDoc,
				font,
				fontName,
				_cache
			}),
			fontKitFont,
			pdfDoc,
			page,
			pdfLib,
			_cache,
			colorType,
			fontSize,
			color,
			alignment,
			verticalAlignment,
			lineHeight,
			characterSpacing,
			x: contentX,
			y: contentY,
			width: contentWidth,
			height: contentHeight,
			pivotPoint,
			rotate,
			opacity
		});
		return;
	}
	if (!pdfFontValuePromise) throw new Error("[@pdfme/schemas] Failed to prepare PDF font for text rendering.");
	const pdfFontValue = await pdfFontValuePromise;
	const firstLineTextHeight = heightOfFontAtSize(fontKitFont, fontSize);
	const descent = getFontDescentInPt(fontKitFont, fontSize);
	const halfLineHeightAdjustment = lineHeight === 0 ? 0 : (lineHeight - 1) * fontSize / 2;
	const lines = applyTextLineRange(splitTextToSize({
		value,
		characterSpacing,
		fontSize,
		fontKitFont,
		boxWidthInPt: contentWidth
	}), getTextLineRange(schema));
	const needsTextWidth = alignment !== "left" || Boolean(schema.strikethrough || schema.underline);
	const needsTextHeight = Boolean(schema.strikethrough || schema.underline);
	let yOffset = 0;
	if (verticalAlignment === "top") yOffset = firstLineTextHeight + halfLineHeightAdjustment;
	else {
		const otherLinesHeight = lineHeight * fontSize * (lines.length - 1);
		if (verticalAlignment === "bottom") yOffset = contentHeight - otherLinesHeight + descent - halfLineHeightAdjustment;
		else if (verticalAlignment === "middle") yOffset = (contentHeight - otherLinesHeight - firstLineTextHeight + descent) / 2 + firstLineTextHeight;
	}
	lines.forEach((line, rowIndex) => {
		const trimmed = line.replace("\n", "");
		const textWidth = needsTextWidth ? widthOfTextAtSize(trimmed, fontKitFont, fontSize, characterSpacing) : 0;
		const textHeight = needsTextHeight ? heightOfFontAtSize(fontKitFont, fontSize) : 0;
		const rowYOffset = lineHeight * fontSize * rowIndex;
		if (line === "") line = "\r\n";
		let xLine = contentX;
		if (alignment === "center") xLine += (contentWidth - textWidth) / 2;
		else if (alignment === "right") xLine += contentWidth - textWidth;
		let yLine = contentY + contentHeight - yOffset - rowYOffset;
		if (schema.strikethrough && textWidth > 0) {
			const _x = xLine + textWidth + 1;
			const _y = yLine + textHeight / 3;
			page.drawLine({
				start: rotatePoint({
					x: xLine,
					y: _y
				}, pivotPoint, rotate.angle),
				end: rotatePoint({
					x: _x,
					y: _y
				}, pivotPoint, rotate.angle),
				thickness: 1 / 12 * fontSize,
				color,
				opacity
			});
		}
		if (schema.underline && textWidth > 0) {
			const _x = xLine + textWidth + 1;
			const _y = yLine - textHeight / 12;
			page.drawLine({
				start: rotatePoint({
					x: xLine,
					y: _y
				}, pivotPoint, rotate.angle),
				end: rotatePoint({
					x: _x,
					y: _y
				}, pivotPoint, rotate.angle),
				thickness: 1 / 12 * fontSize,
				color,
				opacity
			});
		}
		if (rotate.angle !== 0) {
			const rotatedPoint = rotatePoint({
				x: xLine,
				y: yLine
			}, pivotPoint, rotate.angle);
			xLine = rotatedPoint.x;
			yLine = rotatedPoint.y;
		}
		let spacing = characterSpacing;
		if (alignment === "justify" && line.slice(-1) !== "\n") {
			const iterator = getGraphemeSegmenter().segment(trimmed)[Symbol.iterator]();
			const len = Array.from(iterator).length;
			spacing += (contentWidth - textWidth) / len;
		}
		page.pushOperators(pdfLib.setCharacterSpacing(spacing));
		page.drawText(trimmed, {
			x: xLine,
			y: yLine,
			rotate,
			size: fontSize,
			color,
			lineHeight: lineHeight * fontSize,
			font: pdfFontValue,
			opacity
		});
	});
};
var drawTextBoxDecoration = (arg) => {
	const { page, schema, colorType, x, y, width, height, rotate, pivotPoint } = arg;
	const { borderWidth } = getBoxInsets(schema);
	const opacity = schema.opacity ?? 1;
	const drawRectangle = (rect) => {
		if (rect.width <= 0 || rect.height <= 0) return;
		const point = rotate.angle === 0 ? {
			x: rect.x,
			y: rect.y
		} : rotatePoint({
			x: rect.x,
			y: rect.y
		}, pivotPoint, rotate.angle);
		page.drawRectangle({
			x: point.x,
			y: point.y,
			width: rect.width,
			height: rect.height,
			rotate,
			color: rect.color,
			opacity
		});
	};
	if (schema.backgroundColor) {
		const color = hex2PrintingColor(schema.backgroundColor, colorType);
		if (color) drawRectangle({
			x,
			y,
			width,
			height,
			color
		});
	}
	if (!schema.borderColor || !hasBoxDimension(schema.borderWidth)) return;
	const color = hex2PrintingColor(schema.borderColor, colorType);
	if (!color) return;
	const top = mm2pt(borderWidth.top);
	const right = mm2pt(borderWidth.right);
	const bottom = mm2pt(borderWidth.bottom);
	const left = mm2pt(borderWidth.left);
	drawRectangle({
		x,
		y: y + height - top,
		width,
		height: top,
		color
	});
	drawRectangle({
		x: x + width - right,
		y,
		width: right,
		height,
		color
	});
	drawRectangle({
		x,
		y,
		width,
		height: bottom,
		color
	});
	drawRectangle({
		x,
		y,
		width: left,
		height,
		color
	});
};
//#endregion
//#region src/text/icons/index.ts
var TextStrikethroughIcon = createSvgStr(Strikethrough);
var TextUnderlineIcon = createSvgStr(Underline);
var TextAlignLeftIcon = createSvgStr(AlignLeft);
var TextAlignCenterIcon = createSvgStr(AlignCenter);
var TextAlignRightIcon = createSvgStr(AlignRight);
var TextAlignJustifyIcon = createSvgStr(AlignJustify);
var TextVerticalAlignTopIcon = createSvgStr(ArrowUpToLine);
var TextVerticalAlignMiddleIcon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M8 19h3v4h2v-4h3l-4-4l-4 4zm8-14h-3V1h-2v4H8l4 4l4-4zM4 11v2h16v-2H4z" fill="currentColor"></path></svg>`;
var TextVerticalAlignBottomIcon = createSvgStr(ArrowDownToLine);
//#endregion
//#region src/text/extraFormatter.ts
var Formatter = /* @__PURE__ */ function(Formatter) {
	Formatter["STRIKETHROUGH"] = "strikethrough";
	Formatter["UNDERLINE"] = "underline";
	Formatter["ALIGNMENT"] = "alignment";
	Formatter["VERTICAL_ALIGNMENT"] = "verticalAlignment";
	return Formatter;
}({});
function getExtraFormatterSchema(i18n) {
	const buttons = [
		{
			key: "strikethrough",
			icon: TextStrikethroughIcon,
			type: "boolean"
		},
		{
			key: "underline",
			icon: TextUnderlineIcon,
			type: "boolean"
		},
		{
			key: "alignment",
			icon: TextAlignLeftIcon,
			type: "select",
			value: DEFAULT_ALIGNMENT
		},
		{
			key: "alignment",
			icon: TextAlignCenterIcon,
			type: "select",
			value: ALIGN_CENTER
		},
		{
			key: "alignment",
			icon: TextAlignRightIcon,
			type: "select",
			value: ALIGN_RIGHT
		},
		{
			key: "alignment",
			icon: TextAlignJustifyIcon,
			type: "select",
			value: ALIGN_JUSTIFY
		},
		{
			key: "verticalAlignment",
			icon: TextVerticalAlignTopIcon,
			type: "select",
			value: "top"
		},
		{
			key: "verticalAlignment",
			icon: TextVerticalAlignMiddleIcon,
			type: "select",
			value: VERTICAL_ALIGN_MIDDLE
		},
		{
			key: "verticalAlignment",
			icon: TextVerticalAlignBottomIcon,
			type: "select",
			value: VERTICAL_ALIGN_BOTTOM
		}
	];
	return {
		title: i18n("schemas.text.format"),
		widget: "ButtonGroup",
		buttons,
		span: 24
	};
}
//#endregion
//#region src/text/propPanel.ts
var UseDynamicFontSize = (props) => {
	const { rootElement, changeSchemas, activeSchema, i18n, basePdf } = props;
	const isExpand = isTextOverflowExpand(activeSchema, basePdf);
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = !isExpand && Boolean(activeSchema?.dynamicFontSize);
	checkbox.disabled = isExpand;
	checkbox.onchange = (e) => {
		const val = e.target.checked ? {
			min: 4,
			max: 72,
			fit: DEFAULT_DYNAMIC_FIT
		} : void 0;
		changeSchemas([{
			key: "dynamicFontSize",
			value: val,
			schemaId: activeSchema.id
		}]);
	};
	const label = document.createElement("label");
	const span = document.createElement("span");
	span.innerText = i18n("schemas.text.dynamicFontSize") || "";
	span.style.cssText = "margin-left: 0.5rem";
	label.style.cssText = "display: flex; width: 100%;";
	label.style.opacity = isExpand ? "0.5" : "1";
	label.appendChild(checkbox);
	label.appendChild(span);
	rootElement.appendChild(label);
};
var UseInlineMarkdown = (props) => {
	const { rootElement, changeSchemas, activeSchema, i18n } = props;
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = activeSchema?.textFormat === TEXT_FORMAT_INLINE_MARKDOWN;
	checkbox.onchange = (e) => {
		const value = e.target.checked ? TEXT_FORMAT_INLINE_MARKDOWN : TEXT_FORMAT_PLAIN;
		changeSchemas([{
			key: "textFormat",
			value,
			schemaId: activeSchema.id
		}]);
	};
	const label = document.createElement("label");
	const span = document.createElement("span");
	span.innerText = i18n("schemas.text.inlineMarkdown") || "";
	span.style.cssText = "margin-left: 0.5rem";
	label.style.cssText = "display: flex; width: 100%;";
	label.appendChild(checkbox);
	label.appendChild(span);
	rootElement.appendChild(label);
};
var propPanel = {
	schema: ({ options, activeSchema, i18n, basePdf }) => {
		const font = options.font || { [DEFAULT_FONT_NAME]: {
			data: "",
			fallback: true
		} };
		const fontNames = Object.keys(font);
		const fallbackFontName = getFallbackFontName(font);
		const activeTextSchema = activeSchema;
		const canExpandOverflow = canUseTextOverflowExpand(activeTextSchema, basePdf);
		const enableDynamicFont = !isTextOverflowExpand(activeTextSchema, basePdf) && Boolean(activeSchema?.dynamicFontSize);
		const hideTextFormat = activeTextSchema.type === "text" && activeTextSchema.readOnly !== true;
		const enableInlineMarkdown = activeTextSchema.textFormat === "inline-markdown" && !hideTextFormat;
		const baseFontName = activeTextSchema.fontName && font[activeTextSchema.fontName] ? activeTextSchema.fontName : fallbackFontName;
		const optionalFontNames = [{
			label: baseFontName,
			value: ""
		}, ...fontNames.filter((name) => name !== baseFontName).map((name) => ({
			label: name,
			value: name
		}))];
		const overflowOptions = [{
			label: i18n("schemas.text.overflowVisible"),
			value: TEXT_OVERFLOW_VISIBLE
		}, ...canExpandOverflow ? [{
			label: i18n("schemas.text.overflowExpand"),
			value: TEXT_OVERFLOW_EXPAND
		}] : []];
		return {
			fontName: {
				title: i18n("schemas.text.fontName"),
				type: "string",
				widget: "select",
				default: fallbackFontName,
				placeholder: fallbackFontName,
				props: { options: fontNames.map((name) => ({
					label: name,
					value: name
				})) },
				span: 12
			},
			fontSize: {
				title: i18n("schemas.text.size"),
				type: "number",
				widget: "inputNumber",
				span: 6,
				disabled: enableDynamicFont,
				props: { min: 0 }
			},
			characterSpacing: {
				title: i18n("schemas.text.spacing"),
				type: "number",
				widget: "inputNumber",
				span: 6,
				props: { min: 0 }
			},
			formatter: getExtraFormatterSchema(i18n),
			lineHeight: {
				title: i18n("schemas.text.lineHeight"),
				type: "number",
				widget: "inputNumber",
				props: {
					step: .1,
					min: 0
				},
				span: 8
			},
			overflow: {
				title: i18n("schemas.text.overflow"),
				type: "string",
				widget: "select",
				default: DEFAULT_TEXT_OVERFLOW,
				props: { options: overflowOptions },
				span: 8
			},
			useDynamicFontSize: {
				type: "boolean",
				widget: "UseDynamicFontSize",
				bind: false,
				span: 16
			},
			dynamicFontSize: {
				type: "object",
				widget: "card",
				column: 3,
				properties: {
					min: {
						title: i18n("schemas.text.min"),
						type: "number",
						widget: "inputNumber",
						hidden: !enableDynamicFont,
						props: { min: 0 }
					},
					max: {
						title: i18n("schemas.text.max"),
						type: "number",
						widget: "inputNumber",
						hidden: !enableDynamicFont,
						props: { min: 0 }
					},
					fit: {
						title: i18n("schemas.text.fit"),
						type: "string",
						widget: "select",
						hidden: !enableDynamicFont,
						props: { options: [{
							label: i18n("schemas.horizontal"),
							value: DYNAMIC_FIT_HORIZONTAL
						}, {
							label: i18n("schemas.vertical"),
							value: DYNAMIC_FIT_VERTICAL
						}] }
					}
				}
			},
			fontColor: {
				title: i18n("schemas.textColor"),
				type: "string",
				widget: "color",
				props: { disabledAlpha: true },
				rules: [{
					pattern: HEX_COLOR_PATTERN,
					message: i18n("validation.hexColor")
				}]
			},
			backgroundColor: {
				title: i18n("schemas.bgColor"),
				type: "string",
				widget: "color",
				props: { disabledAlpha: true },
				rules: [{
					pattern: HEX_COLOR_PATTERN,
					message: i18n("validation.hexColor")
				}]
			},
			borderColor: {
				title: i18n("schemas.borderColor"),
				type: "string",
				widget: "color",
				props: { disabledAlpha: true },
				rules: [{
					pattern: HEX_COLOR_PATTERN,
					message: i18n("validation.hexColor")
				}]
			},
			borderWidth: {
				title: i18n("schemas.borderWidth"),
				type: "object",
				widget: "lineTitle",
				span: 24,
				properties: getBoxDimensionPropPanelSchema(.1)
			},
			padding: {
				title: i18n("schemas.padding"),
				type: "object",
				widget: "lineTitle",
				span: 24,
				properties: getBoxDimensionPropPanelSchema()
			},
			useInlineMarkdown: {
				type: "boolean",
				widget: "UseInlineMarkdown",
				bind: false,
				hidden: hideTextFormat,
				span: enableInlineMarkdown ? 12 : 24
			},
			fontVariantFallback: {
				title: i18n("schemas.text.variantFallback"),
				type: "string",
				widget: "select",
				default: DEFAULT_FONT_VARIANT_FALLBACK,
				hidden: !enableInlineMarkdown,
				props: { options: [
					{
						label: i18n("schemas.text.synthetic"),
						value: FONT_VARIANT_FALLBACK_SYNTHETIC
					},
					{
						label: i18n("schemas.text.plain"),
						value: FONT_VARIANT_FALLBACK_PLAIN
					},
					{
						label: i18n("schemas.text.error"),
						value: FONT_VARIANT_FALLBACK_ERROR
					}
				] },
				span: 12
			},
			fontVariants: {
				title: i18n("schemas.text.markdownFonts"),
				type: "object",
				widget: "card",
				column: 2,
				hidden: !enableInlineMarkdown,
				properties: {
					bold: {
						title: i18n("schemas.text.boldFont"),
						type: "string",
						widget: "select",
						props: { options: optionalFontNames }
					},
					italic: {
						title: i18n("schemas.text.italicFont"),
						type: "string",
						widget: "select",
						props: { options: optionalFontNames }
					},
					boldItalic: {
						title: i18n("schemas.text.boldItalicFont"),
						type: "string",
						widget: "select",
						props: { options: optionalFontNames }
					},
					code: {
						title: i18n("schemas.text.codeFont"),
						type: "string",
						widget: "select",
						props: { options: optionalFontNames }
					}
				}
			}
		};
	},
	widgets: {
		UseDynamicFontSize,
		UseInlineMarkdown
	},
	defaultSchema: {
		name: "",
		type: "text",
		content: "Type Something...",
		position: {
			x: 0,
			y: 0
		},
		width: 45,
		height: 10,
		rotate: 0,
		alignment: DEFAULT_ALIGNMENT,
		verticalAlignment: "top",
		fontSize: 13,
		textFormat: DEFAULT_TEXT_FORMAT,
		overflow: DEFAULT_TEXT_OVERFLOW,
		fontVariantFallback: DEFAULT_FONT_VARIANT_FALLBACK,
		lineHeight: 1,
		characterSpacing: 0,
		dynamicFontSize: void 0,
		fontColor: DEFAULT_FONT_COLOR,
		fontName: void 0,
		backgroundColor: "",
		borderColor: "#000000",
		borderWidth: createBoxDimension(0),
		padding: createBoxDimension(0),
		opacity: 1,
		strikethrough: false,
		underline: false
	}
};
//#endregion
//#region src/text/uiRender.ts
var replaceUnsupportedChars = (text, fontKitFont) => {
	const charSupportCache = {};
	const isCharSupported = (char) => {
		if (char in charSupportCache) return charSupportCache[char];
		const isSupported = fontKitFont.hasGlyphForCodePoint(char.codePointAt(0) || 0);
		charSupportCache[char] = isSupported;
		return isSupported;
	};
	return text.split(/(\r\n|\n|\r)/).map((segment) => {
		if (/\r\n|\n|\r/.test(segment)) return segment;
		return Array.from(segment).map((char) => {
			if (/\s/.test(char) || char.charCodeAt(0) < 32) return char;
			return isCharSupported(char) ? char : "〿";
		}).join("");
	}).join("");
};
var uiRender = async (arg) => {
	const { value, schema, basePdf, mode, onChange, stopEditing, tabIndex, placeholder, options, _cache } = arg;
	const hasInlineMarkdownFormat = schema.textFormat === TEXT_FORMAT_INLINE_MARKDOWN;
	const enableInlineMarkdown = isInlineMarkdownTextSchema(schema);
	const isReadOnlySplitInlineMarkdownFormChunk = mode === "form" && Boolean(getTextLineRange(schema)) && hasInlineMarkdownFormat;
	const renderInlineMarkdownReadOnlyChunk = enableInlineMarkdown || isReadOnlySplitInlineMarkdownFormChunk;
	const editable = isEditable(mode, schema) && !isReadOnlySplitInlineMarkdownFormChunk;
	const usePlaceholder = editable && placeholder && !value;
	const getText = (element) => {
		let text = element.innerText;
		if (text.endsWith("\n")) text = text.slice(0, -1);
		return text;
	};
	const font = options?.font || getDefaultFont();
	const fontKitFont = await getFontKitFont(schema.fontName, font, _cache);
	const enableDynamicFontSize = shouldUseDynamicFontSize(schema, basePdf);
	const displayValue = enableInlineMarkdown ? stripInlineMarkdown(value) : value;
	const dynamicRichTextFontSize = enableInlineMarkdown && enableDynamicFontSize ? await calculateDynamicRichTextFontSize({
		value: usePlaceholder ? placeholder : value,
		schema,
		font,
		_cache
	}) : void 0;
	const textBlock = buildStyledTextContainer(isReadOnlySplitInlineMarkdownFormChunk ? {
		...arg,
		mode: "viewer"
	} : arg, fontKitFont, usePlaceholder ? placeholder : displayValue, dynamicRichTextFontSize);
	const processedText = replaceUnsupportedChars(getRangedPlainTextValue({
		value,
		schema,
		fontKitFont,
		fontSize: schema.fontSize ?? 13
	}), fontKitFont);
	if (!editable) {
		if (renderInlineMarkdownReadOnlyChunk) {
			await renderInlineMarkdownReadOnly({
				textBlock,
				value,
				schema,
				font,
				_cache
			});
			return;
		}
		textBlock.innerHTML = processedText.split("").map((l, i) => {
			const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
			return `<span style="letter-spacing:${String(value).length === i + 1 ? 0 : "inherit"};">${escaped}</span>`;
		}).join("");
		return;
	}
	makeElementPlainTextContentEditable(textBlock);
	textBlock.tabIndex = tabIndex || 0;
	textBlock.innerText = mode === "designer" ? value : processedText;
	textBlock.addEventListener("blur", (e) => {
		if (onChange) onChange({
			key: "content",
			value: getText(e.target)
		});
		if (stopEditing) stopEditing();
	});
	if (enableDynamicFontSize) {
		let dynamicFontSize = void 0;
		textBlock.addEventListener("keyup", () => {
			setTimeout(() => {
				(() => {
					if (!textBlock.textContent) return;
					dynamicFontSize = calculateDynamicFontSize({
						textSchema: schema,
						fontKitFont,
						value: isInlineMarkdownTextSchema(schema) ? stripInlineMarkdown(getText(textBlock)) : getText(textBlock),
						startingFontSize: dynamicFontSize
					});
					textBlock.style.fontSize = `${dynamicFontSize}pt`;
					const { topAdj: newTopAdj, bottomAdj: newBottomAdj } = getBrowserVerticalFontAdjustments(fontKitFont, dynamicFontSize ?? schema.fontSize ?? 13, schema.lineHeight ?? 1, schema.verticalAlignment ?? "top");
					textBlock.style.paddingTop = `${newTopAdj}px`;
					textBlock.style.marginBottom = `${newBottomAdj}px`;
				})();
			}, 0);
		});
	}
	if (usePlaceholder) {
		textBlock.style.color = PLACEHOLDER_FONT_COLOR;
		textBlock.addEventListener("focus", () => {
			if (textBlock.innerText === placeholder) {
				textBlock.innerText = "";
				textBlock.style.color = schema.fontColor ?? "#000000";
			}
		});
	}
	if (mode === "designer") setTimeout(() => {
		textBlock.focus();
		const selection = window.getSelection();
		const range = document.createRange();
		if (selection && range) {
			range.selectNodeContents(textBlock);
			range.collapse(false);
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	});
};
var renderInlineMarkdownReadOnly = async (arg) => {
	const { textBlock, value, schema, font, _cache } = arg;
	const runs = await resolveRichTextRuns({
		runs: parseInlineMarkdown(value),
		schema,
		font,
		_cache
	});
	const lineRange = getTextLineRange(schema);
	if (lineRange) {
		const lines = applyTextLineRange(layoutRichTextLines({
			runs,
			fontSize: schema.fontSize ?? 13,
			characterSpacing: schema.characterSpacing ?? 0,
			boxWidthInPt: mm2pt(getBoxContentArea(schema).width)
		}), lineRange);
		textBlock.innerHTML = "";
		lines.forEach((line, lineIndex) => {
			line.runs.forEach((run) => {
				appendInlineMarkdownRun({
					textBlock,
					run,
					schema,
					font
				});
			});
			if (lineIndex < lines.length - 1) textBlock.appendChild(document.createElement("br"));
		});
		return;
	}
	textBlock.innerHTML = "";
	runs.forEach((run) => {
		appendInlineMarkdownRun({
			textBlock,
			run,
			schema,
			font
		});
	});
};
var appendInlineMarkdownRun = (arg) => {
	const { textBlock, run, schema, font } = arg;
	const href = run.href ? normalizeLinkHref(run.href) : void 0;
	const span = href ? document.createElement("a") : document.createElement("span");
	const processedText = replaceUnsupportedChars(run.text, run.fontKitFont);
	const textDecorations = [];
	span.textContent = processedText;
	if (href) {
		const anchor = span;
		anchor.href = href;
		if (!getInternalLinkTarget(href)) {
			anchor.target = "_blank";
			anchor.rel = "noopener noreferrer";
		}
		textDecorations.push("underline");
	}
	if (run.fontName) span.style.fontFamily = `'${run.fontName}'`;
	if (run.syntheticBold) {
		span.style.fontWeight = "800";
		span.style.textShadow = SYNTHETIC_BOLD_CSS_TEXT_SHADOW;
	}
	if (run.syntheticItalic) span.style.fontStyle = "italic";
	if (run.strikethrough) textDecorations.push("line-through");
	if (textDecorations.length > 0) span.style.textDecoration = textDecorations.join(" ");
	if (run.code) {
		span.style.backgroundColor = CODE_BACKGROUND_COLOR;
		span.style.borderRadius = "2px";
		span.style.padding = "0 0.15em";
		if (!schema.fontVariants?.code || !font[schema.fontVariants.code]) span.style.fontFamily = run.fontName ? `'${run.fontName}', monospace` : "monospace";
	}
	textBlock.appendChild(span);
};
var getRangedPlainTextValue = (arg) => {
	const { value, schema, fontKitFont, fontSize } = arg;
	const lineRange = getTextLineRange(schema);
	if (!lineRange) return value;
	const lines = applyTextLineRange(splitTextToSize({
		value,
		characterSpacing: schema.characterSpacing ?? 0,
		fontSize,
		fontKitFont,
		boxWidthInPt: mm2pt(getBoxContentArea(schema).width)
	}), lineRange);
	return plainTextLinesToValue(lines);
};
var buildStyledTextContainer = (arg, fontKitFont, value, resolvedDynamicFontSize) => {
	const { schema, rootElement, mode } = arg;
	let dynamicFontSize = resolvedDynamicFontSize;
	const characterSpacing = schema.characterSpacing ?? 0;
	const editable = isEditable(mode, schema);
	if (dynamicFontSize === void 0 && shouldUseDynamicFontSize(schema, arg.basePdf) && value) dynamicFontSize = calculateDynamicFontSize({
		textSchema: schema,
		fontKitFont,
		value,
		startingFontSize: dynamicFontSize
	});
	const { topAdj, bottomAdj } = getBrowserVerticalFontAdjustments(fontKitFont, dynamicFontSize ?? schema.fontSize ?? 13, schema.lineHeight ?? 1, schema.verticalAlignment ?? "top");
	const topAdjustment = topAdj.toString();
	const bottomAdjustment = bottomAdj.toString();
	const verticalAlignment = schema.verticalAlignment ?? "top";
	const isTopAligned = verticalAlignment === "top";
	const container = document.createElement("div");
	const { borderWidth, padding } = getBoxInsets(schema);
	const hasPadding = hasBoxDimension(schema.padding);
	const hasBorder = Boolean(schema.borderColor && hasBoxDimension(schema.borderWidth));
	const containerStyle = {
		padding: hasPadding ? `${padding.top}mm ${padding.right}mm ${padding.bottom}mm ${padding.left}mm` : 0,
		resize: "none",
		backgroundColor: getBackgroundColor(schema),
		border: hasBorder ? void 0 : "none",
		...hasBorder ? {
			borderTopWidth: `${borderWidth.top}mm`,
			borderRightWidth: `${borderWidth.right}mm`,
			borderBottomWidth: `${borderWidth.bottom}mm`,
			borderLeftWidth: `${borderWidth.left}mm`,
			borderStyle: "solid",
			borderColor: schema.borderColor
		} : {},
		...hasPadding || hasBorder ? { boxSizing: "border-box" } : {},
		display: "flex",
		flexDirection: "column",
		justifyContent: mapVerticalAlignToFlex(verticalAlignment),
		width: "100%",
		height: "100%",
		cursor: editable ? "text" : "default"
	};
	Object.assign(container.style, containerStyle);
	rootElement.innerHTML = "";
	rootElement.appendChild(container);
	const textDecorations = [];
	if (schema.strikethrough) textDecorations.push("line-through");
	if (schema.underline) textDecorations.push("underline");
	const textBlockStyle = {
		fontFamily: schema.fontName ? `'${schema.fontName}'` : "inherit",
		color: schema.fontColor ? schema.fontColor : DEFAULT_FONT_COLOR,
		fontSize: `${dynamicFontSize ?? schema.fontSize ?? 13}pt`,
		letterSpacing: `${characterSpacing}pt`,
		lineHeight: `${schema.lineHeight ?? 1}em`,
		textAlign: schema.alignment ?? "left",
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		resize: "none",
		border: "none",
		outline: "none",
		marginBottom: `${bottomAdjustment}px`,
		paddingTop: `${topAdjustment}px`,
		backgroundColor: "transparent",
		textDecoration: textDecorations.join(" "),
		...editable && characterSpacing > 0 ? { width: `calc(100% + ${characterSpacing}pt)` } : {},
		...isTopAligned ? { height: "100%" } : {}
	};
	const textBlock = document.createElement("div");
	textBlock.id = "text-" + String(schema.id);
	Object.assign(textBlock.style, textBlockStyle);
	container.appendChild(textBlock);
	return textBlock;
};
/**
* Firefox doesn't support 'plaintext-only' contentEditable mode, which we want to avoid mark-up.
* This function adds a workaround for Firefox to make the contentEditable element behave like 'plaintext-only'.
*/
var makeElementPlainTextContentEditable = (element) => {
	if (!isFirefox()) {
		element.contentEditable = "plaintext-only";
		return;
	}
	element.contentEditable = "true";
	element.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			document.execCommand("insertLineBreak", false, void 0);
		}
	});
	element.addEventListener("paste", (e) => {
		e.preventDefault();
		const paste = e.clipboardData?.getData("text");
		const selection = window.getSelection();
		if (!selection?.rangeCount) return;
		selection.deleteFromDocument();
		selection.getRangeAt(0).insertNode(document.createTextNode(paste || ""));
		selection.collapseToEnd();
	});
};
var mapVerticalAlignToFlex = (verticalAlignmentValue) => {
	switch (verticalAlignmentValue) {
		case "top": return "flex-start";
		case VERTICAL_ALIGN_MIDDLE: return "center";
		case VERTICAL_ALIGN_BOTTOM: return "flex-end";
	}
	return "flex-start";
};
var getBackgroundColor = (schema) => {
	if (!schema.backgroundColor) return "transparent";
	return schema.backgroundColor;
};
//#endregion
//#region src/text/index.ts
var textSchema = {
	pdf: pdfRender,
	ui: uiRender,
	propPanel,
	icon: createSvgStr(TextCursorInput)
};
//#endregion
//#region src/builtins.ts
var builtInPlugins = { Text: textSchema };
//#endregion
export { mapVerticalAlignToFlex as a, Formatter as c, makeElementPlainTextContentEditable as i, getExtraFormatterSchema as l, textSchema as n, uiRender as o, buildStyledTextContainer as r, propPanel as s, builtInPlugins as t, pdfRender as u };

//# sourceMappingURL=builtins-BHOQnFbY.js.map