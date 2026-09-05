import { n as pdf2size$1, r as pdf2img$1, t as img2pdf } from "./img2pdf-D4JvZkBO.js";
//#region src/clawpdf-worker.ts?worker&url
var clawpdf_worker_default = "" + new URL("assets/clawpdf-worker-CEyor7iC.js", import.meta.url).href;
//#endregion
//#region src/index.browser.ts
var clonePdfData = (pdf) => new Uint8Array(pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf));
var enginePromise;
var clawpdfPromise;
var worker;
var workerRequestId = 0;
var pendingWorkerRequests = /* @__PURE__ */ new Map();
var getEngine = () => {
	enginePromise ?? (enginePromise = (async () => {
		clawpdfPromise ?? (clawpdfPromise = import("clawpdf/browser"));
		const { createEngine } = await clawpdfPromise;
		return createEngine();
	})());
	return enginePromise;
};
var openDocument = async (pdf) => (await getEngine()).open(clonePdfData(pdf));
var runInWorker = (type, pdf, options) => {
	worker ?? (worker = createRenderWorker());
	const id = ++workerRequestId;
	const pdfBuffer = clonePdfData(pdf).buffer;
	return new Promise((resolve, reject) => {
		pendingWorkerRequests.set(id, {
			resolve,
			reject
		});
		worker?.postMessage({
			id,
			type,
			pdf: pdfBuffer,
			options
		}, [pdfBuffer]);
	});
};
var createRenderWorker = () => {
	const nextWorker = new Worker(clawpdf_worker_default, { type: "module" });
	nextWorker.addEventListener("message", (event) => {
		const response = event.data;
		const pending = pendingWorkerRequests.get(response.id);
		if (!pending) return;
		pendingWorkerRequests.delete(response.id);
		if (response.ok) {
			pending.resolve(response.result);
			return;
		}
		const error = new Error(response.error.message);
		error.name = response.error.name || error.name;
		error.stack = response.error.stack;
		pending.reject(error);
	});
	nextWorker.addEventListener("error", (event) => {
		const error = new Error(event.message || "PDF render worker failed");
		for (const pending of pendingWorkerRequests.values()) pending.reject(error);
		pendingWorkerRequests.clear();
		worker?.terminate();
		worker = void 0;
	});
	return nextWorker;
};
var runPdf2imgDirect = (pdf, options = {}) => pdf2img$1(pdf, options, { openDocument });
var runPdf2sizeDirect = (pdf, options = {}) => pdf2size$1(pdf, options, { openDocument });
var pdf2img = async (pdf, options = {}) => {
	if (typeof Worker === "undefined") return runPdf2imgDirect(pdf, options);
	return runInWorker("pdf2img", pdf, options);
};
var pdf2size = async (pdf, options = {}) => typeof Worker === "undefined" ? runPdf2sizeDirect(pdf, options) : runInWorker("pdf2size", pdf, options);
//#endregion
export { img2pdf, pdf2img, pdf2size };

//# sourceMappingURL=index.js.map