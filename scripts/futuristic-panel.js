import {loadData, saveData} from '../db/db.js'

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});

const canvas = new fabric.Canvas('fabric-canvas');

function resizeCanvas() {
    const container = document.querySelector('.canvas-container');
    const canvasElement = document.getElementById('fabric-canvas');
    
    if (container && canvasElement) {
        const containerWidth = container.clientWidth;
        const containerHeight = window.innerHeight - 80 - 40; 
        
        const maxWidth = containerWidth - 20; 
        const maxHeight = containerHeight;
        
        const aspectRatio = 1180 / 700;
        let canvasWidth, canvasHeight;
        
        if (maxWidth / maxHeight > aspectRatio) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            canvasWidth = maxWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        canvasWidth = Math.max(canvasWidth, 600);
        canvasHeight = Math.max(canvasHeight, 400);
        canvas.setDimensions({
            width: canvasWidth,
            height: canvasHeight
        });
        canvasElement.width = canvasWidth;
        canvasElement.height = canvasHeight;
        
        canvas.requestRenderAll();
        updateGridPosition();
        if (typeof debouncedSaveCurrentCanvas === 'function') {
            debouncedSaveCurrentCanvas();
        }
    }
}

setTimeout(resizeCanvas, 100);

window.addEventListener('resize', debounce(resizeCanvas, 250));

function addTouchSupport() {
    fabric.util.addListener(canvas.upperCanvasEl, 'touchstart', function(e) {
        e.preventDefault();
    });
    
    fabric.util.addListener(canvas.upperCanvasEl, 'touchmove', function(e) {
        e.preventDefault();
    });
    
    fabric.util.addListener(canvas.upperCanvasEl, 'touchend', function(e) {
        e.preventDefault();
    });
    
    canvas.enableRetinaScaling = false;
    canvas.allowTouchScrolling = false;
    
    let lastTap = 0;
    canvas.on('mouse:down', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            if (e.target) {
                canvas.setActiveObject(e.target);
                canvas.requestRenderAll();
            }
        }
        lastTap = currentTime;
    });
}

addTouchSupport();
function initMobileToggle() {
    const toggleBtn = document.getElementById('mobile-tools-toggle');
    const toolsContainer = document.querySelector('.tools-container');
    
    if (toggleBtn && toolsContainer) {
        toggleBtn.addEventListener('click', () => {
            toolsContainer.classList.toggle('show');
            
            const icon = toggleBtn.querySelector('i');
            const text = toggleBtn.childNodes[1];
            
            if (toolsContainer.classList.contains('show')) {
                icon.className = 'fas fa-times';
                text.textContent = ' Close';
            } else {
                icon.className = 'fas fa-tools';
                text.textContent = ' Tools';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !toolsContainer.contains(e.target) && 
                !toggleBtn.contains(e.target) &&
                toolsContainer.classList.contains('show')) {
                toolsContainer.classList.remove('show');
                toggleBtn.querySelector('i').className = 'fas fa-tools';
                toggleBtn.childNodes[1].textContent = ' Tools';
            }
        });
    }
}

initMobileToggle();

function createDottedGrid() {
    const gridSize = 50;
    const dotSize = 1;
    
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    patternCanvas.width = gridSize;
    patternCanvas.height = gridSize;
    
    patternCtx.fillStyle = '#000000ff';
    patternCtx.beginPath();
    patternCtx.arc(gridSize / 2, gridSize / 2, dotSize / 2, 0, 2 * Math.PI);
    patternCtx.fill();
    
    const pattern = patternCtx.createPattern(patternCanvas, 'repeat');
    
    const gridRect = new fabric.Rect({
        left: -5000,
        top: -5000,
        width: 10000,
        height: 10000,
        fill: pattern,
        selectable: false,
        evented: false,
        excludeFromExport: true
    });
    
    canvas.add(gridRect);
    canvas.sendToBack(gridRect);
    
    return gridRect;
}

let dottedGrid = createDottedGrid();

function updateGridPosition() {
    if (dottedGrid) {
        const vpt = canvas.viewportTransform;
        const zoom = canvas.getZoom();
        
        const offsetX = (vpt[4] % (30 * zoom)) / zoom;
        const offsetY = (vpt[5] % (30 * zoom)) / zoom;
        
        dottedGrid.set({
            left: -5000 - offsetX,
            top: -5000 - offsetY
        });
        
        canvas.requestRenderAll();
    }
}

