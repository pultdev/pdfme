import * as pdfLib from "@pdfme/pdf-lib";
import { EncryptedPDFError, PDFArray, PDFDict, PDFDocument, PDFEmbeddedPage, PDFFont, PDFHexString, PDFName, PDFObjectCopier, PDFPage, PDFString, TextAlignment } from "@pdfme/pdf-lib";
import { applyInternalLinkAnnotations, checkGenerateProps, cloneDeep, getB64BasePdf, getDefaultFont, getDynamicTemplate, getFallbackFontName, isBlankPdf, mm2pt, normalizeSafeLinkUri, pluginRegistry, pt2mm, registerInternalLinkAnchor, replacePlaceholders, resetInternalLinkAnnotations } from "@pdfme/common";
import { getDynamicLayoutForSchema, isDynamicLayoutSchema } from "@pdfme/schemas/dynamicLayout";
import * as fontkit from "fontkit";
import { builtInPlugins } from "@pdfme/schemas/builtins";
import { checkbox, radioGroup, text } from "@pdfme/schemas";
import { convertForPdfLayoutProps, hex2PrintingColor } from "@pdfme/schemas/utils";
//#region src/constants.ts
var TOOL_NAME = "pdfme (https://pdfme.com/)";
//#endregion
//#region src/helper.ts
var isEncryptedPdfError = (error) => error instanceof EncryptedPDFError || error instanceof Error && error.message.startsWith("Input document to `PDFDocument.load` is encrypted.");
var isPasswordFailure = (error) => error instanceof Error && (error.message === "NEEDS PASSWORD" || error.message === "Password incorrect");
var loadBasePdfWithPassword = async (pdf, password) => {
	try {
		return await PDFDocument.load(pdf, { password });
	} catch (error) {
		if (!isPasswordFailure(error)) throw error;
		throw new Error("[@pdfme/generator] basePdf is encrypted and requires a valid password. Pass options.basePdfPassword to generate().");
	}
};
var loadBasePdf = async (pdf, password) => {
	if (password !== void 0) return loadBasePdfWithPassword(pdf, password);
	try {
		return await PDFDocument.load(pdf);
	} catch (error) {
		if (!isEncryptedPdfError(error)) throw error;
		return loadBasePdfWithPassword(pdf, "");
	}
};
var getBasePdfPassword = (options) => {
	const password = options?.basePdfPassword;
	return typeof password === "string" ? password : void 0;
};
var toBoundingBox = ({ x, y, width, height }) => ({
	left: x,
	bottom: y,
	right: x + width,
	top: y + height
});
var toOriginBox = ({ width, height }) => ({
	x: 0,
	y: 0,
	width,
	height
});
var getVisibleRect = (rect, sourceBox) => {
	if (!sourceBox) return rect;
	const left = Math.max(rect.x, sourceBox.x);
	const bottom = Math.max(rect.y, sourceBox.y);
	const right = Math.min(rect.x + rect.width, sourceBox.x + sourceBox.width);
	const top = Math.min(rect.y + rect.height, sourceBox.y + sourceBox.height);
	if (right <= left || top <= bottom) return;
	return {
		x: left - sourceBox.x,
		y: bottom - sourceBox.y,
		width: right - left,
		height: top - bottom
	};
};
var getEmbedPdfPages = async (arg) => {
	const { template: { schemas, basePdf }, options, pdfDoc } = arg;
	let basePages = [];
	let embedPdfBoxes = [];
	if (isBlankPdf(basePdf)) {
		const { width: _width, height: _height } = basePdf;
		const width = mm2pt(_width);
		const height = mm2pt(_height);
		basePages = schemas.map(() => {
			const page = PDFPage.create(pdfDoc);
			page.setSize(width, height);
			return page;
		});
		embedPdfBoxes = schemas.map(() => ({
			mediaBox: {
				x: 0,
				y: 0,
				width,
				height
			},
			bleedBox: {
				x: 0,
				y: 0,
				width,
				height
			},
			trimBox: {
				x: 0,
				y: 0,
				width,
				height
			}
		}));
	} else {
		const embedPdfPages = (await loadBasePdf(await getB64BasePdf(basePdf), getBasePdfPassword(options))).getPages();
		const sourceBoxes = embedPdfPages.map((p) => p.getCropBox());
		embedPdfBoxes = embedPdfPages.map((p, index) => {
			const sourceBox = sourceBoxes[index];
			const outputBox = toOriginBox(sourceBox);
			return {
				mediaBox: outputBox,
				bleedBox: outputBox,
				trimBox: outputBox,
				sourceBox,
				sourcePage: p
			};
		});
		const boundingBoxes = sourceBoxes.map(toBoundingBox);
		basePages = await pdfDoc.embedPages(embedPdfPages, boundingBoxes);
	}
	return {
		basePages,
		embedPdfBoxes
	};
};
var getSafeUriFromLinkAnnotation = (annotation) => {
	if (annotation.lookupMaybe(PDFName.of("Subtype"), PDFName) !== PDFName.of("Link")) return;
	const action = annotation.lookupMaybe(PDFName.of("A"), PDFDict);
	if (!action) return;
	if (action.lookupMaybe(PDFName.of("S"), PDFName) !== PDFName.of("URI")) return;
	const uri = action.lookupMaybe(PDFName.of("URI"), PDFString, PDFHexString);
	return uri ? normalizeSafeLinkUri(uri.decodeText()) : void 0;
};
var copyBasePdfUriLinkAnnotations = (arg) => {
	const { sourceBox, sourcePage, targetPage, pdfDoc } = arg;
	const sourceAnnots = sourcePage.node.Annots();
	if (!sourceAnnots) return;
	const copier = PDFObjectCopier.for(sourcePage.doc.context, pdfDoc.context);
	for (let idx = 0; idx < sourceAnnots.size(); idx += 1) {
		const sourceAnnotation = sourceAnnots.lookupMaybe(idx, PDFDict);
		if (!sourceAnnotation) continue;
		const safeUri = getSafeUriFromLinkAnnotation(sourceAnnotation);
		if (!safeUri) continue;
		const rect = sourceAnnotation.lookupMaybe(PDFName.of("Rect"), PDFArray);
		if (!rect) continue;
		const visibleRect = getVisibleRect(rect.asRectangle(), sourceBox);
		if (!visibleRect) continue;
		const border = sourceAnnotation.lookupMaybe(PDFName.of("Border"), PDFArray);
		const color = sourceAnnotation.lookupMaybe(PDFName.of("C"), PDFArray);
		const highlightMode = sourceAnnotation.lookupMaybe(PDFName.of("H"), PDFName);
		const copiedAnnotation = pdfDoc.context.obj({
			Type: PDFName.of("Annot"),
			Subtype: PDFName.of("Link"),
			Rect: [
				visibleRect.x,
				visibleRect.y,
				visibleRect.x + visibleRect.width,
				visibleRect.y + visibleRect.height
			],
			Border: border ? copier.copy(border) : pdfDoc.context.obj([
				0,
				0,
				0
			]),
			C: color ? copier.copy(color) : void 0,
			H: highlightMode ? copier.copy(highlightMode) : void 0,
			A: {
				Type: PDFName.of("Action"),
				S: PDFName.of("URI"),
				URI: PDFString.of(safeUri)
			}
		});
		targetPage.node.addAnnot(pdfDoc.context.register(copiedAnnotation));
	}
};
var validateRequiredFields = (template, inputs) => {
	template.schemas.forEach((schemaPage) => schemaPage.forEach((schema) => {
		if (schema.required && !schema.readOnly && !inputs.some((input) => input[schema.name])) throw new Error(`[@pdfme/generator] input for '${schema.name}' is required to generate this PDF`);
	}));
};
var preprocessing = async (arg) => {
	const { template, userPlugins } = arg;
	const { schemas, basePdf } = template;
	const staticSchema = isBlankPdf(basePdf) ? basePdf.staticSchema ?? [] : [];
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const plugins = pluginRegistry(Object.values(userPlugins).length > 0 ? userPlugins : builtInPlugins);
	return {
		pdfDoc,
		renderObj: Array.from(new Set(schemas.flatMap((schemaPage) => schemaPage.map((schema) => schema.type)).concat(staticSchema.map((schema) => schema.type)))).reduce((acc, type) => {
			const plugin = plugins.findByType(type);
			if (!plugin || !plugin.pdf) throw new Error(`[@pdfme/generator] Plugin or renderer for type ${type} not found.
Check this document: https://pdfme.com/docs/custom-schemas`);
			return {
				...acc,
				[type]: plugin.pdf
			};
		}, {})
	};
};
var postProcessing = (props) => {
	const { pdfDoc, options } = props;
	const { author = TOOL_NAME, creationDate = /* @__PURE__ */ new Date(), creator = TOOL_NAME, keywords = [], lang = "en", modificationDate = /* @__PURE__ */ new Date(), producer = TOOL_NAME, subject = "", title = "" } = options;
	pdfDoc.setAuthor(author);
	pdfDoc.setCreationDate(creationDate);
	pdfDoc.setCreator(creator);
	pdfDoc.setKeywords(keywords);
	pdfDoc.setLanguage(lang);
	pdfDoc.setModificationDate(modificationDate);
	pdfDoc.setProducer(producer);
	pdfDoc.setSubject(subject);
	pdfDoc.setTitle(title);
};
var insertPage = (arg) => {
	const { basePage, embedPdfBox, pdfDoc } = arg;
	const size = basePage instanceof PDFEmbeddedPage ? basePage.size() : basePage.getSize();
	const insertedPage = basePage instanceof PDFEmbeddedPage ? pdfDoc.addPage([size.width, size.height]) : pdfDoc.addPage(basePage);
	if (basePage instanceof PDFEmbeddedPage) {
		insertedPage.drawPage(basePage);
		const { mediaBox, bleedBox, trimBox } = embedPdfBox;
		insertedPage.setMediaBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
		insertedPage.setBleedBox(bleedBox.x, bleedBox.y, bleedBox.width, bleedBox.height);
		insertedPage.setTrimBox(trimBox.x, trimBox.y, trimBox.width, trimBox.height);
		if (embedPdfBox.sourcePage) copyBasePdfUriLinkAnnotations({
			sourceBox: embedPdfBox.sourceBox,
			sourcePage: embedPdfBox.sourcePage,
			targetPage: insertedPage,
			pdfDoc
		});
	}
	return insertedPage;
};
//#endregion
//#region src/generate.ts
var hasDynamicLayoutSchema = (schemas) => {
	for (let i = 0; i < schemas.length; i += 1) {
		const schemaPage = schemas[i];
		for (let j = 0; j < schemaPage.length; j += 1) if (isDynamicLayoutSchema(schemaPage[j])) return true;
	}
	return false;
};
var getSchemaRenderInfo = (schemas) => {
	const schemaNameSet = /* @__PURE__ */ new Set();
	const schemaPages = [];
	for (let i = 0; i < schemas.length; i += 1) {
		const schemaPage = schemas[i];
		const schemaMap = /* @__PURE__ */ new Map();
		for (let j = 0; j < schemaPage.length; j += 1) {
			const schema = schemaPage[j];
			if (!schema.name) continue;
			schemaNameSet.add(schema.name);
			if (!schemaMap.has(schema.name)) schemaMap.set(schema.name, schema);
		}
		schemaPages.push(schemaMap);
	}
	return {
		schemaNames: Array.from(schemaNameSet),
		schemaPages
	};
};
var getAdjustedSchema = (schema, boundingBoxLeft, boundingBoxBottom) => {
	if (boundingBoxLeft === 0 && boundingBoxBottom === 0) return schema;
	return {
		...schema,
		position: {
			x: schema.position.x + boundingBoxLeft,
			y: schema.position.y - boundingBoxBottom
		}
	};
};
var registerSchemaAnchor = (_cache, schema, page) => {
	if (!schema.name) return;
	registerInternalLinkAnchor({
		_cache,
		name: schema.name,
		page,
		x: mm2pt(schema.position.x),
		y: page.getHeight() - mm2pt(schema.position.y)
	});
};
var getRenderOptions = (options) => {
	const renderOptions = { ...options };
	delete renderOptions.basePdfPassword;
	return renderOptions;
};
var generate = async (props) => {
	checkGenerateProps(props);
	const { inputs, template: _template, options = {}, plugins: userPlugins = {} } = props;
	const renderOptions = getRenderOptions(options);
	const template = cloneDeep(_template);
	const basePdf = template.basePdf;
	const isBlankBasePdf = isBlankPdf(basePdf);
	const staticSchemas = isBlankBasePdf ? basePdf.staticSchema ?? [] : [];
	const shouldApplyDynamicTemplate = isBlankBasePdf && hasDynamicLayoutSchema(template.schemas);
	if (inputs.length === 0) throw new Error("[@pdfme/generator] inputs should not be empty, pass at least an empty object in the array");
	validateRequiredFields(template, inputs);
	const { pdfDoc, renderObj } = await preprocessing({
		template,
		userPlugins
	});
	const _cache = /* @__PURE__ */ new Map();
	const cachedEmbedPdfPages = isBlankBasePdf ? void 0 : await getEmbedPdfPages({
		options,
		template,
		pdfDoc
	});
	const cachedRenderInfo = shouldApplyDynamicTemplate ? void 0 : getSchemaRenderInfo(template.schemas);
	for (let i = 0; i < inputs.length; i += 1) {
		const input = inputs[i];
		resetInternalLinkAnnotations(_cache);
		const dynamicTemplate = shouldApplyDynamicTemplate ? await getDynamicTemplate({
			template,
			input,
			options: renderOptions,
			_cache,
			getDynamicHeights: getDynamicLayoutForSchema
		}) : template;
		const { basePages, embedPdfBoxes } = cachedEmbedPdfPages ?? await getEmbedPdfPages({
			options,
			template: dynamicTemplate,
			pdfDoc
		});
		const schemas = dynamicTemplate.schemas;
		const { schemaNames, schemaPages } = shouldApplyDynamicTemplate ? getSchemaRenderInfo(schemas) : cachedRenderInfo;
		for (let j = 0; j < basePages.length; j += 1) {
			const basePage = basePages[j];
			const embedPdfBox = embedPdfBoxes[j];
			const boundingBoxLeft = basePage instanceof pdfLib.PDFEmbeddedPage ? pt2mm(embedPdfBox.mediaBox.x) : 0;
			const boundingBoxBottom = basePage instanceof pdfLib.PDFEmbeddedPage ? pt2mm(embedPdfBox.mediaBox.y) : 0;
			const page = insertPage({
				basePage,
				embedPdfBox,
				pdfDoc
			});
			const variables = {
				...input,
				totalPages: basePages.length,
				currentPage: j + 1
			};
			if (staticSchemas.length > 0) for (let k = 0; k < staticSchemas.length; k += 1) {
				const staticSchema = staticSchemas[k];
				const render = renderObj[staticSchema.type];
				if (!render) continue;
				const value = staticSchema.readOnly ? replacePlaceholders({
					content: staticSchema.content || "",
					variables,
					schemas
				}) : staticSchema.content || "";
				const adjustedStaticSchema = getAdjustedSchema(staticSchema, boundingBoxLeft, boundingBoxBottom);
				registerSchemaAnchor(_cache, adjustedStaticSchema, page);
				await render({
					value,
					schema: adjustedStaticSchema,
					basePdf,
					pdfLib,
					pdfDoc,
					page,
					options: renderOptions,
					_cache
				});
			}
			const schemaPage = schemaPages[j];
			if (!schemaPage) continue;
			for (let l = 0; l < schemaNames.length; l += 1) {
				const name = schemaNames[l];
				const schema = schemaPage.get(name);
				if (!schema) continue;
				const render = renderObj[schema.type];
				if (!render) continue;
				const value = schema.readOnly ? replacePlaceholders({
					content: schema.content || "",
					variables,
					schemas
				}) : input[name] || "";
				const adjustedSchema = getAdjustedSchema(schema, boundingBoxLeft, boundingBoxBottom);
				registerSchemaAnchor(_cache, adjustedSchema, page);
				await render({
					value,
					schema: adjustedSchema,
					basePdf,
					pdfLib,
					pdfDoc,
					page,
					options: renderOptions,
					_cache
				});
			}
		}
		applyInternalLinkAnnotations({
			_cache,
			pdfDoc
		});
	}
	postProcessing({
		pdfDoc,
		options: renderOptions
	});
	return pdfDoc.save();
};
//#endregion
//#region src/acroForm.ts
var DEFAULT_FONT_COLOR = "#000000";
var DEFAULT_FONT_SIZE = 13;
var DEFAULT_FORM_BORDER_COLOR = "#000000";
var FIELD_NAME_COUNTS_CACHE_KEY = "generateForm:fieldNameCounts";
var RADIO_GROUPS_CACHE_KEY = "generateForm:radioGroups";
var getNextFieldName = (baseName, cache) => {
	const normalizedBaseName = baseName.trim() || "field";
	const counts = cache.get(FIELD_NAME_COUNTS_CACHE_KEY) ?? /* @__PURE__ */ new Map();
	const count = (counts.get(normalizedBaseName) ?? 0) + 1;
	counts.set(normalizedBaseName, count);
	cache.set(FIELD_NAME_COUNTS_CACHE_KEY, counts);
	return count === 1 ? normalizedBaseName : `${normalizedBaseName}_${count}`;
};
var getFieldName = (schema, cache) => getNextFieldName(schema.name, cache);
var getRadioOptionName = (schema) => schema.name.trim() || "option";
var getRadioGroupName = (schema) => (schema.group || schema.name).trim() || "radioGroup";
var getRadioGroup = (arg) => {
	const { pdfDoc, schema, _cache } = arg;
	const baseName = getRadioGroupName(schema);
	const optionKey = `${schema.__acroPageIndex ?? 0}:${getRadioOptionName(schema)}`;
	const radioGroups = _cache.get(RADIO_GROUPS_CACHE_KEY) ?? /* @__PURE__ */ new Map();
	const cached = radioGroups.get(baseName);
	if (cached && !cached.optionKeys.has(optionKey)) {
		cached.optionKeys.add(optionKey);
		return cached.radioGroup;
	}
	const radioGroup = pdfDoc.getForm().createRadioGroup(getNextFieldName(baseName, _cache));
	const state = {
		optionKeys: /* @__PURE__ */ new Set([optionKey]),
		radioGroup
	};
	radioGroups.set(baseName, state);
	_cache.set(RADIO_GROUPS_CACHE_KEY, radioGroups);
	return radioGroup;
};
var fetchFontData = async (font, fontName) => {
	const fontValue = font[fontName];
	if (!fontValue) throw new Error(`[@pdfme/generator] Font "${fontName}" is not configured`);
	if (typeof fontValue.data !== "string" || !fontValue.data.startsWith("http")) return fontValue.data;
	const res = await fetch(fontValue.data);
	if (!res.ok) throw new Error(`[@pdfme/generator] Failed to fetch font data from ${fontValue.data}`);
	return res.arrayBuffer();
};
var getPdfFont = async (arg) => {
	const { pdfDoc, font, fontName, _cache } = arg;
	const cacheKey = `generateForm:font:${fontName}`;
	const cached = _cache.get(cacheKey);
	if (cached instanceof PDFFont) return cached;
	const pdfFont = await pdfDoc.embedFont(await fetchFontData(font, fontName), { subset: font[fontName]?.subset ?? true });
	_cache.set(cacheKey, pdfFont);
	return pdfFont;
};
var registerAcroFormFontResource = (pdfDoc, pdfFont) => {
	const formDict = pdfDoc.getForm().acroForm.dict;
	const context = formDict.context;
	const defaultResourcesKey = PDFName.of("DR");
	const fontResourcesKey = PDFName.of("Font");
	let defaultResources = formDict.lookupMaybe(defaultResourcesKey, PDFDict);
	if (!defaultResources) {
		defaultResources = context.obj({});
		formDict.set(defaultResourcesKey, defaultResources);
	}
	let fontResources = defaultResources.lookupMaybe(fontResourcesKey, PDFDict);
	if (!fontResources) {
		fontResources = context.obj({});
		defaultResources.set(fontResourcesKey, fontResources);
	}
	fontResources.set(PDFName.of(pdfFont.name), pdfFont.ref);
};
var getTextAlignment = (alignment) => {
	switch (alignment) {
		case "center": return TextAlignment.Center;
		case "right": return TextAlignment.Right;
		default: return TextAlignment.Left;
	}
};
var renderAcroText = async (arg) => {
	const { value, pdfDoc, page, options, schema, _cache } = arg;
	const textSchema = schema;
	const font = options.font ?? getDefaultFont();
	const pdfFont = await getPdfFont({
		pdfDoc,
		font,
		fontName: textSchema.fontName && font[textSchema.fontName] ? textSchema.fontName : getFallbackFontName(font),
		_cache
	});
	registerAcroFormFontResource(pdfDoc, pdfFont);
	const { position, width, height, rotate } = convertForPdfLayoutProps({
		schema,
		pageHeight: page.getHeight()
	});
	const textField = pdfDoc.getForm().createTextField(getFieldName(schema, _cache));
	textField.setText(value || void 0);
	textField.setAlignment(getTextAlignment(textSchema.alignment));
	textField.enableMultiline();
	if (textSchema.__acroRequired) textField.enableRequired();
	textField.addToPage(page, {
		x: position.x,
		y: position.y,
		width,
		height,
		rotate,
		font: pdfFont,
		textColor: hex2PrintingColor(textSchema.fontColor || DEFAULT_FONT_COLOR, options.colorType),
		backgroundColor: textSchema.backgroundColor ? hex2PrintingColor(textSchema.backgroundColor, options.colorType) : void 0,
		borderWidth: 0
	});
	textField.setFontSize(textSchema.fontSize ?? DEFAULT_FONT_SIZE);
	textField.updateAppearances(pdfFont);
};
var renderAcroCheckbox = (arg) => {
	const { value, pdfDoc, page, options, schema, _cache } = arg;
	const checkboxSchema = schema;
	const { position, width, height, rotate } = convertForPdfLayoutProps({
		schema,
		pageHeight: page.getHeight()
	});
	const checkBox = pdfDoc.getForm().createCheckBox(getFieldName(schema, _cache));
	if (value === "true") checkBox.check();
	if (checkboxSchema.__acroRequired) checkBox.enableRequired();
	const color = checkboxSchema.color || DEFAULT_FORM_BORDER_COLOR;
	checkBox.addToPage(page, {
		x: position.x,
		y: position.y,
		width,
		height,
		rotate,
		textColor: hex2PrintingColor(color, options.colorType),
		backgroundColor: checkboxSchema.backgroundColor ? hex2PrintingColor(checkboxSchema.backgroundColor, options.colorType) : void 0,
		borderColor: hex2PrintingColor(color, options.colorType),
		borderWidth: 1
	});
	checkBox.updateAppearances();
};
var renderAcroRadioGroup = (arg) => {
	const { value, pdfDoc, page, options, schema, _cache } = arg;
	const radioGroupSchema = schema;
	const { position, width, height, rotate } = convertForPdfLayoutProps({
		schema,
		pageHeight: page.getHeight()
	});
	const radioGroup = getRadioGroup({
		pdfDoc,
		schema: radioGroupSchema,
		_cache
	});
	const color = radioGroupSchema.color || DEFAULT_FORM_BORDER_COLOR;
	const optionName = getRadioOptionName(schema);
	if (radioGroupSchema.__acroRequired) radioGroup.enableRequired();
	radioGroup.addOptionToPage(optionName, page, {
		x: position.x,
		y: position.y,
		width,
		height,
		rotate,
		textColor: hex2PrintingColor(color, options.colorType),
		backgroundColor: radioGroupSchema.backgroundColor ? hex2PrintingColor(radioGroupSchema.backgroundColor, options.colorType) : void 0,
		borderColor: hex2PrintingColor(color, options.colorType),
		borderWidth: 1
	});
	if (value === "true") radioGroup.select(optionName);
	radioGroup.updateAppearances();
};
var acroTextPlugin = {
	pdf: renderAcroText,
	ui: () => {},
	propPanel: {
		schema: {},
		defaultSchema: {
			name: "",
			type: "acroText",
			position: {
				x: 0,
				y: 0
			},
			width: 10,
			height: 10
		}
	}
};
var acroRadioGroupPlugin = {
	pdf: renderAcroRadioGroup,
	ui: () => {},
	propPanel: {
		schema: {},
		defaultSchema: {
			name: "",
			type: "acroRadioGroup",
			position: {
				x: 0,
				y: 0
			},
			width: 8,
			height: 8
		}
	}
};
var acroCheckboxPlugin = {
	pdf: renderAcroCheckbox,
	ui: () => {},
	propPanel: {
		schema: {},
		defaultSchema: {
			name: "",
			type: "acroCheckbox",
			position: {
				x: 0,
				y: 0
			},
			width: 8,
			height: 8
		}
	}
};
//#endregion
//#region src/generateForm.ts
var ACRO_TEXT_TYPE = "acroText";
var ACRO_CHECKBOX_TYPE = "acroCheckbox";
var ACRO_RADIO_GROUP_TYPE = "acroRadioGroup";
var TEXT_TYPE = "text";
var CHECKBOX_TYPE = "checkbox";
var RADIO_GROUP_TYPE = "radioGroup";
var hasPluginForType = (plugins, type) => Object.values(plugins).some((plugin) => plugin.propPanel.defaultSchema.type === type);
var withAcroFormPlugins = (plugins = {}) => {
	const mergedPlugins = { ...plugins };
	if (!hasPluginForType(mergedPlugins, TEXT_TYPE)) mergedPlugins.Text = text;
	if (!hasPluginForType(mergedPlugins, CHECKBOX_TYPE)) mergedPlugins.Checkbox = checkbox;
	if (!hasPluginForType(mergedPlugins, RADIO_GROUP_TYPE)) mergedPlugins.RadioGroup = radioGroup;
	if (!hasPluginForType(mergedPlugins, ACRO_TEXT_TYPE)) mergedPlugins.AcroText = acroTextPlugin;
	if (!hasPluginForType(mergedPlugins, ACRO_CHECKBOX_TYPE)) mergedPlugins.AcroCheckbox = acroCheckboxPlugin;
	if (!hasPluginForType(mergedPlugins, ACRO_RADIO_GROUP_TYPE)) mergedPlugins.AcroRadioGroup = acroRadioGroupPlugin;
	return mergedPlugins;
};
var toAcroFormSchema = (schema, pageIndex) => {
	if (schema.readOnly) return schema;
	const formSchema = schema.required ? {
		...schema,
		required: false
	} : schema;
	if (schema.type === TEXT_TYPE) return {
		...formSchema,
		type: ACRO_TEXT_TYPE,
		__acroRequired: schema.required
	};
	if (schema.type === CHECKBOX_TYPE) return {
		...formSchema,
		type: ACRO_CHECKBOX_TYPE,
		__acroRequired: schema.required
	};
	if (schema.type === RADIO_GROUP_TYPE) return {
		...formSchema,
		type: ACRO_RADIO_GROUP_TYPE,
		__acroPageIndex: pageIndex,
		__acroRequired: schema.required
	};
	return formSchema;
};
var getAcroFormTemplate = (template) => {
	const clonedTemplate = cloneDeep(template);
	clonedTemplate.schemas = clonedTemplate.schemas.map((page, pageIndex) => page.map((schema) => toAcroFormSchema(schema, pageIndex)));
	return clonedTemplate;
};
var normalizeInputs = (inputs) => inputs && inputs.length > 0 ? inputs : [{}];
var generateForm = async (props) => {
	return generate({
		...props,
		inputs: normalizeInputs(props.inputs),
		template: getAcroFormTemplate(props.template),
		plugins: withAcroFormPlugins(props.plugins)
	});
};
//#endregion
export { generate, generateForm };

//# sourceMappingURL=index.js.map