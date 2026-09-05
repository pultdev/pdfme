import { s as createTextLineSplitRange } from "./splitRange-BHV0vb0Q.js";
import { a as measureTextLines, c as sumLineHeights, d as isInlineMarkdownTextSchema, n as getTextLineHeightsWithBox, r as getTextSplitBoxStyle } from "./measure-BC7tjAtT.js";
import { n as substituteVariablesAsInlineMarkdownLiterals, r as validateVariables, t as substituteVariables } from "./helper-VroN19Ci.js";
//#region src/multiVariableText/dynamicTemplate.ts
var getDynamicLayoutForMultiVariableText = async (value, args) => {
	if (args.schema.type !== "multiVariableText") return { heights: [args.schema.height] };
	const schema = args.schema;
	if (schema.overflow !== "expand") return { heights: [schema.height] };
	let renderValue = value;
	if (!schema.readOnly) {
		if (!validateVariables(value, schema)) return { heights: [schema.height] };
		renderValue = isInlineMarkdownTextSchema(schema) ? substituteVariablesAsInlineMarkdownLiterals(schema.text || "", value) : substituteVariables(schema.text || "", value);
	}
	const { lineHeights } = await measureTextLines({
		value: renderValue,
		schema,
		font: args.options.font,
		_cache: args._cache,
		ignoreDynamicFontSize: true
	});
	const heights = getTextLineHeightsWithBox(lineHeights, schema);
	const measuredHeight = sumLineHeights(heights);
	if (measuredHeight <= schema.height || lineHeights.length === 0) return {
		heights: [schema.height],
		patchSplitSchema: () => ({ dynamicFontSize: void 0 })
	};
	return {
		heights: lineHeights.length === 1 ? [Math.max(schema.height, measuredHeight)] : heights,
		patchSplitSchema: ({ start, end, isSplit }) => ({
			dynamicFontSize: void 0,
			__splitRange: lineHeights.length === 1 ? void 0 : createTextLineSplitRange(start, end),
			__isSplit: isSplit,
			...getTextSplitBoxStyle(schema, {
				start,
				end
			}, lineHeights.length)
		})
	};
};
//#endregion
//#region src/text/dynamicTemplate.ts
var getDynamicLayoutForText = async (value, args) => {
	if (args.schema.type !== "text") return { heights: [args.schema.height] };
	const schema = args.schema;
	if (schema.overflow !== "expand") return { heights: [schema.height] };
	const { lineHeights } = await measureTextLines({
		value,
		schema,
		font: args.options.font,
		_cache: args._cache,
		ignoreDynamicFontSize: true
	});
	const heights = getTextLineHeightsWithBox(lineHeights, schema);
	const measuredHeight = sumLineHeights(heights);
	if (measuredHeight <= schema.height || lineHeights.length === 0) return {
		heights: [schema.height],
		patchSplitSchema: () => ({ dynamicFontSize: void 0 })
	};
	return {
		heights: lineHeights.length === 1 ? [Math.max(schema.height, measuredHeight)] : heights,
		patchSplitSchema: ({ start, end, isSplit }) => ({
			dynamicFontSize: void 0,
			__splitRange: lineHeights.length === 1 ? void 0 : createTextLineSplitRange(start, end),
			__isSplit: isSplit,
			...getTextSplitBoxStyle(schema, {
				start,
				end
			}, lineHeights.length)
		})
	};
};
//#endregion
export { getDynamicLayoutForMultiVariableText as n, getDynamicLayoutForText as t };

//# sourceMappingURL=dynamicTemplate-BcCrm2SZ.js.map