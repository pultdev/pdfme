import { n as pdf2size$1, r as pdf2img$1, t as img2pdf } from "./img2pdf-D4JvZkBO.js";
import { createEngine } from "clawpdf";
//#region src/index.node.ts
var clonePdfData = (pdf) => new Uint8Array(pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf));
var enginePromise;
var getEngine = () => {
	enginePromise ?? (enginePromise = createEngine());
	return enginePromise;
};
var openDocument = async (pdf) => (await getEngine()).open(clonePdfData(pdf));
var pdf2img = async (pdf, options = {}) => {
	return pdf2img$1(pdf, options, { openDocument });
};
var pdf2size = async (pdf, options = {}) => {
	return pdf2size$1(pdf, options, { openDocument });
};
//#endregion
export { img2pdf, pdf2img, pdf2size };

//# sourceMappingURL=index.node.js.map