function toggleGrid() {
    if (dottedGrid) {
        dottedGrid.visible = !dottedGrid.visible;
        canvas.requestRenderAll();
    }
}

window.toggleGrid = toggleGrid;

const textModeBtn = document.getElementById('text-mode');
const shapeModeBtn = document.getElementById('shape-mode');
const drawModeBtn = document.getElementById('draw-mode');
const textContent = document.getElementById('text-content');
const shapeContent = document.getElementById('shape-content');
const drawContent = document.getElementById('draw-content');
const previewText = document.getElementById('preview-text');
const previewShape = document.getElementById('preview-shape');
const statsContainerEl = document.getElementById('stats-container');

const textInput = document.getElementById('text-input');
const fillColorInput = document.getElementById('fill-color');
const strokeColorInput = document.getElementById('stroke-color');
const sizeSlider = document.getElementById('size-slider');
const strokeWidthSlider = document.getElementById('stroke-width');
const opacitySlider = document.getElementById('opacity-slider');
const fontFamilySelect = document.getElementById('font-family');
const transparentFillCheckbox = document.getElementById('transparent-fill');

const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');

const addElementBtn = document.getElementById('add-element');
const uploadInput = document.getElementById('upload');

const enableDrawingBtn = document.getElementById('enable-drawing');
const disableDrawingBtn = document.getElementById('disable-drawing');
const clearDrawingBtn = document.getElementById('clear-drawing');
const brushButtons = document.querySelectorAll('.brush-btn');
const lineButtons = document.querySelectorAll('.line-btn');

const shapeButtons = document.querySelectorAll('.shape-btn');

let currentPath = 'concept'
let currentMode = 'text';
let selectedShape = 'rectangle';
let selectedBrush = 'pencil';
let selectedLineStyle = 'solid';
let isDrawingMode = false;
let currentStyles = {
    fillColor: '#000000',
    strokeColor: '#000000',
    size: 24,
    strokeWidth: 2,
    opacity: 100,
    fontFamily: 'Arial',
    isBold: false,
    isItalic: false,
    isUnderlined: false,
    isTransparentFill: false,
    brushWidth: 3,
    brushType: 'pencil',
    lineStyle: 'solid'
};

const urlString = window.location.href;
let paramString = urlString.split('?')[1];
if (!paramString) window.location.href = "http://127.0.0.1:5500/index.html";
let queryString = new URLSearchParams(paramString);
for (let pair of queryString.entries()) {
    if (pair[0] === 'id') {
        sessionStorage.setItem('id', pair[1]);
        console.log(sessionStorage.getItem('id'));
    } else if (pair[0] === 'conceptName') {
        currentPath = 'concept';
        sessionStorage.setItem('conceptName', pair[1]);
        console.log(sessionStorage.getItem('conceptName'));
    } else if (pair[0] === 'subconceptName') {
        currentPath = 'subconcept';
        sessionStorage.setItem('subconceptName', pair[1]);
        console.log(sessionStorage.getItem('subconceptName'));
    } else {
        window.location.href = "http://127.0.0.1:5500/index.html";
    }
}

const pathUUID = sessionStorage.getItem('id');
console.log(loadData('paths'));
let pathObj = loadData('paths').filter((path) => {
    return path.uuid === pathUUID;
})[0];
console.log(pathObj);
if (!pathObj) window.location.href = "http://127.0.0.1:5500/index.html";
const pathConceptName = currentPath === 'concept' ? sessionStorage.getItem('conceptName') : sessionStorage.getItem('subconceptName');
let pathConceptObj;

if (currentPath === "concept") {
  pathConceptObj = pathObj.path.find(
    (concept) => concept.conceptName === pathConceptName
  );
} else {
  for (let concept of pathObj.path) {
    let subconcept = concept.subconcepts.find(
      (sub) => sub.subconceptName === pathConceptName
    );
    if (subconcept) {
      pathConceptObj = subconcept;
      sessionStorage.setItem('conceptName', concept.conceptName);
      break;
    }
  }
}

console.log(pathConceptObj);
if (!pathConceptObj) window.location.href = "http://127.0.0.1:5500/index.html";

renderStatsList();

loadCurrentCanvas();

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

