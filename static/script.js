import { ACanvas } from '/static/ACanvas.js';
import { CompositeCanvas } from '/static/CompositeCanvas.js';

// ===============================
// CANVAS SETUP
// ===============================
const canvas1 = new ACanvas("canvas1");
const canvas2 = new CompositeCanvas("canvas2");

// ===============================
// INPUT ELEMENTS
// ===============================
const a00 = document.getElementById("a00");
const a01 = document.getElementById("a01");
const a10 = document.getElementById("a10");
const a11 = document.getElementById("a11");
const x0  = document.getElementById("x0");
const x1  = document.getElementById("x1");

// ===============================
// MATRIX / VECTOR FROM INPUTS
// ===============================
function matrixFromInputs() {
    return [
        [+a00.value, +a01.value],
        [+a10.value, +a11.value]
    ];
}

function vectorFromInputs() {
    return [+x0.value, +x1.value];
}

// Initial canvas data
canvas1.setMatrix(matrixFromInputs());
canvas2.setMatrix(matrixFromInputs());
canvas1.setVector(vectorFromInputs());
canvas2.setVector(vectorFromInputs());

// ===============================
// UPDATE CANVASES
// ===============================
async function updateCanvases() {
    canvas1.setMatrix(matrixFromInputs());
    canvas2.setMatrix(matrixFromInputs());
    canvas1.setVector(vectorFromInputs());
    canvas2.setVector(vectorFromInputs());

    // Await values first, then transformation sequence
    await canvas1.updateValues();
    await canvas1.updateTransformationMatrixSequence();
    await canvas2.updateValues();
    await canvas2.updateTransformationMatrixSequence();

    // Reset transformation sequences
    [canvas1, canvas2].forEach(canvas =>
        canvas.transformationSequences.forEach(seq => {
            //seq.t = 0;
            seq.t = canvas.paused ? 1 : 0;
            seq.freezeFrames = 0;
            seq.finished = false;
        })
    );
    updateStaticUI();
    await updateCanvas1DynamicUI();
    await updateCanvas2DynamicUI();
    syncCanvas1Buttons();
    syncCanvas2Buttons();
}

let updateTimeout;
[a00,a01,a10,a11,x0,x1].forEach(input => input.addEventListener('input', () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateCanvases, 500);
}));

// ===============================
// DISPLAY FUNCTIONS
// ===============================
const canvas2VectorText = document.getElementById('canvas2-vector-text');
const canvas1MatrixVectorText = document.getElementById('canvas1-matrixvector-text');
const matrixP  = document.getElementById('canvas2-matrixP');
const matrixD  = document.getElementById('canvas2-matrixD');
const matrixP1 = document.getElementById('canvas2-matrixP1');
const eigenvaluesText = document.getElementById('eigenvalues-text');
const eigenvectorsText = document.getElementById('eigenvectors-text');

function renderMatrix(matrix) {
    return `
        <div class="matrix-wrapper">
            <table class="matrix-table">
                <tr><td>${matrix[0][0].toFixed(2)}</td><td>${matrix[0][1].toFixed(2)}</td></tr>
                <tr><td>${matrix[1][0].toFixed(2)}</td><td>${matrix[1][1].toFixed(2)}</td></tr>
            </table>
        </div>
    `;
}

function updateCanvas1StaticUI() {
    canvas1MatrixVectorText.innerHTML = `
        ${renderMatrix(matrixFromInputs())}
        <div class="matrix-wrapper">
            <table class="vector-table">
                <tr><td>${x0.value}</td></tr>
                <tr><td>${x1.value}</td></tr>
            </table>
        </div>
    `;
}

function updateCanvas2StaticUI() {
    // Keep it simple, just overwrite innerHTML like matrix1
    canvas2VectorText.innerHTML = `
        <div class="vector-wrapper">
            <table class="vector-table">
                <tr><td>${x0.value}</td></tr>
                <tr><td>${x1.value}</td></tr>
            </table>
        </div>
    `;
}

function updateStaticUI(){
    updateCanvas1StaticUI();
    updateCanvas2StaticUI();
}

async function updateCanvas1DynamicUI() {
    const { eigenvectors, eigenvalues } = canvas1.getValues();
    eigenvaluesText.textContent = eigenvalues.map(v => v.toFixed(2)).join(', ');
    eigenvectorsText.innerHTML = `
        <div class="eigenvector-columns">
            ${eigenvectors.map(v => `
                <div class="eigenvector-column">
                    <div>${v[0].toFixed(2)}</div>
                    <div>${v[1].toFixed(2)}</div>
                </div>
            `).join('')}
        </div>
    `;
}
async function updateCanvas2DynamicUI() {
    const { P, D, P1 } = canvas2.getValues();
    matrixP.innerHTML = renderMatrix(P);
    matrixD.innerHTML = renderMatrix(D);
    matrixP1.innerHTML = renderMatrix(P1);
}


// ===============================
// CANVAS1 BUTTONS
// ===============================
const btnCanvas1Static = document.getElementById("btnCanvas1Static");
const btnCanvas1Dynamic = document.getElementById("btnCanvas1Dynamic");
const btnA = document.getElementById('btnA');
const btnAActive = document.getElementById('btnA-active');
const btnAPassive = document.getElementById('btnA-passive');

let modeA = 'a';

