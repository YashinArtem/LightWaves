function makeWaveProgram(gl) {
	const vertexShaderCode =
		`#version 300 es

		in vec2 a_position;
		in vec2 a_texcoord;

		out vec2 v_texcoord;
		
		void main() {
			v_texcoord = a_texcoord;
			gl_Position = vec4(a_position, 0.0, 1.0);
		}
	`;

	const fragmentShaderCode =
		`#version 300 es
		precision highp float;

		uniform float u_time;
		uniform vec2 u_resolution;
		uniform vec2 u_mouse;

		uniform sampler2D u_texture0;
		uniform sampler2D u_texture1;

		in vec2 v_texcoord;

		layout(location = 0) out vec4 outAmp;
		layout(location = 1) out vec4 outVel;

		float box(vec2 p, vec2 b) {
			vec2 d = abs(p) - b;
			return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
		}

		void main() {
			vec2 uv = v_texcoord - 0.5;
			uv.x *= u_resolution.x / u_resolution.y;
			vec3 offset = vec3(vec2(1.0) / u_resolution, 0.0);
			vec3 amp = texture(u_texture0, v_texcoord).rgb;
			vec3 ampUp = texture(u_texture0, v_texcoord + offset.zy).rgb;
			vec3 ampRight = texture(u_texture0, v_texcoord + offset.xz).rgb;
			vec3 ampDown = texture(u_texture0, v_texcoord - offset.zy).rgb;
			vec3 ampLeft = texture(u_texture0, v_texcoord - offset.xz).rgb;
			vec3 vel = texture(u_texture1, v_texcoord).rgb;
			vec3 force = ampUp + ampRight + ampDown + ampLeft;
			vec3 speed = vec3(1.0);
			vec3 colorOffset = vec3(0.02, 0.0, -0.02);
			if(length(uv) < 0.2) speed = vec3(3.0 / 4.0) + colorOffset;
			vel += (force * 0.25 - amp) * speed;
			amp += vel;
			float falloff = 1.0 - clamp(box(v_texcoord - 0.5, vec2(0.4)), 0.0, 1.0);
			amp *= falloff;
			vel *= falloff;
			if(u_time < 2.0) {
				if(box(uv - vec2(-0.4, 0.0), vec2(offset.x, 0.05)) < 0.01) {
					amp += sin(u_time * 30.0) * 12.0;
				}
			}
			outAmp = vec4(amp, 1.0);
			outVel = vec4(vel, 1.0);
		}
	`;
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderCode);
	gl.compileShader(fragmentShader);
	const log = gl.getShaderInfoLog(fragmentShader);
	if(log) console.log(log);

	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	const positionAttribute = gl.getAttribLocation(program, 'a_position');
	const texcoordAttribute = gl.getAttribLocation(program, "a_texcoord");
	const resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
	const mouseUniform = gl.getUniformLocation(program, 'u_mouse');
	const textureUniform = gl.getUniformLocation(program, 'u_texture0');
	const texture1Uniform = gl.getUniformLocation(program, 'u_texture1');
	const timeUniform = gl.getUniformLocation(program, 'u_time');
	return {program, positionAttribute, texcoordAttribute, resolutionUniform, mouseUniform, textureUniform, texture1Uniform, timeUniform};
}