function renderStatsList() {
    let statsContainerHTML = '';
    let currentSubconceptIndex = 0;
    console.log(statsContainerEl);
    statsContainerEl.innerHTML = '';
    pathObj.path.forEach((concept) => { 
        const isActiveConcept = currentPath === 'concept' && concept.conceptName === pathConceptName;
        const activeClass = isActiveConcept ? ' active' : '';
        statsContainerHTML += `<div class="concept${activeClass}" id="${concept.conceptName}" data-concept="${concept.conceptName}">${toTitleCase(concept.conceptName)}</div>`;
        
        concept.subconcepts.forEach((subconcept) => {
            const isActiveSubconcept = currentPath === 'subconcept' && subconcept.subconceptName === pathConceptName;
            const activeSubClass = isActiveSubconcept ? ' active' : '';
            
            if (currentSubconceptIndex === 0) {
              statsContainerHTML += `
              <div class="sub-concept${activeSubClass}" id="${subconcept.subconceptName}" data-subconcept="${subconcept.subconceptName}" data-parent-concept="${concept.conceptName}">
                <div class="underneath-effect"></div>
                ${toTitleCase(subconcept.subconceptName)}
              </div>
              `;
            } else {
              statsContainerHTML += `
              <div class="sub-concept${activeSubClass}" id="${subconcept.subconceptName}" data-subconcept="${subconcept.subconceptName}" data-parent-concept="${concept.conceptName}">
                <div class="underneath-effect-subconcept"></div>
                ${toTitleCase(subconcept.subconceptName)}
              </div>
              `;
            }
            currentSubconceptIndex++;
        });
        currentSubconceptIndex = 0;
    });
    statsContainerEl.innerHTML = statsContainerHTML;
    
    addStatsClickListeners();
}

function addStatsClickListeners() {
    const conceptElements = document.querySelectorAll('.concept[data-concept]');
    conceptElements.forEach(element => {
        element.addEventListener('click', () => {
            const conceptName = element.dataset.concept;
            const pathId = sessionStorage.getItem('id');
            
            saveCurrentCanvas();
            
            window.location.href = `futuristic-panel.html?id=${pathId}&conceptName=${conceptName}`;
        });
    });
    
    const subconceptElements = document.querySelectorAll('.sub-concept[data-subconcept]');
    subconceptElements.forEach(element => {
        element.addEventListener('click', () => {
            const subconceptName = element.dataset.subconcept;
            const parentConceptName = element.dataset.parentConcept;
            const pathId = sessionStorage.getItem('id');
            
            saveCurrentCanvas();
            
            window.location.href = `futuristic-panel.html?id=${pathId}&subconceptName=${subconceptName}`;
        });
    });
}

function saveCurrentCanvas() {
    try {
        const canvasData = getCanvasData();
        if (currentPath === 'concept') {
            pathConceptObj.conceptMindMap = canvasData;
            pathObj.path = pathObj.path.map((concept) => {
                return concept.conceptName === pathConceptName ? pathConceptObj : concept;
            });
        } else {
            pathConceptObj.subconceptMindMap = canvasData;
            const conceptIndex = pathObj.path.findIndex((concept) => {
                return concept.conceptName === sessionStorage.getItem('conceptName');
            });
            if (conceptIndex >= 0) {
                pathObj.path[conceptIndex].subconcepts = pathObj.path[conceptIndex].subconcepts.map((subconcept) => {
                    return subconcept.subconceptName === pathConceptName ? pathConceptObj : subconcept;
                });
            }
        }
        let toSaveData = loadData('paths').map((path) => {
            return path.uuid === pathUUID ? pathObj : path;
        });
        saveData('paths', toSaveData);
        console.log('Canvas saved successfully');
    } catch (error) {
        console.error('Error saving canvas:', error);
    }
}

let saveTimeout;
function debouncedSaveCurrentCanvas() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveCurrentCanvas();
    }, 500);
}

function loadCurrentCanvas() {
    const canvasData = currentPath === 'concept' ? pathConceptObj.conceptMindMap : pathConceptObj.subconceptMindMap;
    if (canvasData) {
        canvas.clear();
        
        dottedGrid = createDottedGrid();
        
        canvas.loadFromJSON(canvasData, () => {
            if (dottedGrid) {
                canvas.sendToBack(dottedGrid);
            }
            canvas.renderAll();
            updateGridPosition();
        });
    } else {
        if (!dottedGrid || !canvas.getObjects().includes(dottedGrid)) {
            dottedGrid = createDottedGrid();
        }
    }
}

