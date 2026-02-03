// Photo animation with oranges and penguins
const photo = document.querySelector('.photo');
const canvas = document.createElement('canvas');
canvas.id = 'photoCanvas';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.pointerEvents = 'none';
canvas.style.zIndex = '1000';
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });

// Shaders
const vs = `#version 300 es
in vec2 aV; in vec3 aI; in float aA; uniform vec2 uR; out vec2 vU; out float vA;
void main() { vU = aV*.5+.5; vA = aA; vec2 p = aI.xy + aV*aI.z*.5; gl_Position = vec4((p/uR)*2.-1., 0, 1); gl_Position.y *= -1.; }`;
const fs = `#version 300 es
precision mediump float; in vec2 vU; in float vA; uniform sampler2D uT; out vec4 o;
void main() { vec4 c = texture(uT, vU); o = vec4(c.rgb, c.a * vA); }`;

const compile = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
gl.linkProgram(prog);
gl.useProgram(prog);

const uRes = gl.getUniformLocation(prog, 'uR');
const aV = gl.getAttribLocation(prog, 'aV');
const aI = gl.getAttribLocation(prog, 'aI');
const aA = gl.getAttribLocation(prog, 'aA');

// Buffers
const instData = new Float32Array(9000), alphaData = new Float32Array(3000);
const quadBuf = gl.createBuffer(), instBuf = gl.createBuffer(), alphaBuf = gl.createBuffer();

