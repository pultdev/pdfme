import { i as createFragmentNode, t as Fragment } from "./node-B6TrQFvN.js";
//#region src/jsx-runtime.ts
var jsx = (type, props, key) => {
	if (type === Fragment) return createFragmentNode(props, key);
	if (typeof type === "function") return type({
		...props,
		key
	});
	throw new Error("@pdfme/jsx: intrinsic JSX elements are not supported. Use pdfme components.");
};
var jsxs = jsx;
//#endregion
export { Fragment, jsx, jsxs };

//# sourceMappingURL=jsx-runtime.js.map