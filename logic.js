const cnv = document.getElementById('cnv');
const width = cnv.width = 800;
const height = cnv.height = 800;
const gl = cnv.getContext('webgl2');

const quad = [
	-1, -1,
	 1, -1,
	 1,  1,
	 1,  1,
	-1,  1,
	-1, -1,
];

const textCoords = [
	0, 0,
	1, 0,
	1, 1,
	1, 1,
	0, 1,
	0, 0,
];

let time = 0;
let currentTime = Date.now();
let interval;
let originalProgram;
let waveProgram;
let renderProgram;
let mx = 0;
let my = 0;

let textureAmp;
let textureAmp1;
let textureVel;
let textureVel1;
let fb;
let fb1;

document.addEventListener('mousemove', mouseMove);

initGL();

function initGL() {
	gl.getExtension('EXT_color_buffer_float');
	gl.getExtension('EXT_float_blend');
	gl.getExtension('OES_texture_float_linear');
	gl.viewport(0, 0, width, height);
	waveProgram = makeWaveProgram(gl);
	originalProgram = makeOriginalProgram(gl);
	renderProgram = makeRenderProgram(gl);

	gl.enable(gl.BLEND);

	gl.useProgram(originalProgram.program);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(originalProgram.positionAttribute);
	gl.vertexAttribPointer(originalProgram.positionAttribute, 2, gl.FLOAT, false, 0, 0);

	const texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textCoords), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(originalProgram.texcoordAttribute);
	gl.vertexAttribPointer(originalProgram.texcoordAttribute, 2, gl.FLOAT, false, 0, 0);

	gl.uniform2f(originalProgram.resolutionUniform, width, height);
	gl.uniform1f(originalProgram.timeUniform, 0);
	gl.uniform2f(originalProgram.mouseUniform, 0, 0);

	textureAmp = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureAmp);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	textureAmp1 = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureAmp1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	textureVel = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureVel);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	textureVel1 = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureVel1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureAmp, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, textureVel, 0);

	fb1 = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureAmp1, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, textureVel1, 0);

	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.useProgram(renderProgram.program);
	gl.uniform2f(renderProgram.resolutionUniform, width, height);
	gl.uniform1i(renderProgram.textureUniform, 0);

	gl.useProgram(waveProgram.program);
	gl.uniform2f(waveProgram.resolutionUniform, width, height);
	gl.uniform1f(waveProgram.timeUniform, 0);
	gl.uniform2f(waveProgram.mouseUniform, 0, 0);
	gl.uniform1i(waveProgram.textureUniform, 0);
	gl.uniform1i(waveProgram.texture1Uniform, 1);

	window.requestAnimationFrame(update);
}

function update() {
	let currentTimeNew = Date.now();
	let deltaTime = currentTimeNew - currentTime;
	time += deltaTime;
	currentTime = currentTimeNew;

	gl.useProgram(waveProgram.program);

	gl.uniform1f(waveProgram.timeUniform, time / 1000.0);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureAmp);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, textureVel);
	gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureAmp1);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, textureVel1);
	gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.useProgram(renderProgram.program);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureVel);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	window.requestAnimationFrame(update);
}

function mouseMove(e) {
	mx = e.clientX / width * 2 - 1;
	my = e.clientY / height * 2 - 1;
}