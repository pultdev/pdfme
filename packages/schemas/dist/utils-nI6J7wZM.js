import { t as getDynamicHeightsForTable$1 } from "./dynamicTemplate-BgH01dcs.js";
import { isHexValid, mm2pt } from "@pdfme/common";
import { cmyk, degrees, degreesToRadians, rgb } from "@pdfme/pdf-lib";
//#region src/multiVariableText/variables.ts
var visitVariables = (content, visitor) => {
	let startIndex = -1;
	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		if (char === "{") {
			startIndex = i;
			continue;
		}
		if (char === "}" && startIndex !== -1) {
			const name = content.slice(startIndex + 1, i);
			if (name.length > 0) visitor({
				name,
				startIndex,
				endIndex: i
			});
			startIndex = -1;
		}
	}
};
var countUniqueVariableNames = (content) => {
	const variableNames = /* @__PURE__ */ new Set();
	visitVariables(content, ({ name }) => {
		variableNames.add(name);
	});
	return variableNames.size;
};
var getVariableNames = (content) => {
	const variableNames = [];
	visitVariables(content, ({ name }) => {
		variableNames.push(name);
	});
	return variableNames;
};
//#endregion
//#region src/utils.ts
var convertForPdfLayoutProps = ({ schema, pageHeight, applyRotateTranslate = true }) => {
	const { width: mmWidth, height: mmHeight, position, rotate, opacity } = schema;
	const { x: mmX, y: mmY } = position;
	const rotateDegrees = rotate ? -rotate : 0;
	const width = mm2pt(mmWidth);
	const height = mm2pt(mmHeight);
	let x = mm2pt(mmX);
	let y = pageHeight - mm2pt(mmY) - height;
	if (rotateDegrees && applyRotateTranslate) {
		const pivotPoint = {
			x: x + width / 2,
			y: pageHeight - mm2pt(mmY) - height / 2
		};
		const rotatedPoint = rotatePoint({
			x,
			y
		}, pivotPoint, rotateDegrees);
		x = rotatedPoint.x;
		y = rotatedPoint.y;
	}
	return {
		position: {
			x,
			y
		},
		height,
		width,
		rotate: degrees(rotateDegrees),
		opacity
	};
};
var rotatePoint = (point, pivot, angleDegrees) => {
	const angleRadians = degreesToRadians(angleDegrees);
	return {
		x: Math.cos(angleRadians) * (point.x - pivot.x) - Math.sin(angleRadians) * (point.y - pivot.y) + pivot.x,
		y: Math.sin(angleRadians) * (point.x - pivot.x) + Math.cos(angleRadians) * (point.y - pivot.y) + pivot.y
	};
};
var getDynamicHeightsForTable = getDynamicHeightsForTable$1;
var addAlphaToHex = (hex, alphaPercentage) => {
	if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(hex)) throw new Error("Invalid HEX color code");
	let alphaHex = Math.round(alphaPercentage / 100 * 255).toString(16);
	if (alphaHex.length === 1) alphaHex = "0" + alphaHex;
	return hex + alphaHex;
};
var isEditable = (mode, schema) => mode === "designer" || mode === "form" && schema.readOnly !== true;
var hex2rgb = (hex) => {
	if (hex.slice(0, 1) === "#") hex = hex.slice(1);
	if (hex.length === 3) hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);
	return [
		hex.slice(0, 2),
		hex.slice(2, 4),
		hex.slice(4, 6)
	].map((str) => parseInt(str, 16));
};
var hex2RgbColor = (hexString) => {
	if (hexString) {
		if (!isHexValid(hexString)) throw new Error(`Invalid hex color value ${hexString}`);
		const [r, g, b] = hex2rgb(hexString);
		return rgb(r / 255, g / 255, b / 255);
	}
};
var hex2CmykColor = (hexString) => {
	if (hexString) {
		if (!isHexValid(hexString)) throw new Error(`Invalid hex color value ${hexString}`);
		hexString = hexString.replace("#", "");
		const hexColor = hexString.substring(0, 6);
		const opacityColor = hexString.substring(6, 8);
		const opacity = opacityColor ? parseInt(opacityColor, 16) / 255 : 1;
		let r = parseInt(hexColor.substring(0, 2), 16) / 255;
		let g = parseInt(hexColor.substring(2, 4), 16) / 255;
		let b = parseInt(hexColor.substring(4, 6), 16) / 255;
		r = r * opacity + (1 - opacity);
		g = g * opacity + (1 - opacity);
		b = b * opacity + (1 - opacity);
		const k = 1 - Math.max(r, g, b);
		const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
		const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
		const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
		return cmyk(c, m, y, k);
	}
};
var hex2PrintingColor = (color, colorType) => {
	if (typeof color === "object") return color;
	return colorType?.toLowerCase() == "cmyk" ? hex2CmykColor(color) : hex2RgbColor(color);
};
var readFile = (input) => new Promise((resolve, reject) => {
	const fileReader = new FileReader();
	fileReader.onload = (e) => {
		if (e.target?.result) resolve(e.target.result);
	};
	fileReader.onerror = () => {
		reject(/* @__PURE__ */ new Error("[@pdfme/schemas] File reading failed"));
	};
	let file = null;
	if (input instanceof FileList && input.length > 0) file = input[0];
	else if (input instanceof File) file = input;
	if (file) fileReader.readAsDataURL(file);
	else reject(/* @__PURE__ */ new Error("[@pdfme/schemas] No files provided"));
});
var createErrorElm = () => {
	const container = document.createElement("div");
	Object.assign(container.style, {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		height: "100%"
	});
	const span = document.createElement("span");
	Object.assign(span.style, {
		color: "white",
		background: "red",
		padding: "0.25rem",
		fontSize: "12pt",
		fontWeight: "bold",
		borderRadius: "2px",
		fontFamily: "'Open Sans', sans-serif"
	});
	span.textContent = "ERROR";
	container.appendChild(span);
	return container;
};
var createSvgStr = (icon, attrs) => {
	const safeTagNames = /* @__PURE__ */ new Set([
		"svg",
		"circle",
		"ellipse",
		"g",
		"line",
		"path",
		"polygon",
		"polyline",
		"rect"
	]);
	const safeAttributeNames = /* @__PURE__ */ new Set([
		"aria-hidden",
		"aria-label",
		"class",
		"clip-rule",
		"cx",
		"cy",
		"d",
		"fill",
		"fill-opacity",
		"fill-rule",
		"focusable",
		"height",
		"id",
		"opacity",
		"points",
		"preserveAspectRatio",
		"r",
		"role",
		"rx",
		"ry",
		"stroke",
		"stroke-dasharray",
		"stroke-dashoffset",
		"stroke-linecap",
		"stroke-linejoin",
		"stroke-miterlimit",
		"stroke-opacity",
		"stroke-width",
		"transform",
		"vector-effect",
		"viewBox",
		"width",
		"x",
		"x1",
		"x2",
		"xmlns",
		"xmlns:xlink",
		"y",
		"y1",
		"y2"
	]);
	const escapeHtmlAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
	const escapeHtmlText = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
	const toSafeAttributeString = (attributes) => Object.entries(attributes).filter(([key, value]) => safeAttributeNames.has(key) && value !== void 0 && value !== null && !key.toLowerCase().startsWith("on")).map(([key, value]) => `${key}="${escapeHtmlAttribute(String(value))}"`).join(" ");
	const toSafeTagName = (tag) => {
		const tagName = String(tag);
		if (!safeTagNames.has(tagName)) throw new Error(`Invalid SVG tag name: ${tagName}`);
		return tagName;
	};
	if (!Array.isArray(icon)) return escapeHtmlText(String(icon));
	const svgAttrString = toSafeAttributeString({
		xmlns: "http://www.w3.org/2000/svg",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "2",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		...attrs
	});
	const processElement = (element) => {
		if (!Array.isArray(element)) return escapeHtmlText(String(element));
		const [tag, attributes = {}, children = []] = element;
		const tagName = toSafeTagName(tag);
		const attrString = toSafeAttributeString(attributes);
		let childrenString = "";
		if (Array.isArray(children) && children.length > 0) childrenString = children.map((child) => processElement(child)).join("");
		if (childrenString) return `<${String(tagName)}${attrString ? " " + String(attrString) : ""}>${childrenString}</${String(tagName)}>`;
		else return `<${String(tagName)}${attrString ? " " + String(attrString) : ""}/>`;
	};
	return `<svg ${svgAttrString}>${Array.isArray(icon) ? icon.map((element) => processElement(element)).join("") : processElement(icon)}</svg>`;
};
//#endregion
export { getDynamicHeightsForTable as a, isEditable as c, countUniqueVariableNames as d, getVariableNames as f, createSvgStr as i, readFile as l, convertForPdfLayoutProps as n, hex2PrintingColor as o, visitVariables as p, createErrorElm as r, hex2RgbColor as s, addAlphaToHex as t, rotatePoint as u };

//# sourceMappingURL=utils-nI6J7wZM.js.map