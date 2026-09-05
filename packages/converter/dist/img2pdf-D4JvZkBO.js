import { mm2pt, pt2mm } from "@pdfme/common";
import { PDFDocument } from "@pdfme/pdf-lib";
//#region src/pdf2img.ts
var uint8ArrayToArrayBuffer = (bytes) => {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);
	return buffer;
};
async function pdf2img(pdf, options = {}, env) {
	try {
		const { scale = 1, range = {} } = options;
		const { start = 0, end = Infinity } = range;
		const { openDocument } = env;
		const pdfDoc = await openDocument(pdf);
		try {
			const numPages = pdfDoc.pageCount;
			const startPage = Math.max(start + 1, 1);
			const endPage = Math.min(end + 1, numPages);
			const results = [];
			for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
				const png = await pdfDoc.page(pageNum).png({
					scale,
					forms: true
				});
				results.push(uint8ArrayToArrayBuffer(png));
			}
			return results;
		} finally {
			await pdfDoc.destroy?.();
		}
	} catch (error) {
		throw new Error(`[@pdfme/converter] pdf2img failed: ${error.message}`);
	}
}
//#endregion
//#region src/pdf2size.ts
async function pdf2size(pdf, options = {}, env) {
	const { scale = 1 } = options;
	const { openDocument } = env;
	const pdfDoc = await openDocument(pdf);
	try {
		return Array.from({ length: pdfDoc.pageCount }, (_, i) => {
			const page = pdfDoc.page(i + 1);
			return {
				height: pt2mm(page.height * scale),
				width: pt2mm(page.width * scale)
			};
		});
	} finally {
		await pdfDoc.destroy?.();
	}
}
//#endregion
//#region src/img2pdf.ts
function detectImageType(buffer) {
	const bytes = new Uint8Array(buffer);
	if (bytes.length >= 2 && bytes[0] === 255 && bytes[1] === 216) return "jpeg";
	if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return "png";
	return "unknown";
}
async function img2pdf(imgs, options = {}) {
	try {
		const { scale = 1, size, margin = [
			0,
			0,
			0,
			0
		] } = options;
		if (!Array.isArray(imgs) || imgs.length === 0) throw new Error("Input must be a non-empty array of image buffers");
		const doc = await PDFDocument.create();
		for (const img of imgs) try {
			let image;
			const type = detectImageType(img);
			if (type === "jpeg") image = await doc.embedJpg(img);
			else if (type === "png") image = await doc.embedPng(img);
			else try {
				image = await doc.embedJpg(img);
			} catch {
				image = await doc.embedPng(img);
			}
			const page = doc.addPage();
			const { width: imgWidth, height: imgHeight } = image.scale(scale);
			const pageWidth = size ? mm2pt(size.width) : imgWidth;
			const pageHeight = size ? mm2pt(size.height) : imgHeight;
			page.setSize(pageWidth, pageHeight);
			const [topMargin, rightMargin, bottomMargin, leftMargin] = margin.map(mm2pt);
			const availableWidth = pageWidth - leftMargin - rightMargin;
			const availableHeight = pageHeight - topMargin - bottomMargin;
			const widthRatio = availableWidth / imgWidth;
			const heightRatio = availableHeight / imgHeight;
			const ratio = Math.min(widthRatio, heightRatio, 1);
			const finalWidth = imgWidth * ratio;
			const finalHeight = imgHeight * ratio;
			const x = leftMargin + (availableWidth - finalWidth) / 2;
			const y = bottomMargin + (availableHeight - finalHeight) / 2;
			page.drawImage(image, {
				x,
				y,
				width: finalWidth,
				height: finalHeight
			});
		} catch (error) {
			throw new Error(`Failed to process image: ${error.message}`);
		}
		const pdfUint8Array = await doc.save();
		const buffer = new ArrayBuffer(pdfUint8Array.byteLength);
		new Uint8Array(buffer).set(pdfUint8Array);
		return buffer;
	} catch (error) {
		throw new Error(`[@pdfme/converter] img2pdf failed: ${error.message}`);
	}
}
//#endregion
export { pdf2size as n, pdf2img as r, img2pdf as t };

//# sourceMappingURL=img2pdf-D4JvZkBO.js.map