function getCanvasData() {
    const canvasJson = canvas.toJSON();
    
    if (canvasJson.objects) {
        canvasJson.objects = canvasJson.objects.filter(obj => !obj.excludeFromExport);
    }
    
    return JSON.stringify(canvasJson);
}

function switchMode(mode) {
    currentMode = mode;
    
    textModeBtn.classList.toggle('active', mode === 'text');
    shapeModeBtn.classList.toggle('active', mode === 'shape');
    drawModeBtn.classList.toggle('active', mode === 'draw');
    
    textContent.style.display = mode === 'text' ? 'block' : 'none';
    shapeContent.style.display = mode === 'shape' ? 'block' : 'none';
    drawContent.style.display = mode === 'draw' ? 'block' : 'none';
    
    const textStyles = document.getElementById('text-styles');
    textStyles.style.display = mode === 'text' ? 'block' : 'none';
    
    if (mode !== 'draw' && isDrawingMode) {
        disableDrawing();
    }
    
    updatePreview();
}

function updatePreview() {
    if (currentMode === 'text') {
        previewText.style.display = 'block';
        previewShape.style.display = 'none';
        
        const text = textInput.value || 'Hello World!';
        previewText.textContent = text;
        previewText.style.color = currentStyles.fillColor;
        previewText.style.fontSize = currentStyles.size + 'px';
        previewText.style.fontFamily = currentStyles.fontFamily;
        previewText.style.fontWeight = currentStyles.isBold ? 'bold' : 'normal';
        previewText.style.fontStyle = currentStyles.isItalic ? 'italic' : 'normal';
        previewText.style.textDecoration = currentStyles.isUnderlined ? 'underline' : 'none';
        previewText.style.opacity = currentStyles.opacity / 100;
    } else {
        previewText.style.display = 'none';
        previewShape.style.display = 'block';
        
        if (currentStyles.isTransparentFill) {
            previewShape.style.background = 'transparent';
        } else {
            previewShape.style.background = currentStyles.fillColor;
        }
        previewShape.style.border = `${currentStyles.strokeWidth}px solid ${currentStyles.strokeColor}`;
        previewShape.style.opacity = currentStyles.opacity / 100;
        
        applyShapeStyles();
    }
}

function applyShapeStyles() {
    const size = currentStyles.size;
    previewShape.style.width = size + 'px';
    previewShape.style.height = size + 'px';
    
    switch (selectedShape) {
        case 'rectangle':
            previewShape.style.borderRadius = '0';
            break;
        case 'circle':
            previewShape.style.borderRadius = '50%';
            break;
        case 'triangle':
            previewShape.style.background = 'transparent';
            previewShape.style.border = 'none';
            previewShape.style.width = '0';
            previewShape.style.height = '0';
            previewShape.style.borderLeft = `${size/2}px solid transparent`;
            previewShape.style.borderRight = `${size/2}px solid transparent`;
            if (currentStyles.isTransparentFill) {
                previewShape.style.borderBottom = `${size}px solid transparent`;
                previewShape.style.borderBottomColor = 'transparent';
                previewShape.style.border = `${currentStyles.strokeWidth}px solid ${currentStyles.strokeColor}`;
                previewShape.style.width = size + 'px';
                previewShape.style.height = size + 'px';
                previewShape.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
            } else {
                previewShape.style.borderBottom = `${size}px solid ${currentStyles.fillColor}`;
            }
            break;
        case 'diamond':
            previewShape.style.borderRadius = '0';
            previewShape.style.transform = 'rotate(45deg)';
            break;
        default:
            previewShape.style.borderRadius = '0';
            previewShape.style.transform = 'none';
    }
}

function updateValueDisplays() {
    document.getElementById('fill-value').textContent = currentStyles.isTransparentFill ? 'Transparent' : currentStyles.fillColor;
    document.getElementById('stroke-value').textContent = currentStyles.strokeColor;
    document.getElementById('size-value').textContent = currentStyles.size;
    document.getElementById('stroke-width-value').textContent = currentStyles.strokeWidth;
    document.getElementById('opacity-value').textContent = currentStyles.opacity + '%';
}

textModeBtn.addEventListener('click', () => switchMode('text'));
shapeModeBtn.addEventListener('click', () => switchMode('shape'));
drawModeBtn.addEventListener('click', () => switchMode('draw'));

textInput.addEventListener('input', updatePreview);