gl.bindVertexArray(gl.createVertexArray());
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(aV);
gl.vertexAttribPointer(aV, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
gl.bufferData(gl.ARRAY_BUFFER, instData, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(aI);
gl.vertexAttribPointer(aI, 3, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(aI, 1);

gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
gl.bufferData(gl.ARRAY_BUFFER, alphaData, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(aA);
gl.vertexAttribPointer(aA, 1, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(aA, 1);

// Create emoji textures
function createEmojiTexture(emoji, size = 64) {
    const emojiCanvas = document.createElement('canvas');
    emojiCanvas.width = size;
    emojiCanvas.height = size;
    const ctx = emojiCanvas.getContext('2d');
    ctx.font = `${size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);
    return emojiCanvas;
}

// Create two textures (orange and penguin)
const orangeTexture = gl.createTexture();
const penguinTexture = gl.createTexture();

function setupTexture(texture, canvas) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

setupTexture(orangeTexture, createEmojiTexture('🍊'));
setupTexture(penguinTexture, createEmojiTexture('🐧'));

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; gl.viewport(0, 0, canvas.width, canvas.height); };
resize();
addEventListener('resize', resize);

// Physics state
const MAX_BODIES = 2000, MAX_PARTICLES = 500;
const bodyX = new Float32Array(MAX_BODIES), bodyY = new Float32Array(MAX_BODIES);
const bodyVX = new Float32Array(MAX_BODIES), bodyVY = new Float32Array(MAX_BODIES);
const bodySize = new Float32Array(MAX_BODIES), bodySpawn = new Float32Array(MAX_BODIES);
const bodyDead = new Uint8Array(MAX_BODIES);
const bodyType = new Uint8Array(MAX_BODIES); // 0 = orange, 1 = penguin
const partX = new Float32Array(MAX_PARTICLES), partY = new Float32Array(MAX_PARTICLES);
const partVX = new Float32Array(MAX_PARTICLES), partVY = new Float32Array(MAX_PARTICLES);
const partLife = new Float32Array(MAX_PARTICLES), partSize = new Float32Array(MAX_PARTICLES);
const partType = new Uint8Array(MAX_PARTICLES);

let bodyCount = 0, partCount = 0, animating = false, sunX, sunY;

function spawnOrbit(e) {
    e.preventDefault();
    const rect = photo.getBoundingClientRect();
    sunX = rect.left + rect.width / 2;
    sunY = rect.top + rect.height / 2;

    if (!animating) { bodyCount = 0; partCount = 0; }
    const now = performance.now(), startIdx = bodyCount;

    for (let i = 0; i < 150 && bodyCount < MAX_BODIES; i++) {
        const idx = bodyCount++;
        const edge = Math.random() * 4 | 0;
        if (edge === 0) { bodyX[idx] = Math.random() * canvas.width; bodyY[idx] = -20; }
        else if (edge === 1) { bodyX[idx] = canvas.width + 20; bodyY[idx] = Math.random() * canvas.height; }
        else if (edge === 2) { bodyX[idx] = Math.random() * canvas.width; bodyY[idx] = canvas.height + 20; }
        else { bodyX[idx] = -20; bodyY[idx] = Math.random() * canvas.height; }

        bodyType[idx] = Math.random() > 0.5 ? 1 : 0; // Random orange or penguin

        const dx = sunX - bodyX[idx], dy = sunY - bodyY[idx];
        const dist = Math.hypot(dx, dy);
        const speed = Math.sqrt(4000000 / dist) * (1.5 + Math.random() * 0.5);
        const inward = 0.6 + Math.random() * 0.3;
        const tangent = Math.sqrt(1 - inward * inward) * (Math.random() > 0.5 ? 1 : -1);

        bodyVX[idx] = (dx / dist * inward - dy / dist * tangent) * speed;
        bodyVY[idx] = (dy / dist * inward + dx / dist * tangent) * speed;
        bodySize[idx] = 28 * (0.7 + Math.random() * 0.6);
        bodySpawn[idx] = now + (idx - startIdx) * 8;
        bodyDead[idx] = 0;
    }

    if (animating) return;
    animating = true;
    let lastTime = now;

    (function simulate() {
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.033);
        lastTime = now;

        for (let i = 0; i < bodyCount; i++) {
            if (bodyDead[i] || now < bodySpawn[i]) continue;
            const dx = sunX - bodyX[i], dy = sunY - bodyY[i];
            const distSq = dx * dx + dy * dy + 400;
            const f = 4000000 / distSq / Math.sqrt(distSq);
            bodyVX[i] = (bodyVX[i] + f * dx * dt) * 0.9995;
            bodyVY[i] = (bodyVY[i] + f * dy * dt) * 0.9995;
            bodyX[i] += bodyVX[i] * dt;
            bodyY[i] += bodyVY[i] * dt;

            if (dx * dx + dy * dy < 2500) {
                bodyDead[i] = 1;
                for (let p = 0; p < 6 && partCount < MAX_PARTICLES; p++) {
                    const pi = partCount++, angle = p / 6 * Math.PI * 2;
                    partX[pi] = bodyX[i]; partY[pi] = bodyY[i];
                    partVX[pi] = Math.cos(angle) * 200;
                    partVY[pi] = Math.sin(angle) * 200;
                    partLife[pi] = 0.4;
                    partSize[pi] = bodySize[i] * 0.4;
                    partType[pi] = bodyType[i];
                }
            }
        }

        for (let i = 0; i < partCount; i++) {
            if (partLife[i] <= 0) continue;
            partX[i] += partVX[i] * dt;
            partY[i] += partVY[i] * dt;
            partLife[i] -= dt;
        }

        // Render oranges
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, orangeTexture);
        let count = 0;
        for (let i = 0; i < bodyCount; i++) {
            if (bodyDead[i] || now < bodySpawn[i] || bodyType[i] !== 0) continue;
            instData[count * 3] = bodyX[i];
            instData[count * 3 + 1] = bodyY[i];
            instData[count * 3 + 2] = bodySize[i];
            alphaData[count++] = 1;
        }
        for (let i = 0; i < partCount; i++) {
            if (partLife[i] <= 0 || partType[i] !== 0) continue;
            instData[count * 3] = partX[i];
            instData[count * 3 + 1] = partY[i];
            instData[count * 3 + 2] = partSize[i];
            alphaData[count++] = partLife[i] * 2.5;
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, instData.subarray(0, count * 3));
        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, alphaData.subarray(0, count));
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

        // Render penguins
        gl.bindTexture(gl.TEXTURE_2D, penguinTexture);
        count = 0;
        for (let i = 0; i < bodyCount; i++) {
            if (bodyDead[i] || now < bodySpawn[i] || bodyType[i] !== 1) continue;
            instData[count * 3] = bodyX[i];
            instData[count * 3 + 1] = bodyY[i];
            instData[count * 3 + 2] = bodySize[i];
            alphaData[count++] = 1;
        }
        for (let i = 0; i < partCount; i++) {
            if (partLife[i] <= 0 || partType[i] !== 1) continue;
            instData[count * 3] = partX[i];
            instData[count * 3 + 1] = partY[i];
            instData[count * 3 + 2] = partSize[i];
            alphaData[count++] = partLife[i] * 2.5;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, instData.subarray(0, count * 3));
        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, alphaData.subarray(0, count));
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

        requestAnimationFrame(simulate);
    })();
}

const updateSun = () => {
    if (!animating) return;
    const rect = photo.getBoundingClientRect();
    sunX = rect.left + rect.width / 2;
    sunY = rect.top + rect.height / 2;
};
addEventListener('resize', updateSun);
addEventListener('scroll', updateSun);

photo.addEventListener('click', spawnOrbit);
photo.addEventListener('touchstart', spawnOrbit, { passive: false });
photo.style.cursor = 'pointer';
