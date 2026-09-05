import { h as escapeInlineMarkdown } from "./measure-BC7tjAtT.js";
//#region src/multiVariableText/helper.ts
var substituteVariables = (text, variablesIn, valueMapper = (value) => value) => {
	if (!text) return "";
	let substitutedText = text;
	if (variablesIn) {
		let variables;
		try {
			variables = typeof variablesIn === "string" ? JSON.parse(variablesIn || "{}") : variablesIn;
		} catch {
			throw new SyntaxError(`[@pdfme/schemas] MVT: invalid JSON string '${variablesIn}'`);
		}
		Object.keys(variables).forEach((variableName) => {
			const variableForRegex = variableName.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
			const regex = new RegExp("\\{" + variableForRegex + "\\}", "g");
			substitutedText = substitutedText.replace(regex, valueMapper(variables[variableName], variableName));
		});
	}
	substitutedText = substitutedText.replace(/{[^{}]+}/g, "");
	return substitutedText;
};
var substituteVariablesAsInlineMarkdownLiterals = (text, variablesIn) => substituteVariables(text, variablesIn, escapeInlineMarkdown);
var validateVariables = (value, schema) => {
	if (schema.variables.length === 0) return true;
	let values;
	try {
		values = value ? JSON.parse(value) : {};
	} catch {
		throw new SyntaxError(`[@pdfme/generator] invalid JSON string '${value}' for variables in field ${schema.name}`);
	}
	for (const variable of schema.variables) if (!Object.prototype.hasOwnProperty.call(values, variable) || values[variable] === null || values[variable] === void 0) {
		if (schema.required) throw new Error(`[@pdfme/generator] variable ${variable} is missing for field ${schema.name}`);
		return false;
	}
	return true;
};
//#endregion
export { substituteVariablesAsInlineMarkdownLiterals as n, validateVariables as r, substituteVariables as t };

//# sourceMappingURL=helper-VroN19Ci.js.map