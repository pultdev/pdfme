//#region src/node.ts
var Fragment = Symbol.for("@pdfme/jsx.fragment");
var isPdfJsxElement = (value) => typeof value === "object" && value !== null && "kind" in value && typeof value.kind === "string";
var isPdfJsxFragment = (value) => typeof value === "object" && value !== null && "kind" in value && value.kind === "fragment";
var normalizeChildren = (children) => {
	if (children === void 0) return [];
	return Array.isArray(children) ? children : [children];
};
var createElementNode = (kind, rawProps, key) => {
	const { children, ...props } = rawProps ?? {};
	return {
		kind,
		props,
		children: normalizeChildren(children),
		key
	};
};
var createFragmentNode = (rawProps, key) => ({
	kind: "fragment",
	children: normalizeChildren(rawProps?.children),
	key
});
var cloneElementWithChildren = (element, children) => ({
	...element,
	children
});
//#endregion
export { isPdfJsxElement as a, createFragmentNode as i, cloneElementWithChildren as n, isPdfJsxFragment as o, createElementNode as r, Fragment as t };

//# sourceMappingURL=node-B6TrQFvN.js.map