fillColorInput.addEventListener('input', (e) => {
    currentStyles.fillColor = e.target.value;
    updatePreview();
    updateValueDisplays();
});

strokeColorInput.addEventListener('input', (e) => {
    currentStyles.strokeColor = e.target.value;
    updatePreview();
    updateValueDisplays();
    
    if (isDrawingMode) {
        canvas.freeDrawingBrush.color = e.target.value;
    }
});

transparentFillCheckbox.addEventListener('change', (e) => {
    currentStyles.isTransparentFill = e.target.checked;
    
    fillColorInput.disabled = e.target.checked;
    if (e.target.checked) {
        fillColorInput.style.opacity = '0.5';
        fillColorInput.style.cursor = 'not-allowed';
    } else {
        fillColorInput.style.opacity = '1';
        fillColorInput.style.cursor = 'pointer';
    }
    
    updatePreview();
    updateValueDisplays();
});

sizeSlider.addEventListener('input', (e) => {
    currentStyles.size = parseInt(e.target.value);
    updatePreview();
    updateValueDisplays();
});

strokeWidthSlider.addEventListener('input', (e) => {
    currentStyles.strokeWidth = parseInt(e.target.value);
    updatePreview();
    updateValueDisplays();
    
    if (isDrawingMode) {
        canvas.freeDrawingBrush.width = parseInt(e.target.value);
    }
});

opacitySlider.addEventListener('input', (e) => {
    currentStyles.opacity = parseInt(e.target.value);
    updatePreview();
    updateValueDisplays();
});

fontFamilySelect.addEventListener('change', (e) => {
    currentStyles.fontFamily = e.target.value;
    updatePreview();
});

boldBtn.addEventListener('click', () => {
    currentStyles.isBold = !currentStyles.isBold;
    boldBtn.classList.toggle('active', currentStyles.isBold);
    updatePreview();
});

italicBtn.addEventListener('click', () => {
    currentStyles.isItalic = !currentStyles.isItalic;
    italicBtn.classList.toggle('active', currentStyles.isItalic);
    updatePreview();
});

underlineBtn.addEventListener('click', () => {
    currentStyles.isUnderlined = !currentStyles.isUnderlined;
    underlineBtn.classList.toggle('active', currentStyles.isUnderlined);
    updatePreview();
});

shapeButtons.forEach(button => {
    button.addEventListener('click', () => {
        shapeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        selectedShape = button.dataset.shape;
        updatePreview();
    });
});

function enableDrawing() {
    isDrawingMode = true;
    canvas.isDrawingMode = true;
    
    canvas.freeDrawingBrush.width = currentStyles.strokeWidth;
    canvas.freeDrawingBrush.color = currentStyles.strokeColor;
    
    switch (selectedLineStyle) {
        case 'dashed':
            canvas.freeDrawingBrush.strokeDashArray = [10, 5];
            break;
        case 'dotted':
            canvas.freeDrawingBrush.strokeDashArray = [3, 3];
            break;
        default:
            canvas.freeDrawingBrush.strokeDashArray = null;
    }
    
    enableDrawingBtn.style.display = 'none';
    disableDrawingBtn.style.display = 'block';
    enableDrawingBtn.classList.remove('active');
    disableDrawingBtn.classList.add('active');
    
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
}

function disableDrawing() {
    isDrawingMode = false;
    canvas.isDrawingMode = false;
    
    enableDrawingBtn.style.display = 'block';
    disableDrawingBtn.style.display = 'none';
    disableDrawingBtn.classList.remove('active');
    
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
}

function clearAllDrawings() {
    const objects = canvas.getObjects();
    objects.forEach(obj => {
        if (obj.type === 'path') {
            canvas.remove(obj);
        }
    });
    canvas.requestRenderAll();
    saveCurrentCanvas();
}

enableDrawingBtn.addEventListener('click', enableDrawing);
disableDrawingBtn.addEventListener('click', disableDrawing);
clearDrawingBtn.addEventListener('click', clearAllDrawings);

brushButtons.forEach(button => {
    button.addEventListener('click', () => {
        brushButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        selectedBrush = button.dataset.brush;
        currentStyles.brushType = selectedBrush;
        
        switch (selectedBrush) {
            case 'pencil':
                currentStyles.strokeWidth = 2;
                break;
            case 'brush':
                currentStyles.strokeWidth = 8;
                break;
            case 'marker':
                currentStyles.strokeWidth = 12;
                break;
        }
        
        strokeWidthSlider.value = currentStyles.strokeWidth;
        updateValueDisplays();
        
        if (isDrawingMode) {
            canvas.freeDrawingBrush.width = currentStyles.strokeWidth;
        }
    });
});

