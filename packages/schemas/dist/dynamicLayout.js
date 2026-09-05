import { a as createListItemSplitRange, c as getListItemRange, i as TEXT_LINE_SPLIT_UNIT, l as getTableBodyRange, n as LIST_ITEM_SPLIT_UNIT, o as createTableBodySplitRange, r as TABLE_BODY_SPLIT_UNIT, s as createTextLineSplitRange, t as BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS, u as getTextLineRange } from "./splitRange-BHV0vb0Q.js";
import { n as getDynamicLayoutForTable } from "./dynamicTemplate-BgH01dcs.js";
import { t as getDynamicLayoutForList } from "./dynamicTemplate-DQF7c6NR.js";
import { n as getDynamicLayoutForMultiVariableText, t as getDynamicLayoutForText } from "./dynamicTemplate-BcCrm2SZ.js";
//#region src/dynamicLayout.ts
var isExpandableTextSchema = (schema) => (schema.type === "text" || schema.type === "multiVariableText") && schema.overflow === "expand";
var isDynamicLayoutSchema = (schema) => schema.type === "table" || schema.type === "list" || isExpandableTextSchema(schema);
var getDynamicLayoutForSchema = (value, args) => {
	switch (args.schema.type) {
		case "table": return getDynamicLayoutForTable(value, args);
		case "list": return getDynamicLayoutForList(value, args);
		case "text": return getDynamicLayoutForText(value, args);
		case "multiVariableText": return getDynamicLayoutForMultiVariableText(value, args);
		default: return Promise.resolve([args.schema.height]);
	}
};
//#endregion
export { BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS, LIST_ITEM_SPLIT_UNIT, TABLE_BODY_SPLIT_UNIT, TEXT_LINE_SPLIT_UNIT, createListItemSplitRange, createTableBodySplitRange, createTextLineSplitRange, getDynamicLayoutForSchema, getListItemRange, getTableBodyRange, getTextLineRange, isDynamicLayoutSchema };

//# sourceMappingURL=dynamicLayout.js.map