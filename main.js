var cvs, gl;

window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

$(document).ready(function() {
	cvs = $('#cvs')[0];
	gl = cvs.getContext('experimental-webgl');
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	console.log(gl);

	$('#mona-lisa').bind('load', function() {
		loadTexture();

		var verts = new Float32Array([0,0,2,0,0,2,2,0,2,2,0,2]);
		var vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
		gl.viewport(0, 0, 240, 320);

		compileShaders();

		$('#button-up'  ).click(function() { animate(-1) });
		$('#button-down').click(function() { animate( 1) });

		render(0);
	})
});

function loadTexture() {
	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.activeTexture(gl.TEXTURE0);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, $('#mona-lisa')[0]);
}

function escape(text) {
	return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
}

function cleanError(error) {
	var msg = '';
	error = error.split('\n');
	for(var i in error) {
		var sub = error[i];
		var match = sub.match(/^(.*?): (.*?):(.*?): (.*)$/);
		if(match == null)
			continue;
		if(match[1] == 'ERROR')
			msg += '<font color="red">ERROR:</font>';
		else
			msg += '<font color="yellow">' + escape(match[1]) + ':</font>';
		msg += ' Line ' + (15 + ~~match[3]) + ': ';
		msg += escape(match[4]);
		msg += '<br>';
	}
	return msg;
}

function compileShaders() {
	vertex_shader = $('#vertex_shader').html();
	fragment_shader = $('#fragment_shader').html();
	var prog = gl.createProgram();
	var vs = gl.createShader(gl.VERTEX_SHADER), fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(vs, vertex_shader);
	gl.compileShader(vs);
	gl.attachShader(prog, vs);
	gl.shaderSource(fs, fragment_shader);
	gl.compileShader(fs);
	if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
		var error = gl.getShaderInfoLog(fs);
		$('body').html(cleanError(error));
		return false;
	}
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.log('Link failed: ' + gl.getProgramInfoLog(prog));
		alert('link fail');
		return false;
	}
	gl.useProgram(prog);
	gl.prog = prog;
	var pos = gl.getAttribLocation(prog, 'pos');
	gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(pos);
	gl.scroll = gl.getUniformLocation(prog, 'scroll');
	var res = gl.getUniformLocation(prog, 'resolution');
	gl.uniform2f(res, 240, 320);
	var sampler = gl.getUniformLocation(prog, 'sampler');
	gl.uniform1i(sampler, 0);
}

function render(scroll) {
	gl.uniform1f(gl.scroll, scroll);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

var animSeconds = 1;

function animate(direction) {
	function subAnimate() {
		var step = (new Date() - animStart) / 1000 / animSeconds;

		if(step > animSeconds * 2)
			return render(0);
		else if(step > animSeconds)
			step = animSeconds * 2 - step;

		render(step * (320 / animSeconds) * direction);

		requestAnimationFrame(subAnimate, cvs);
	}

	var animStart = new Date();
	requestAnimationFrame(subAnimate, cvs);
}