lineButtons.forEach(button => {
    button.addEventListener('click', () => {
        lineButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        selectedLineStyle = button.dataset.style;
        currentStyles.lineStyle = selectedLineStyle;
        
        if (isDrawingMode) {
            switch (selectedLineStyle) {
                case 'dashed':
                    canvas.freeDrawingBrush.strokeDashArray = [10, 5];
                    break;
                case 'dotted':
                    canvas.freeDrawingBrush.strokeDashArray = [3, 3];
                    break;
                default:
                    canvas.freeDrawingBrush.strokeDashArray = null;
            }
        }
    });
});

addElementBtn.addEventListener('click', () => {
    if (currentMode === 'text') {
        addTextToCanvas();
    } else {
        addShapeToCanvas();
    }
});

function addTextToCanvas() {
    const text = textInput.value || 'Hello World!';
    
    const textObj = new fabric.Textbox(text, {
        left: 100,
        top: 100,
        fill: currentStyles.fillColor,
        fontSize: currentStyles.size,
        fontFamily: currentStyles.fontFamily,
        fontWeight: currentStyles.isBold ? 'bold' : 'normal',
        fontStyle: currentStyles.isItalic ? 'italic' : 'normal',
        underline: currentStyles.isUnderlined,
        opacity: currentStyles.opacity / 100,
        stroke: currentStyles.strokeWidth > 0 ? currentStyles.strokeColor : '',
        strokeWidth: currentStyles.strokeWidth
    });
    
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
}

function addShapeToCanvas() {
    let shapeObj;
    const commonProps = {
        left: 100,
        top: 100,
        fill: currentStyles.isTransparentFill ? 'transparent' : currentStyles.fillColor,
        stroke: currentStyles.strokeColor,
        strokeWidth: currentStyles.strokeWidth,
        opacity: currentStyles.opacity / 100
    };
    
    switch (selectedShape) {
        case 'rectangle':
            shapeObj = new fabric.Rect({
                ...commonProps,
                width: currentStyles.size,
                height: currentStyles.size * 0.7
            });
            break;
        case 'circle':
            shapeObj = new fabric.Circle({
                ...commonProps,
                radius: currentStyles.size / 2
            });
            break;
        case 'triangle':
            shapeObj = new fabric.Triangle({
                ...commonProps,
                width: currentStyles.size,
                height: currentStyles.size
            });
            break;
        case 'diamond':
            shapeObj = new fabric.Rect({
                ...commonProps,
                width: currentStyles.size,
                height: currentStyles.size,
                angle: 45
            });
            break;
        case 'star':
            const starPath = createStarPath(currentStyles.size / 2);
            shapeObj = new fabric.Path(starPath, commonProps);
            break;
        case 'heart':
            const heartPath = createHeartPath(currentStyles.size);
            shapeObj = new fabric.Path(heartPath, commonProps);
            break;
        case 'hexagon':
            const hexPath = createHexagonPath(currentStyles.size / 2);
            shapeObj = new fabric.Path(hexPath, commonProps);
            break;
        case 'arrow':
            const arrowPath = createArrowPath(currentStyles.size);
            shapeObj = new fabric.Path(arrowPath, commonProps);
            break;
        default:
            shapeObj = new fabric.Rect({
                ...commonProps,
                width: currentStyles.size,
                height: currentStyles.size * 0.7
            });
    }
    
    canvas.add(shapeObj);
    canvas.setActiveObject(shapeObj);
}

function createStarPath(radius) {
    const points = 5;
    const innerRadius = radius * 0.4;
    let path = 'M ';
    
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? radius : innerRadius;
        const x = Math.cos(angle - Math.PI / 2) * r;
        const y = Math.sin(angle - Math.PI / 2) * r;
        path += `${x} ${y} `;
        if (i === 0) path += 'L ';
    }
    path += 'Z';
    return path;
}

function createHeartPath(size) {
    const scale = size / 100;
    return `M 50,90 C 20,60 0,30 0,30 C 0,10 20,0 40,10 C 50,0 60,0 70,10 C 90,0 100,10 100,30 C 100,30 80,60 50,90 Z`;
}

