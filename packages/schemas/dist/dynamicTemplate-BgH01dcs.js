import { $ as VERTICAL_ALIGN_MIDDLE, A as ALIGN_RIGHT, D as ALIGN_CENTER, F as DEFAULT_FONT_COLOR, N as DEFAULT_ALIGNMENT, Q as VERTICAL_ALIGN_BOTTOM, S as getBoxDimensionPropPanelSchema, b as createBoxDimension, h as getFontKitFont, k as ALIGN_LEFT, l as getTableBodyRange, o as createTableBodySplitRange, v as splitTextToSize, y as widthOfTextAtSize } from "./splitRange-BHV0vb0Q.js";
import { cloneDeep, getDefaultFont, getFallbackFontName, isBlankPdf, mm2pt, pt2mm } from "@pdfme/common";
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.147.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region src/tables/classes.ts
var Cell = class {
	constructor(raw, styles, section) {
		_defineProperty(this, "raw", void 0);
		_defineProperty(this, "text", void 0);
		_defineProperty(this, "styles", void 0);
		_defineProperty(this, "section", void 0);
		_defineProperty(this, "contentHeight", 0);
		_defineProperty(this, "contentWidth", 0);
		_defineProperty(this, "wrappedWidth", 0);
		_defineProperty(this, "minReadableWidth", 0);
		_defineProperty(this, "minWidth", 0);
		_defineProperty(this, "width", 0);
		_defineProperty(this, "height", 0);
		_defineProperty(this, "x", 0);
		_defineProperty(this, "y", 0);
		this.styles = styles;
		this.section = section;
		this.raw = raw;
		const splitRegex = /\r\n|\r|\n/g;
		this.text = raw.split(splitRegex);
	}
	getContentHeight() {
		const lineCount = Array.isArray(this.text) ? this.text.length : 1;
		const lineHeight = pt2mm(this.styles.fontSize) * this.styles.lineHeight;
		const vPadding = this.padding("top") + this.padding("bottom");
		const height = lineCount * lineHeight + vPadding;
		return Math.max(height, this.styles.minCellHeight);
	}
	padding(name) {
		return this.styles.cellPadding[name];
	}
};
var Column = class {
	constructor(index) {
		_defineProperty(this, "index", void 0);
		_defineProperty(this, "wrappedWidth", 0);
		_defineProperty(this, "minReadableWidth", 0);
		_defineProperty(this, "minWidth", 0);
		_defineProperty(this, "width", 0);
		this.index = index;
	}
	getMaxCustomCellWidth(table) {
		let max = 0;
		for (const row of table.allRows()) {
			const cell = row.cells[this.index];
			max = Math.max(max, cell.styles.cellWidth);
		}
		return max;
	}
};
var Row = class {
	constructor(raw, index, section, cells) {
		_defineProperty(this, "raw", void 0);
		_defineProperty(this, "index", void 0);
		_defineProperty(this, "section", void 0);
		_defineProperty(this, "cells", void 0);
		_defineProperty(this, "height", 0);
		this.raw = raw;
		this.index = index;
		this.section = section;
		this.cells = cells;
	}
	getMaxCellHeight(columns) {
		return columns.reduce((acc, column) => Math.max(acc, this.cells[column.index]?.height || 0), 0);
	}
	getMinimumRowHeight(columns) {
		return columns.reduce((acc, column) => {
			const cell = this.cells[column.index];
			if (!cell) return 0;
			const oneRowHeight = cell.padding("top") + cell.padding("bottom") + cell.styles.lineHeight;
			return oneRowHeight > acc ? oneRowHeight : acc;
		}, 0);
	}
};
var Table = class Table {
	constructor(input, content) {
		_defineProperty(this, "settings", void 0);
		_defineProperty(this, "styles", void 0);
		_defineProperty(this, "columns", void 0);
		_defineProperty(this, "head", void 0);
		_defineProperty(this, "body", void 0);
		this.settings = input.settings;
		this.styles = input.styles;
		this.columns = content.columns;
		this.head = content.head;
		this.body = content.body;
	}
	static async create(arg) {
		const { input, content, font, _cache } = arg;
		const table = new Table(input, content);
		await calculateWidths({
			table,
			font,
			_cache
		});
		return table;
	}
	getHeadHeight() {
		return this.head.reduce((acc, row) => acc + row.getMaxCellHeight(this.columns), 0);
	}
	getBodyHeight() {
		return this.body.reduce((acc, row) => acc + row.getMaxCellHeight(this.columns), 0);
	}
	allRows() {
		return this.head.concat(this.body);
	}
	getWidth() {
		return this.settings.tableWidth;
	}
	getHeight() {
		return (this.settings.showHead ? this.getHeadHeight() : 0) + this.getBodyHeight();
	}
};
async function calculateWidths(arg) {
	const { table, font, _cache } = arg;
	const getFontKitFontByFontName = (fontName) => getFontKitFont(fontName, font, _cache);
	await calculate(table, getFontKitFontByFontName);
	const resizableColumns = [];
	let initialTableWidth = 0;
	table.columns.forEach((column) => {
		const customWidth = column.getMaxCustomCellWidth(table);
		if (customWidth) column.width = customWidth;
		else {
			column.width = column.wrappedWidth;
			resizableColumns.push(column);
		}
		initialTableWidth += column.width;
	});
	let resizeWidth = table.getWidth() - initialTableWidth;
	if (resizeWidth) resizeWidth = resizeColumns(resizableColumns, resizeWidth, (column) => Math.max(column.minReadableWidth, column.minWidth));
	if (resizeWidth) resizeWidth = resizeColumns(resizableColumns, resizeWidth, (column) => column.minWidth);
	resizeWidth = Math.abs(resizeWidth);
	applyColSpans(table);
	await fitContent(table, getFontKitFontByFontName);
	applyRowSpans(table);
}
function applyRowSpans(table) {
	const rowSpanCells = {};
	let colRowSpansLeft = 1;
	const all = table.allRows();
	for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
		const row = all[rowIndex];
		for (const column of table.columns) {
			const data = rowSpanCells[column.index];
			if (colRowSpansLeft > 1) {
				colRowSpansLeft--;
				delete row.cells[column.index];
			} else if (data) {
				data.cell.height += row.height;
				colRowSpansLeft = 1;
				delete row.cells[column.index];
				data.left--;
				if (data.left <= 1) delete rowSpanCells[column.index];
			} else {
				const cell = row.cells[column.index];
				if (!cell) continue;
				cell.height = row.height;
			}
		}
	}
}
function applyColSpans(table) {
	const all = table.allRows();
	for (let rowIndex = 0; rowIndex < all.length; rowIndex++) {
		const row = all[rowIndex];
		let colSpanCell = null;
		let combinedColSpanWidth = 0;
		let colSpansLeft = 0;
		for (let columnIndex = 0; columnIndex < table.columns.length; columnIndex++) {
			const column = table.columns[columnIndex];
			colSpansLeft -= 1;
			if (colSpansLeft > 1 && table.columns[columnIndex + 1]) {
				combinedColSpanWidth += column.width;
				delete row.cells[column.index];
			} else if (colSpanCell) {
				const cell = colSpanCell;
				delete row.cells[column.index];
				colSpanCell = null;
				cell.width = column.width + combinedColSpanWidth;
			} else {
				const cell = row.cells[column.index];
				if (!cell) continue;
				colSpansLeft = 1;
				combinedColSpanWidth = 0;
				cell.width = column.width + combinedColSpanWidth;
			}
		}
	}
}
async function fitContent(table, getFontKitFontByFontName) {
	const rowSpanHeight = {
		count: 0,
		height: 0
	};
	for (const row of table.allRows()) {
		for (const column of table.columns) {
			const cell = row.cells[column.index];
			if (!cell) continue;
			const fontKitFont = await getFontKitFontByFontName(cell.styles.fontName);
			cell.text = splitTextToSize({
				value: cell.raw,
				characterSpacing: cell.styles.characterSpacing,
				boxWidthInPt: mm2pt(cell.width),
				fontSize: cell.styles.fontSize,
				fontKitFont
			});
			cell.contentHeight = cell.getContentHeight();
			let realContentHeight = cell.contentHeight;
			if (rowSpanHeight && rowSpanHeight.count > 0) {
				if (rowSpanHeight.height > realContentHeight) realContentHeight = rowSpanHeight.height;
			}
			if (realContentHeight > row.height) row.height = realContentHeight;
		}
		rowSpanHeight.count--;
	}
}
function resizeColumns(columns, resizeWidth, getMinWidth) {
	const initialResizeWidth = resizeWidth;
	const sumWrappedWidth = columns.reduce((acc, column) => acc + column.wrappedWidth, 0);
	for (let i = 0; i < columns.length; i++) {
		const column = columns[i];
		const suggestedChange = initialResizeWidth * (column.wrappedWidth / sumWrappedWidth);
		const suggestedWidth = column.width + suggestedChange;
		const minWidth = getMinWidth(column);
		const newWidth = suggestedWidth < minWidth ? minWidth : suggestedWidth;
		resizeWidth -= newWidth - column.width;
		column.width = newWidth;
	}
	resizeWidth = Math.round(resizeWidth * 1e10) / 1e10;
	if (resizeWidth) {
		const resizableColumns = columns.filter((column) => {
			return resizeWidth < 0 ? column.width > getMinWidth(column) : true;
		});
		if (resizableColumns.length) resizeWidth = resizeColumns(resizableColumns, resizeWidth, getMinWidth);
	}
	return resizeWidth;
}
async function calculate(table, getFontKitFontByFontName) {
	for (const row of table.allRows()) for (const column of table.columns) {
		const cell = row.cells[column.index];
		if (!cell) continue;
		const hPadding = cell.padding("right") + cell.padding("left");
		const fontKitFont = await getFontKitFontByFontName(cell.styles.fontName);
		cell.contentWidth = getStringWidth(cell, fontKitFont) + hPadding;
		cell.minReadableWidth = getStringWidth(Object.assign(cell, { text: cell.text.join(" ").split(/\s+/) }), fontKitFont) + hPadding;
		cell.minWidth = cell.styles.cellWidth;
		cell.wrappedWidth = cell.styles.cellWidth;
	}
	for (const row of table.allRows()) for (const column of table.columns) {
		const cell = row.cells[column.index];
		if (cell) {
			column.wrappedWidth = Math.max(column.wrappedWidth, cell.wrappedWidth);
			column.minWidth = Math.max(column.minWidth, cell.minWidth);
			column.minReadableWidth = Math.max(column.minReadableWidth, cell.minReadableWidth);
		} else {
			const columnStyles = table.styles.columnStyles[column.index] || {};
			const cellWidth = columnStyles.cellWidth || columnStyles.minCellWidth;
			if (cellWidth) {
				column.minWidth = cellWidth;
				column.wrappedWidth = cellWidth;
			}
		}
	}
}
function getStringWidth(cell, fontKitFont) {
	const text = cell.text;
	const textArr = Array.isArray(text) ? text : [text];
	const fontSize = cell.styles.fontSize;
	const characterSpacing = cell.styles.characterSpacing;
	return textArr.map((text) => widthOfTextAtSize(text, fontKitFont, fontSize, characterSpacing)).reduce((a, b) => Math.max(a, b), 0);
}
//#endregion
//#region src/tables/tableHelper.ts
function parseSection(sectionName, sectionRows, columns, styleProps, fallbackFontName) {
	const rowSpansLeftForColumn = {};
	return sectionRows.map((rawRow, rowIndex) => {
		let skippedRowForRowSpans = 0;
		const cells = {};
		let colSpansAdded = 0;
		let columnSpansLeft = 0;
		for (const column of columns) if (rowSpansLeftForColumn[column.index] == null || rowSpansLeftForColumn[column.index].left === 0) {
			if (columnSpansLeft === 0) {
				let rawCell;
				if (Array.isArray(rawRow)) rawCell = rawRow[column.index - colSpansAdded - skippedRowForRowSpans];
				else rawCell = rawRow[column.index];
				const styles = cellStyles(sectionName, column, rowIndex, styleProps, fallbackFontName);
				const cell = new Cell(rawCell, styles, sectionName);
				cells[column.index] = cell;
				columnSpansLeft = 0;
				rowSpansLeftForColumn[column.index] = {
					left: 0,
					times: columnSpansLeft
				};
			} else {
				columnSpansLeft--;
				colSpansAdded++;
			}
		} else {
			rowSpansLeftForColumn[column.index].left--;
			columnSpansLeft = rowSpansLeftForColumn[column.index].times;
			skippedRowForRowSpans++;
		}
		return new Row(rawRow, rowIndex, sectionName, cells);
	});
}
function parseContent4Table(input, fallbackFontName) {
	const content = input.content;
	const columns = content.columns.map((index) => new Column(index));
	const styles = input.styles;
	return {
		columns,
		head: parseSection("head", content.head, columns, styles, fallbackFontName),
		body: parseSection("body", content.body, columns, styles, fallbackFontName)
	};
}
function cellStyles(sectionName, column, rowIndex, styles, fallbackFontName) {
	let sectionStyles;
	if (sectionName === "head") sectionStyles = styles.headStyles;
	else if (sectionName === "body") sectionStyles = styles.bodyStyles;
	const otherStyles = Object.assign({}, styles.styles, sectionStyles);
	const colStyles = styles.columnStyles[column.index] || {};
	const rowStyles = sectionName === "body" && rowIndex % 2 === 0 ? Object.assign({}, styles.alternateRowStyles) : {};
	return Object.assign({
		fontName: fallbackFontName,
		backgroundColor: "",
		textColor: "#000000",
		lineHeight: 1,
		characterSpacing: 0,
		alignment: "left",
		verticalAlignment: "middle",
		fontSize: 10,
		cellPadding: 5,
		lineColor: "#000000",
		lineWidth: 0,
		minCellHeight: 0,
		minCellWidth: 0
	}, otherStyles, rowStyles, colStyles);
}
function mapCellStyle(style) {
	return {
		fontName: style.fontName,
		alignment: style.alignment,
		verticalAlignment: style.verticalAlignment,
		fontSize: style.fontSize,
		lineHeight: style.lineHeight,
		characterSpacing: style.characterSpacing,
		backgroundColor: style.backgroundColor,
		textColor: style.fontColor,
		lineColor: style.borderColor,
		lineWidth: style.borderWidth,
		cellPadding: style.padding
	};
}
function getTableOptions(schema, body) {
	const columnStylesWidth = schema.headWidthPercentages.reduce((acc, cur, i) => ({
		...acc,
		[i]: { cellWidth: schema.width * (cur / 100) }
	}), {});
	const columnStylesAlignment = Object.entries(schema.columnStyles.alignment || {}).reduce((acc, [key, value]) => ({
		...acc,
		[key]: { alignment: value }
	}), {});
	const allKeys = /* @__PURE__ */ new Set([...Object.keys(columnStylesWidth).map(Number), ...Object.keys(columnStylesAlignment).map(Number)]);
	const columnStyles = Array.from(allKeys).reduce((acc, key) => {
		const widthStyle = columnStylesWidth[key] || {};
		const alignmentStyle = columnStylesAlignment[key] || {};
		return {
			...acc,
			[key]: {
				...widthStyle,
				...alignmentStyle
			}
		};
	}, {});
	return {
		head: [schema.head],
		body,
		showHead: schema.showHead,
		startY: schema.position.y,
		tableWidth: schema.width,
		tableLineColor: schema.tableStyles.borderColor,
		tableLineWidth: schema.tableStyles.borderWidth,
		headStyles: mapCellStyle(schema.headStyles),
		bodyStyles: mapCellStyle(schema.bodyStyles),
		alternateRowStyles: { backgroundColor: schema.bodyStyles.alternateBackgroundColor },
		columnStyles,
		margin: {
			top: 0,
			right: 0,
			left: schema.position.x,
			bottom: 0
		}
	};
}
function parseStyles(cInput) {
	const styleOptions = {
		styles: {},
		headStyles: {},
		bodyStyles: {},
		alternateRowStyles: {},
		columnStyles: {}
	};
	for (const prop of Object.keys(styleOptions)) if (prop === "columnStyles") {
		const current = cInput[prop];
		styleOptions.columnStyles = Object.assign({}, current);
	} else {
		const styles = [cInput].map((opts) => opts[prop] || {});
		styleOptions[prop] = Object.assign({}, styles[0], styles[1], styles[2]);
	}
	return styleOptions;
}
function parseContent4Input(options) {
	const head = options.head || [];
	const body = options.body || [];
	return {
		columns: (head[0] || body[0] || []).map((_, index) => index),
		head,
		body
	};
}
function parseInput(schema, body) {
	const options = getTableOptions(schema, body);
	const styles = parseStyles(options);
	const settings = {
		startY: options.startY,
		margin: options.margin,
		tableWidth: options.tableWidth,
		showHead: options.showHead,
		tableLineWidth: options.tableLineWidth ?? 0,
		tableLineColor: options.tableLineColor ?? ""
	};
	return {
		content: parseContent4Input(options),
		styles,
		settings
	};
}
function createSingleTable(body, args) {
	const { options, _cache, basePdf } = args;
	if (!isBlankPdf(basePdf)) console.warn("[@pdfme/schema/table]When specifying a custom PDF for basePdf, you cannot use features such as page breaks or re-layout of other elements.To utilize these features, please define basePdf as follows:\n{ width: number; height: number; padding: [number, number, number, number]; }");
	const schema = cloneDeep(args.schema);
	const { start } = getTableBodyRange(schema) || { start: 0 };
	if (start % 2 === 1) {
		const alternateBackgroundColor = schema.bodyStyles.alternateBackgroundColor;
		schema.bodyStyles.alternateBackgroundColor = schema.bodyStyles.backgroundColor;
		schema.bodyStyles.backgroundColor = alternateBackgroundColor;
	}
	schema.showHead = schema.showHead === false ? false : !schema.__isSplit || schema.repeatHead === true;
	const input = parseInput(schema, body);
	const font = options.font || getDefaultFont();
	const content = parseContent4Table(input, getFallbackFontName(font));
	return Table.create({
		input,
		content,
		font,
		_cache
	});
}
//#endregion
//#region src/constants.ts
var HEX_COLOR_PATTERN = "^#(?:[A-Fa-f0-9]{6})$";
//#endregion
//#region src/tables/helper.ts
var getDefaultCellStyles = () => ({
	fontName: void 0,
	alignment: DEFAULT_ALIGNMENT,
	verticalAlignment: VERTICAL_ALIGN_MIDDLE,
	fontSize: 13,
	lineHeight: 1,
	characterSpacing: 0,
	fontColor: DEFAULT_FONT_COLOR,
	backgroundColor: "",
	borderColor: "#888888",
	borderWidth: createBoxDimension(.1),
	padding: createBoxDimension(5)
});
var getCellPropPanelSchema = (arg) => {
	const { i18n, fallbackFontName, fontNames, isBody } = arg;
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
			props: { min: 0 },
			span: 6
		},
		characterSpacing: {
			title: i18n("schemas.text.spacing"),
			type: "number",
			widget: "inputNumber",
			props: { min: 0 },
			span: 6
		},
		alignment: {
			title: i18n("schemas.text.textAlign"),
			type: "string",
			widget: "select",
			props: { options: [
				{
					label: i18n("schemas.left"),
					value: ALIGN_LEFT
				},
				{
					label: i18n("schemas.center"),
					value: ALIGN_CENTER
				},
				{
					label: i18n("schemas.right"),
					value: ALIGN_RIGHT
				}
			] },
			span: 8
		},
		verticalAlignment: {
			title: i18n("schemas.text.verticalAlign"),
			type: "string",
			widget: "select",
			props: { options: [
				{
					label: i18n("schemas.top"),
					value: "top"
				},
				{
					label: i18n("schemas.middle"),
					value: VERTICAL_ALIGN_MIDDLE
				},
				{
					label: i18n("schemas.bottom"),
					value: VERTICAL_ALIGN_BOTTOM
				}
			] },
			span: 8
		},
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
		backgroundColor: {
			title: i18n("schemas.backgroundColor"),
			type: "string",
			widget: "color",
			props: { disabledAlpha: true },
			rules: [{
				pattern: HEX_COLOR_PATTERN,
				message: i18n("validation.hexColor")
			}]
		},
		...isBody ? { alternateBackgroundColor: {
			title: i18n("schemas.table.alternateBackgroundColor"),
			type: "string",
			widget: "color",
			props: { disabledAlpha: true },
			rules: [{
				pattern: HEX_COLOR_PATTERN,
				message: i18n("validation.hexColor")
			}]
		} } : {},
		"-": {
			type: "void",
			widget: "Divider"
		},
		borderWidth: {
			title: i18n("schemas.borderWidth"),
			type: "object",
			widget: "lineTitle",
			span: 24,
			properties: getBoxDimensionPropPanelSchema(.1)
		},
		"--": {
			type: "void",
			widget: "Divider"
		},
		padding: {
			title: i18n("schemas.padding"),
			type: "object",
			widget: "lineTitle",
			span: 24,
			properties: getBoxDimensionPropPanelSchema()
		}
	};
};
var getColumnStylesPropPanelSchema = ({ head, i18n }) => ({ alignment: {
	type: "object",
	widget: "lineTitle",
	title: i18n("schemas.text.textAlign"),
	column: 3,
	properties: head.reduce((acc, cur, i) => Object.assign(acc, { [i]: {
		title: cur || "Column " + String(i + 1),
		type: "string",
		widget: "select",
		props: { options: [
			{
				label: i18n("schemas.left"),
				value: ALIGN_LEFT
			},
			{
				label: i18n("schemas.center"),
				value: ALIGN_CENTER
			},
			{
				label: i18n("schemas.right"),
				value: ALIGN_RIGHT
			}
		] }
	} }), {})
} });
var getBody = (value) => {
	if (typeof value === "string") return JSON.parse(value || "[]");
	return value || [];
};
var getBodyWithRange = (value, range) => {
	const body = getBody(value);
	if (!range) return body;
	return body.slice(range.start, range.end);
};
var getBodyWithSchemaRange = (value, schema, range = getTableBodyRange(schema)) => getBodyWithRange(value, range);
//#endregion
//#region src/tables/dynamicTemplate.ts
var getDynamicHeightsForTable = async (value, args) => {
	if (args.schema.type !== "table") return Promise.resolve([args.schema.height]);
	const schema = args.schema;
	const bodyRange = getTableBodyRange(schema);
	const table = await createSingleTable(bodyRange?.start === 0 ? getBody(value) : getBodyWithRange(value, bodyRange), args);
	const baseHeights = schema.showHead ? table.allRows().map((row) => row.height) : [0].concat(table.body.map((row) => row.height));
	const headerHeight = schema.showHead ? table.getHeadHeight() : 0;
	if (!(schema.repeatHead && isBlankPdf(args.basePdf) && headerHeight > 0)) return baseHeights;
	const basePdf = args.basePdf;
	const [paddingTop, , paddingBottom] = basePdf.padding;
	const pageContentHeight = basePdf.height - paddingTop - paddingBottom;
	const getPageStartY = (pageIndex) => pageIndex * pageContentHeight + paddingTop;
	const initialPageIndex = Math.max(0, Math.floor((schema.position.y - paddingTop) / pageContentHeight));
	const headRowCount = schema.showHead ? table.head.length : 0;
	const SAFETY_MARGIN = .5;
	let currentPageIndex = initialPageIndex;
	let currentPageY = schema.position.y;
	let rowsOnCurrentPage = 0;
	const result = [];
	for (let i = 0; i < baseHeights.length; i++) {
		const isBodyRow = i >= headRowCount;
		const rowHeight = baseHeights[i];
		while (true) {
			const currentPageStartY = getPageStartY(currentPageIndex);
			const remainingHeight = currentPageStartY + pageContentHeight - currentPageY;
			const totalRowHeight = rowHeight + (isBodyRow && rowsOnCurrentPage === 0 && currentPageIndex > initialPageIndex ? headerHeight : 0);
			if (totalRowHeight > remainingHeight - SAFETY_MARGIN) {
				if (rowsOnCurrentPage === 0 && Math.abs(currentPageY - currentPageStartY) < SAFETY_MARGIN) {
					result.push(totalRowHeight);
					currentPageY += totalRowHeight;
					rowsOnCurrentPage++;
					break;
				}
				currentPageIndex++;
				currentPageY = getPageStartY(currentPageIndex);
				rowsOnCurrentPage = 0;
				continue;
			}
			result.push(totalRowHeight);
			currentPageY += totalRowHeight;
			rowsOnCurrentPage++;
			if (currentPageY >= currentPageStartY + pageContentHeight - SAFETY_MARGIN) {
				currentPageIndex++;
				currentPageY = getPageStartY(currentPageIndex);
				rowsOnCurrentPage = 0;
			}
			break;
		}
	}
	return result;
};
var getDynamicLayoutForTable = async (value, args) => {
	return {
		heights: await getDynamicHeightsForTable(value, args),
		avoidFirstUnitOnly: true,
		patchSplitSchema: ({ start, end, isSplit }) => {
			const range = {
				start: start === 0 ? 0 : start - 1,
				end: end - 1
			};
			return {
				__splitRange: createTableBodySplitRange(range.start, range.end),
				__isSplit: isSplit
			};
		}
	};
};
//#endregion
export { getCellPropPanelSchema as a, HEX_COLOR_PATTERN as c, getBodyWithSchemaRange as i, createSingleTable as l, getDynamicLayoutForTable as n, getColumnStylesPropPanelSchema as o, getBody as r, getDefaultCellStyles as s, getDynamicHeightsForTable as t };

//# sourceMappingURL=dynamicTemplate-BgH01dcs.js.map