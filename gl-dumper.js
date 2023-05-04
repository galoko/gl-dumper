"use strict";
// ==UserScript==
// @name         Figma dumper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.figma.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
(function () {
    "use strict";
    let isInsideFrame = false;
    const constants = new Map();
    const bits = new Map();
    const variables = new Map();
    const methods = new Map();
    function mapToGLConst(value, methodKey, argNum) {
        const type = methods.get(methodKey)[argNum];
        if (type) {
            if (type === "GLenum") {
                const constantName = constants.get(value);
                if (constantName !== undefined) {
                    return constantName;
                }
            }
            else if (type === "GLbitfield" && typeof value === "number") {
                let r = value;
                const includedBits = [];
                for (const [bit, bitName] of bits) {
                    if ((r & bit) !== 0) {
                        includedBits.push(bitName);
                        r = r & ~bit;
                    }
                }
                if (r !== 0) {
                    return undefined;
                }
                return includedBits.join(" | ");
            }
        }
        return undefined;
    }
    const variablePrefixes = new Map([
        [WebGLRenderingContext, "gl"],
        [WebGLTexture, "tex"],
        [WebGLProgram, "program"],
        [WebGLFramebuffer, "framebufer"],
        [WebGLUniformLocation, "loc"],
        [WebGLBuffer, "buffer"],
        [WebGLShader, "shader"],
        [WebGLRenderbuffer, "renderBuffer"],
        [WebGLActiveInfo, "activeInfo"],
    ]);
    const variableCounters = new Map();
    function registerContextMethod(methodName, ...argumentTypes) {
        const key = `${methodName}_${argumentTypes.length}`;
        if (methods.has(key)) {
            throw "method duplicate " + key;
        }
        methods.set(key, argumentTypes);
    }
    function registerContextMethods() {
        registerContextMethod("activeTexture", "GLenum");
        registerContextMethod("attachShader", "WebGLProgram", "WebGLShader");
        registerContextMethod("bindAttribLocation", "WebGLProgram", "GLuint", "string");
        registerContextMethod("bindBuffer", "GLenum", "WebGLBuffer");
        registerContextMethod("bindFramebuffer", "GLenum", "WebGLFramebuffer");
        registerContextMethod("bindRenderbuffer", "GLenum", "WebGLRenderbuffer");
        registerContextMethod("bindTexture", "GLenum", "WebGLTexture");
        registerContextMethod("blendColor", "GLclampf", "GLclampf", "GLclampf", "GLclampf");
        registerContextMethod("blendEquation", "GLenum");
        registerContextMethod("blendEquationSeparate", "GLenum", "GLenum");
        registerContextMethod("blendFunc", "GLenum", "GLenum");
        registerContextMethod("blendFuncSeparate", "GLenum", "GLenum", "GLenum", "GLenum");
        registerContextMethod("checkFramebufferStatus", "GLenum");
        registerContextMethod("clear", "GLbitfield");
        registerContextMethod("clearColor", "GLclampf", "GLclampf", "GLclampf", "GLclampf");
        registerContextMethod("clearDepth", "GLclampf");
        registerContextMethod("clearStencil", "GLint");
        registerContextMethod("colorMask", "GLboolean", "GLboolean", "GLboolean", "GLboolean");
        registerContextMethod("compileShader", "WebGLShader");
        registerContextMethod("copyTexImage2D", "GLenum", "GLint", "GLenum", "GLint", "GLint", "GLsizei", "GLsizei", "GLint");
        registerContextMethod("copyTexSubImage2D", "GLenum", "GLint", "GLint", "GLint", "GLint", "GLint", "GLsizei", "GLsizei");
        registerContextMethod("createBuffer");
        registerContextMethod("createFramebuffer");
        registerContextMethod("createProgram");
        registerContextMethod("createRenderbuffer");
        registerContextMethod("createShader", "GLenum");
        registerContextMethod("createTexture");
        registerContextMethod("cullFace", "GLenum");
        registerContextMethod("deleteBuffer", "WebGLBuffer");
        registerContextMethod("deleteFramebuffer", "WebGLFramebuffer");
        registerContextMethod("deleteProgram", "WebGLProgram");
        registerContextMethod("deleteRenderbuffer", "WebGLRenderbuffer");
        registerContextMethod("deleteShader", "WebGLShader");
        registerContextMethod("deleteTexture", "WebGLTexture");
        registerContextMethod("depthFunc", "GLenum");
        registerContextMethod("depthMask", "GLboolean");
        registerContextMethod("depthRange", "GLclampf", "GLclampf");
        registerContextMethod("detachShader", "WebGLProgram", "WebGLShader");
        registerContextMethod("disable", "GLenum");
        registerContextMethod("disableVertexAttribArray", "GLuint");
        registerContextMethod("drawArrays", "GLenum", "GLint", "GLsizei");
        registerContextMethod("drawElements", "GLenum", "GLsizei", "GLenum", "GLintptr");
        registerContextMethod("enable", "GLenum");
        registerContextMethod("enableVertexAttribArray", "GLuint");
        registerContextMethod("finish");
        registerContextMethod("flush");
        registerContextMethod("framebufferRenderbuffer", "GLenum", "GLenum", "GLenum", "WebGLRenderbuffer");
        registerContextMethod("framebufferTexture2D", "GLenum", "GLenum", "GLenum", "WebGLTexture", "GLint");
        registerContextMethod("frontFace", "GLenum");
        registerContextMethod("generateMipmap", "GLenum");
        registerContextMethod("getActiveAttrib", "WebGLProgram", "GLuint");
        registerContextMethod("getActiveUniform", "WebGLProgram", "GLuint");
        registerContextMethod("getAttachedShaders", "WebGLProgram");
        registerContextMethod("getAttribLocation", "WebGLProgram", "string");
        registerContextMethod("getBufferParameter", "GLenum", "GLenum");
        registerContextMethod("getContextAttributes");
        registerContextMethod("getError");
        registerContextMethod("getExtension", "string");
        registerContextMethod("getFramebufferAttachmentParameter", "GLenum", "GLenum", "GLenum");
        registerContextMethod("getParameter", "GLenum");
        registerContextMethod("getProgramInfoLog", "WebGLProgram");
        registerContextMethod("getProgramParameter", "WebGLProgram", "GLenum");
        registerContextMethod("getRenderbufferParameter", "GLenum", "GLenum");
        registerContextMethod("getShaderInfoLog", "WebGLShader");
        registerContextMethod("getShaderParameter", "WebGLShader", "GLenum");
        registerContextMethod("getShaderPrecisionFormat", "GLenum", "GLenum");
        registerContextMethod("getShaderSource", "WebGLShader");
        registerContextMethod("getSupportedExtensions");
        registerContextMethod("getTexParameter", "GLenum", "GLenum");
        registerContextMethod("getUniform", "WebGLProgram", "WebGLUniformLocation");
        registerContextMethod("getUniformLocation", "WebGLProgram", "string");
        registerContextMethod("getVertexAttrib", "GLuint", "GLenum");
        registerContextMethod("getVertexAttribOffset", "GLuint", "GLenum");
        registerContextMethod("hint", "GLenum", "GLenum");
        registerContextMethod("isBuffer", "WebGLBuffer");
        registerContextMethod("isContextLost");
        registerContextMethod("isEnabled", "GLenum");
        registerContextMethod("isFramebuffer", "WebGLFramebuffer");
        registerContextMethod("isProgram", "WebGLProgram");
        registerContextMethod("isRenderbuffer", "WebGLRenderbuffer");
        registerContextMethod("isShader", "WebGLShader");
        registerContextMethod("isTexture", "WebGLTexture");
        registerContextMethod("lineWidth", "GLfloat");
        registerContextMethod("linkProgram", "WebGLProgram");
        registerContextMethod("pixelStorei", "GLenum", "GLint");
        registerContextMethod("polygonOffset", "GLfloat", "GLfloat");
        registerContextMethod("renderbufferStorage", "GLenum", "GLenum", "GLsizei", "GLsizei");
        registerContextMethod("sampleCoverage", "GLclampf", "GLboolean");
        registerContextMethod("scissor", "GLint", "GLint", "GLsizei", "GLsizei");
        registerContextMethod("shaderSource", "WebGLShader", "string");
        registerContextMethod("stencilFunc", "GLenum", "GLint", "GLuint");
        registerContextMethod("stencilFuncSeparate", "GLenum", "GLenum", "GLint", "GLuint");
        registerContextMethod("stencilMask", "GLuint");
        registerContextMethod("stencilMaskSeparate", "GLenum", "GLuint");
        registerContextMethod("stencilOp", "GLenum", "GLenum", "GLenum");
        registerContextMethod("stencilOpSeparate", "GLenum", "GLenum", "GLenum", "GLenum");
        registerContextMethod("texParameterf", "GLenum", "GLenum", "GLfloat");
        registerContextMethod("texParameteri", "GLenum", "GLenum", "GLint");
        registerContextMethod("uniform1f", "WebGLUniformLocation", "GLfloat");
        registerContextMethod("uniform1i", "WebGLUniformLocation", "GLint");
        registerContextMethod("uniform2f", "WebGLUniformLocation", "GLfloat", "GLfloat");
        registerContextMethod("uniform2i", "WebGLUniformLocation", "GLint", "GLint");
        registerContextMethod("uniform3f", "WebGLUniformLocation", "GLfloat", "GLfloat", "GLfloat");
        registerContextMethod("uniform3i", "WebGLUniformLocation", "GLint", "GLint", "GLint");
        registerContextMethod("uniform4f", "WebGLUniformLocation", "GLfloat", "GLfloat", "GLfloat", "GLfloat");
        registerContextMethod("uniform4i", "WebGLUniformLocation", "GLint", "GLint", "GLint", "GLint");
        registerContextMethod("useProgram", "WebGLProgram");
        registerContextMethod("validateProgram", "WebGLProgram");
        registerContextMethod("vertexAttrib1f", "GLuint", "GLfloat");
        registerContextMethod("vertexAttrib1fv", "GLuint", "Float32List");
        registerContextMethod("vertexAttrib2f", "GLuint", "GLfloat", "GLfloat");
        registerContextMethod("vertexAttrib2fv", "GLuint", "Float32List");
        registerContextMethod("vertexAttrib3f", "GLuint", "GLfloat", "GLfloat", "GLfloat");
        registerContextMethod("vertexAttrib3fv", "GLuint", "Float32List");
        registerContextMethod("vertexAttrib4f", "GLuint", "GLfloat", "GLfloat", "GLfloat", "GLfloat");
        registerContextMethod("vertexAttrib4fv", "GLuint", "Float32List");
        registerContextMethod("vertexAttribPointer", "GLuint", "GLint", "GLenum", "GLboolean", "GLsizei", "GLintptr");
        registerContextMethod("viewport", "GLint", "GLint", "GLsizei", "GLsizei");
        registerContextMethod("bufferData", "GLenum", "GLsizeiptr", "GLenum");
        registerContextMethod("bufferSubData", "GLenum", "GLintptr", "BufferSource");
        registerContextMethod("compressedTexImage2D", "GLenum", "GLint", "GLenum", "GLsizei", "GLsizei", "GLint", "ArrayBufferView");
        registerContextMethod("compressedTexSubImage2D", "GLenum", "GLint", "GLint", "GLint", "GLsizei", "GLsizei", "GLenum", "ArrayBufferView");
        registerContextMethod("readPixels", "GLint", "GLint", "GLsizei", "GLsizei", "GLenum", "GLenum", "ArrayBufferView");
        registerContextMethod("texImage2D", "GLenum", "GLint", "GLint", "GLsizei", "GLsizei", "GLint", "GLenum", "GLenum", "ArrayBufferView");
        registerContextMethod("texImage2D", "GLenum", "GLint", "GLint", "GLenum", "GLenum", "TexImageSource");
        registerContextMethod("texSubImage2D", "GLenum", "GLint", "GLint", "GLint", "GLsizei", "GLsizei", "GLenum", "GLenum", "ArrayBufferView");
        registerContextMethod("texSubImage2D", "GLenum", "GLint", "GLint", "GLint", "GLenum", "GLenum", "TexImageSource");
        registerContextMethod("uniform1fv", "WebGLUniformLocation", "Float32List");
        registerContextMethod("uniform1iv", "WebGLUniformLocation", "Int32List");
        registerContextMethod("uniform2fv", "WebGLUniformLocation", "Float32List");
        registerContextMethod("uniform2iv", "WebGLUniformLocation", "Int32List");
        registerContextMethod("uniform3fv", "WebGLUniformLocation", "Float32List");
        registerContextMethod("uniform3iv", "WebGLUniformLocation", "Int32List");
        registerContextMethod("uniform4fv", "WebGLUniformLocation", "Float32List");
        registerContextMethod("uniform4iv", "WebGLUniformLocation", "Int32List");
        registerContextMethod("uniformMatrix2fv", "WebGLUniformLocation", "GLboolean", "Float32List");
        registerContextMethod("uniformMatrix3fv", "WebGLUniformLocation", "GLboolean", "Float32List");
        registerContextMethod("uniformMatrix4fv", "WebGLUniformLocation", "GLboolean", "Float32List");
    }
    registerContextMethods();
    const codeBlocks = [[]];
    let activeCodeBlock = codeBlocks[0];
    function createVariable(prefix, arg) {
        const id = variableCounters.get(prefix) ?? 1;
        variableCounters.set(prefix, id + 1);
        const v = {
            name: `${prefix}_${id}`,
            value: arg,
            codeToCreate: [],
        };
        variables.set(arg, v);
        activeCodeBlock.push(v);
        return v;
    }
    function convertArgumentToString(arg, methodKey, argNum, alwaysCreateVariable = false) {
        if (ArrayBuffer.isView(arg)) {
            // @ts-ignore
            arg = arg.slice();
        }
        const v = alwaysCreateVariable ? undefined : variables.get(arg);
        if (v) {
            return v;
        }
        if (typeof arg === "undefined") {
            return "undefined";
        }
        if (typeof arg === "object") {
            if (arg === null) {
                return "null";
            }
            let prefix;
            if (ArrayBuffer.isView(arg)) {
                prefix = "data";
            }
            else {
                prefix = variablePrefixes.get(arg.constructor);
                if (prefix === undefined) {
                    if (methodKey.startsWith("getExtension_")) {
                        prefix = "ext";
                    }
                    else {
                        prefix = "unknown";
                    }
                }
            }
            return createVariable(prefix, arg);
        }
        else if (typeof arg === "number") {
            return mapToGLConst(arg, methodKey, argNum) ?? arg + "";
        }
        else if (typeof arg === "string") {
            return mapToGLConst(arg, methodKey, argNum) ?? `\`${arg.replaceAll('"', '\\"')}\``;
        }
        else if (typeof arg === "function") {
            console.error("DUMPER: function as argument is not supported");
        }
        else if (typeof arg === "boolean") {
            return arg + "";
        }
        debugger;
        return "unknown";
    }
    function getString(v) {
        if (typeof v === "string") {
            return v;
        }
        return v.name;
    }
    function isVariable(v) {
        return typeof v !== "string";
    }
    function hook(proto, name) {
        const keys = Object.keys(proto);
        for (const key of keys) {
            let value;
            try {
                value = proto[key];
            }
            catch (e) {
                console.warn(`${key} property is ignored`);
                continue; // ignore properties for now
            }
            try {
                if (typeof value === "function") {
                    proto[key] = function () {
                        const res = value.apply(this, arguments);
                        activeCodeBlock = codeBlocks[codeBlocks.length - 1];
                        convertCallToCode(res, this, key, arguments);
                        return res;
                    };
                    continue;
                }
                else {
                    if (typeof value === "number" || typeof value === "string") {
                        const fullKey = `${name}.${key}`;
                        if (key.endsWith("_BIT") && typeof value === "number") {
                            bits.set(value, fullKey);
                            continue;
                        }
                        else {
                            constants.set(value, fullKey);
                            continue;
                        }
                    }
                }
            }
            catch (e) { }
            console.warn(`${key} property is ignored`);
        }
    }
    function convertCallToCode(res, context, methodName, args) {
        const methodKey = `${methodName}_${args.length}`;
        const contextStr = getString(convertArgumentToString(context, methodKey, -1));
        const argStrs = [];
        let argNum = 0;
        for (const arg of args) {
            argStrs.push(getString(convertArgumentToString(arg, methodKey, argNum)));
            argNum++;
        }
        const resStr = convertArgumentToString(res, methodKey, -2, true);
        const code = `${contextStr}.${methodName}(${argStrs.join(", ")})`;
        if (isVariable(resStr)) {
            resStr.codeToCreate.push(`${resStr.name} = ${code}`);
            if (methodName === "getExtension" && typeof res === "object") {
                hook(res.__proto__, resStr.name);
            }
        }
        else {
            activeCodeBlock.push(code);
        }
    }
    function downloadURI(uri, name) {
        const link = document.createElement("a");
        link.setAttribute("download", name);
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
    function main() {
        // hook WebGL
        hook(WebGLRenderingContext.prototype, "gl");
        // hook RAF
        const oldRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function (callback) {
            const res = oldRAF.call(this, function () {
                isInsideFrame = true;
                codeBlocks.push([]);
                // @ts-ignore
                const res = callback.apply(this, arguments);
                isInsideFrame = false;
                codeBlocks.push([]);
                return res;
            });
            return res;
        };
        // @ts-ignore
        window.dump = () => {
            let output = "";
            for (const v of variables.values()) {
                if (v.codeToCreate.length < 1) {
                    if (ArrayBuffer.isView(v.value)) {
                        const array = v.value;
                        const arrayData = JSON.stringify(Array.from(array));
                        const createArrayCode = `${v.name} = new ${array.constructor.name}(${arrayData})`;
                        v.codeToCreate.push(createArrayCode);
                    }
                    else if (v.value instanceof WebGLRenderingContext) {
                        const canvas = v.value.canvas;
                        const canvasStyle = getComputedStyle(canvas);
                        const canvasVar = `${v.name}_canvas`;
                        v.codeToCreate.push(`const ${canvasVar} = document.createElement('canvas')`);
                        v.codeToCreate.push(`${canvasVar}.width = ${canvas.width}`);
                        v.codeToCreate.push(`${canvasVar}.height = ${canvas.height}`);
                        v.codeToCreate.push(`${canvasVar}.style.width = "${canvasStyle.width}"`);
                        v.codeToCreate.push(`${canvasVar}.style.height = "${canvasStyle.height}"`);
                        v.codeToCreate.push(`${v.name} = ${canvasVar}.getContext('webgl')`);
                        v.codeToCreate.push(`document.body.appendChild(${canvasVar})`);
                    }
                    else {
                        debugger;
                    }
                }
            }
            output += "<html>\n";
            output += "    <body>\n";
            output += "    </body>\n";
            output += "    <script>\n";
            const TAB = "        ";
            output += `${TAB}const gl = WebGLRenderingContext.prototype\n\n`;
            // define all variables
            output += `${TAB}// definitions\n\n`;
            for (const codeBlock of codeBlocks) {
                for (const v of codeBlock) {
                    if (typeof v !== "string") {
                        output += `${TAB}let ${v.name}\n`;
                    }
                }
            }
            output += "\n";
            function writeCodeBlock(codeBlock) {
                const TAB = "            ";
                if (codeBlock.length < 1) {
                    return;
                }
                for (const entry of codeBlock) {
                    const code = typeof entry === "string" ? entry : entry.codeToCreate.join(`\n${TAB}`);
                    if (!code) {
                        debugger;
                    }
                    output += `${TAB}${code}\n`;
                }
            }
            let frameNum = 1;
            for (let i = 0; i < codeBlocks.length; i++) {
                const codeBlock = codeBlocks[i];
                if (codeBlock.length < 1) {
                    continue;
                }
                output += `${TAB}function frame_${frameNum}() {\n`;
                writeCodeBlock(codeBlock);
                output += `${TAB}}\n\n`;
                frameNum++;
            }
            for (let i = 1; i < frameNum; i++) {
                output += `${TAB}frame_${i}()\n`;
            }
            output += "    </script>\n";
            output += "</html>";
            downloadURI(`data:text/html;charset=UTF-8,${encodeURIComponent(output)}`, "figma.html");
        };
    }
    main();
})();
//# sourceMappingURL=gl-dumper.js.map