function createHexagonPath(radius) {
    let path = 'M ';
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        path += `${x} ${y} `;
        if (i === 0) path += 'L ';
    }
    path += 'Z';
    return path;
}

function createArrowPath(size) {
    const scale = size / 100;
    return `M 0,40 L 60,40 L 60,20 L 100,50 L 60,80 L 60,60 L 0,60 Z`;
}

uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, function(img) {
            img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
            canvas.add(img);
        });
    };
    
    if (file) {
        reader.readAsDataURL(file);
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
        console.log('deleting item');
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            canvas.remove(activeObj);
        }
    }
});

let isDragging = false;
let lastPosX = 0;
let lastPosY = 0;

canvas.on('mouse:wheel', function(opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 5) zoom = 5;
    if (zoom < 0.5) zoom = 0.5;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    updateGridPosition();
    opt.e.preventDefault();
    opt.e.stopPropagation();
});

canvas.on('mouse:down', function(opt) {
    const evt = opt.e;
    
    if (isDrawingMode) {
        if (evt.button === 2) {
            evt.preventDefault();
            isDragging = true;
            canvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
            canvas.defaultCursor = 'grabbing';
            canvas.hoverCursor = 'grabbing';
        }
    } else {
        if (evt.altKey === true || (evt.button === 1) || (!canvas.getActiveObject() && evt.button === 0)) {
            isDragging = true;
            canvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
            canvas.defaultCursor = 'grabbing';
            canvas.hoverCursor = 'grabbing';
        }
    }
});

canvas.on('mouse:move', function(opt) {
    if (isDragging) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        canvas.requestRenderAll();
        updateGridPosition();
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
    }
});

canvas.on('mouse:up', function(opt) {
    if (isDragging) {
        canvas.selection = true;
        isDragging = false;
        
        if (isDrawingMode) {
            canvas.defaultCursor = 'crosshair';
            canvas.hoverCursor = 'crosshair';
        } else {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'move';
        }
    }
});

canvas.on('object:modified', function(e) {
    saveCurrentCanvas();
});

canvas.on('object:moved', function(e) {
    debouncedSaveCurrentCanvas(); 
});

canvas.on('object:scaling', function(e) {
    debouncedSaveCurrentCanvas();
});

canvas.on('object:rotating', function(e) {
    debouncedSaveCurrentCanvas();
});

canvas.on('path:created', function(e) {
    saveCurrentCanvas();
});

canvas.on('object:skewing', function(e) {
    debouncedSaveCurrentCanvas();
});

canvas.on('object:added', function(e) {
    if (e.target && !e.target.excludeFromExport) {
        saveCurrentCanvas();
    }
});

canvas.on('object:removed', function(e) {
    if (e.target && !e.target.excludeFromExport) {
        saveCurrentCanvas(); 
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
        console.log('deleting item');
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            canvas.remove(activeObj);
            saveCurrentCanvas();
        }
        return;
    }
    
    if ((e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const activeObj = canvas.getActiveObject();
        
        if (e.ctrlKey || !activeObj) {
            e.preventDefault();
            const panStep = e.shiftKey ? 50 : 20;
            const vpt = canvas.viewportTransform;
            
            switch (e.key) {
                case "ArrowUp":
                    vpt[5] += panStep;
                    break;
                case "ArrowDown":
                    vpt[5] -= panStep;
                    break;
                case "ArrowLeft":
                    vpt[4] += panStep;
                    break;
                case "ArrowRight":
                    vpt[4] -= panStep;
                    break;
            }
            canvas.requestRenderAll();
            updateGridPosition();
        }
    }
    
    if (e.code === "Space" && !isTypingInInput(e.target)) {
        e.preventDefault();
        canvas.defaultCursor = 'grab';
    }
});

function isTypingInInput(target) {
    return target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.isContentEditable
    );
}

document.addEventListener("keyup", (e) => {
    if (e.code === "Space" && !isTypingInInput(e.target)) {
        canvas.defaultCursor = 'default';
    }
});

function resetCanvasView() {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    updateGridPosition();
    canvas.requestRenderAll();
}

window.resetCanvasView = resetCanvasView;

canvas.wrapperEl.addEventListener('contextmenu', function(e) {
    if (isDrawingMode) {
        e.preventDefault();
    }
});

switchMode('text');
updatePreview();
updateValueDisplays();