function syncCanvas1Buttons() {
    btnA.textContent = canvas1.applyA ? 'A applied' : 'Apply A';
    btnA.classList.toggle('active', canvas1.applyA);
    btnAActive.classList.toggle('active', canvas1.applyA && modeA === 'a');
    btnAPassive.classList.toggle('active', canvas1.applyA && modeA === 'p');
    btnCanvas1Static.classList.toggle('active', canvas1.paused);
    btnCanvas1Dynamic.classList.toggle('active', !canvas1.paused);
}

function queueCanvasUpdate() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateCanvases, 500);
}

btnCanvas1Static.addEventListener("click", () => {
    canvas1.static();
    syncCanvas1Buttons();
});
btnCanvas1Dynamic.addEventListener("click", () => {
    canvas1.dynamic();
    syncCanvas1Buttons();
});
btnA.addEventListener('click', () => {
    canvas1.applyA = !canvas1.applyA;
    queueCanvasUpdate();
    syncCanvas1Buttons();
});

btnAPassive.addEventListener('click', () => {
    canvas1.setAPassive();
    modeA = 'p';
    queueCanvasUpdate();
    syncCanvas1Buttons();
});

btnAActive.addEventListener('click', () => {
    canvas1.setAActive();
    modeA = 'a';
    queueCanvasUpdate();
    syncCanvas1Buttons();
});
// ===============================
// CANVAS2 BUTTONS
// ===============================
const btnCanvas2Static = document.getElementById("btnCanvas2Static");
const btnCanvas2Dynamic = document.getElementById("btnCanvas2Dynamic");
const btnP = document.getElementById('btnP');
const btnD = document.getElementById('btnD');
const btnP1 = document.getElementById('btnP1');
const btnPActive = document.getElementById('btnP-active');
const btnPPassive = document.getElementById('btnP-passive');
const btnDActive = document.getElementById('btnD-active');
const btnDPassive = document.getElementById('btnD-passive');
const btnP1Active = document.getElementById('btnP1-active');
const btnP1Passive = document.getElementById('btnP1-passive');

let modeP = 'a';
let modeD = 'a';
let modeP1 = 'a';

function syncCanvas2Buttons() {
    btnP.textContent = canvas2.applyP ? 'P applied' : 'Apply P';
    btnD.textContent = canvas2.applyD ? 'D applied' : 'Apply D';
    btnP1.textContent = canvas2.applyP1 ? 'P⁻¹ applied' : 'Apply P⁻¹';

    btnP.classList.toggle('active', canvas2.applyP);
    btnD.classList.toggle('active', canvas2.applyD);
    btnP1.classList.toggle('active', canvas2.applyP1);

    matrixP.style.display = canvas2.applyP ? 'block' : 'none';
    matrixD.style.display = canvas2.applyD ? 'block' : 'none';
    matrixP1.style.display = canvas2.applyP1 ? 'block' : 'none';

    btnPActive.classList.toggle('active', canvas2.applyP && modeP === 'a');
    btnPPassive.classList.toggle('active', canvas2.applyP && modeP === 'p');
    btnDActive.classList.toggle('active', canvas2.applyD && modeD === 'a');
    btnDPassive.classList.toggle('active', canvas2.applyD && modeD === 'p');
    btnP1Active.classList.toggle('active', canvas2.applyP1 && modeP1 === 'a');
    btnP1Passive.classList.toggle('active', canvas2.applyP1 && modeP1 === 'p');

    btnCanvas2Static.classList.toggle('active', canvas2.paused);
    btnCanvas2Dynamic.classList.toggle('active', !canvas2.paused);
}

btnCanvas2Static.addEventListener("click", () => {
    canvas2.static();
    syncCanvas2Buttons();
});
btnCanvas2Dynamic.addEventListener("click", () => {
    canvas2.dynamic();
    syncCanvas2Buttons();
});

btnP.addEventListener('click', () => {
    canvas2.applyP = !canvas2.applyP;
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnD.addEventListener('click', () => {
    canvas2.applyD = !canvas2.applyD;
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnP1.addEventListener('click', () => {
    canvas2.applyP1 = !canvas2.applyP1;
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnPPassive.addEventListener('click', () => {
    canvas2.setPPassive();
    modeP = 'p';
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnPActive.addEventListener('click', () => {
    canvas2.setPActive();
    modeP = 'a';
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnDPassive.addEventListener('click', () => {
    canvas2.setDPassive();
    modeD = 'p';
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnDActive.addEventListener('click', () => {
    canvas2.setDActive();
    modeD = 'a';
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnP1Passive.addEventListener('click', () => {
    canvas2.setP1Passive();
    modeP1 = 'p';
    queueCanvasUpdate();
    syncCanvas2Buttons();
});

btnP1Active.addEventListener('click', () => {
    canvas2.setP1Active();
    modeP1 = 'a';
    queueCanvasUpdate();
    syncCanvas2Buttons();
});
// ===============================
// INITIALIZATION
// ===============================
async function initCanvases() {
    await canvas1.updateValues();
    await canvas1.updateTransformationMatrixSequence();
    await canvas2.updateValues();
    await canvas2.updateTransformationMatrixSequence();

    // Match updateCanvases() reset behavior on first load too, so both
    // animation loops start from t=0 with no initial freeze/lag.
    [canvas1, canvas2].forEach(canvas =>
        canvas.transformationSequences.forEach(seq => {
            seq.t = canvas.paused ? 1 : 0;
            seq.freezeFrames = 0;
            seq.finished = false;
        })
    );

    updateStaticUI();
    updateCanvas1DynamicUI();
    updateCanvas2DynamicUI();
    syncCanvas1Buttons();
    syncCanvas2Buttons();

    canvas1.animate();
    canvas2.animate();
}
setTimeout(initCanvases, 500);
