var cvs, gl;

window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

function rehash() {
	var effect = $('input[name=effect]:checked').data('effect');
	window.location.hash = '#' + effect + '&' + $('#ramp').val() + '&' + $('#easing').val();
}

$(document).ready(function() {
	cvs = $('#cvs')[0];
	gl = cvs.getContext('experimental-webgl');
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	$('input[name=effect]').change(function() {
		var effect = $(this).data('effect');
		rehash();
		compileShaders(effect);
	});

	$('#position').change(rerender);
	$('#position').mouseup(function() {
		if($('#autoreturn').is(':checked'))
			animateTo(0, true);
	});
	$('#autoreturn').change(function() {
		if($('#autoreturn').is(':checked'))
			animateTo(0, true);
	});
	$('#fake-reverse').change(rerender);
	$('#ramp').change(function() {
		rehash();
		$('#ramp-val').text($(this).val());
		rerender();

	});
	$('#easing').change(function() {
		rehash();
		$('#easing-val').text($(this).val());
		rerender();
	});
	$('#zero').click(function() {
		animateTo(0, true)
	});

	$('#mona-lisa').bind('load', function() {
		loadTexture();

		var verts = new Float32Array([0,0,2,0,0,2,2,0,2,2,0,2]);
		var vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
		gl.viewport(0, 0, 240, 320);

		if(window.location.hash.length < 2)
			compileShaders('normal');
		else {
			var hash = window.location.hash.substring(1).split('&');
			var effect = hash[0], ramp = ~~hash[1], easing = ~~hash[2];
			compileShaders(effect);
			$('input[name=effect][data-effect=' + effect + ']').attr('checked', true);
			$('#ramp').val(ramp); $('#ramp-val').text(ramp);
			$('#easing').val(easing); $('#easing-val').text(easing);
		}

		$('#button-up'  ).click(function() { animate(-1) });
		$('#button-down').click(function() { animate( 1) });

		$('#button-drop-up').click(function() { setPosition(-320); animateTo(0, true) });
		$('#button-drop-down').click(function() { setPosition(320); animateTo(0, true) });

		render(0);
	})
});

function rerender() {
	render(~~$('#position').val(), 0, $('#fake-reverse').is(':checked')) // XXX: completion should be factor of distance from zero
}

function setPosition(scroll) {
	$('#position').val(scroll);
	$('#position-val').text(~~scroll);
}

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
		msg += ' Line ' + (16 + ~~match[3]) + ': ';
		msg += escape(match[4]);
		msg += '<br>';
	}
	return msg;
}

function compileShaders(effect) {
	vertex_shader = $('#vertex_shader').html();
	fragment_shader = $('#fragment_shader').html();
	fragment_shader = fragment_shader.replace('%effect%', effect);
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
	gl.scroll = gl.getUniformLocation(prog, '_scroll');
	gl.reversing = gl.getUniformLocation(prog, 'reversing');
	gl.completion = gl.getUniformLocation(prog, 'completion');
	gl.ramp = gl.getUniformLocation(prog, 'ramp');
	gl.easing = gl.getUniformLocation(prog, 'easing');
	var res = gl.getUniformLocation(prog, 'resolution');
	gl.uniform2f(res, 240, 320);
	var sampler = gl.getUniformLocation(prog, 'sampler');
	gl.uniform1i(sampler, 0);
}

function render(scroll, completion, reversing) {
	setPosition(scroll);
	gl.uniform1f(gl.scroll, scroll);
	gl.uniform1f(gl.reversing, reversing ? 1 : 0);
	gl.uniform1f(gl.completion, completion);
	gl.uniform1f(gl.ramp, $('#ramp').val() / 100);
	gl.uniform1f(gl.easing, $('#easing').val());
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

var animSeconds = 1;

function animate(direction) {
	function subAnimate() {
		var step = (new Date() - animStart) / 1000 / animSeconds;
		var reversing = false;

		if(step > animSeconds * 2)
			return render(0, 0, false);
		else if(step > animSeconds) {
			step = animSeconds * 2 - step;
			reversing = true;
		}

		var value = step * (320 / animSeconds) * direction;
		render(value, step, reversing);

		requestAnimationFrame(subAnimate, cvs);
	}

	var animStart = new Date();
	requestAnimationFrame(subAnimate, cvs);
}

function animateTo(value, reversing) {
	var start = ~~$('#position').val();
	if(start == 0)
		return;
	var duration = animSeconds * (Math.abs(start) / 320);
	function subAnimate() {
		var step = (new Date() - animStart) / 1000 / duration;

		if(step > duration)
			return render(0, 0, false);

		var value = start - step * (start / duration);
		render(value, step, reversing);

		requestAnimationFrame(subAnimate, cvs);
	}

	var animStart = new Date();
	requestAnimationFrame(subAnimate, cvs);
}
