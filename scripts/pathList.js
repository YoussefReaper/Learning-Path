import { loadData, saveData } from '../db/db.js';

document.addEventListener('DOMContentLoaded', () => {
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});

const pathContainerEl = document.getElementById('paths-container');
const numberOfPathsEl = document.getElementById('number-of-paths');
const createPathPanelEl = document.getElementById('create-path-panel');
const editPathPanelEl = document.getElementById('edit-path-panel');
const containerEl = document.getElementById('container');
const searchInput = document.getElementById('search-input');

const addPathBtn = document.getElementById('add-path-btn');
const createPathSubmitBtn = document.getElementById('create-path-submit-btn');
const editPathSubmitBtn = document.getElementById('create-path-edit-submit-btn');

const pathNameInput = document.getElementById('name-of-path');
const pathDescriptionInput = document.getElementById('description-of-path');
const pathEditNameInput = document.getElementById('name-of-edit-path');
const pathEditDescriptionInput = document.getElementById('description-of-edit-path');

let isCreatingPath = false;
let isEditingPath = false;
let currentEditingPath = {};

try {
    const theData = loadData('paths');
    if (!Array.isArray(theData)) {
        localStorage.removeItem('paths');
    }
    theData.forEach((path) => {
        console.log(path.uuid);
    });
} catch (err) {
    console.log(err);
    localStorage.removeItem('paths');
}

document.addEventListener('DOMContentLoaded', renderPathList);

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm === '') {
        renderPathList();
    } else {
        renderPathList(searchTerm.toLowerCase());
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        renderPathList();
    }
});

document.addEventListener('click', (e) => {
    e.target.matches('.delete-path')  && handleDeletePath(e.target);

    const pathEl = e.target.closest('.learning-path');

    if (pathEl && !e.target.matches('.delete-path') && !e.target.matches('.edit-path')) {
        handlePathClick(pathEl);
    } else if (e.target.matches('.edit-path')) {
        handleEditPath(e.target);
    }
    else if (e.target === createPathSubmitBtn) {
        e.preventDefault();
        handleCreatePath();
    } else if (e.target === editPathSubmitBtn) {
        e.preventDefault();
        handleEditSubmitPath();
    } else if (e.target === addPathBtn) {
        handleAddPath();
    } else if (!createPathPanelEl.contains(e.target) && isCreatingPath) {
        isCreatingPath = false;
        handleExitCreatePathPanel();
    } else if (!editPathPanelEl.contains(e.target) && isEditingPath) {
        isEditingPath = false;
        handleExitEditPathPanel();
    }
});

function handleAddPath() {
    console.log("Clicked add button");
    containerEl.classList.add('blur');
    createPathPanelEl.style.display = 'block';
    isCreatingPath = true;
}

function handleExitCreatePathPanel() {
    console.log("Clicked outside that shit");
    containerEl.classList.remove('blur');
    createPathPanelEl.style.display = 'none';
}

function handleExitEditPathPanel() {
    console.log("Clicked outside that shit");
    containerEl.classList.remove('blur');
    editPathPanelEl.style.display = 'none';
}

function handleDeletePath(pathEl) {
    console.log("Clicked delete button");
    const pathUUID = pathEl.dataset.id;
    let toSaveData = loadData('paths') || [];
    if (toSaveData) {
        toSaveData = toSaveData.filter((path) => {
            return path.uuid !== pathUUID;
        });
    }
    saveData('paths', toSaveData);
    renderPathList();
}

function handleEditPath(pathEl) {
    console.log("Clicked edit button!");
    const pathUUID = pathEl.dataset.id;

    let toSaveData = loadData('paths') || [];
    let toEditPath = toSaveData.filter((path) => {
        return path.uuid === pathUUID;
    })[0];
    
    pathEditNameInput.value = toEditPath.name;
    pathEditDescriptionInput.value = toEditPath.description;
    currentEditingPath = toEditPath;

    editPathPanelEl.style.display = 'block';
    containerEl.classList.add('blur');

    isEditingPath = true;
}

function handleEditSubmitPath() {
    let toSaveData = loadData('paths') || [];

    currentEditingPath.name = pathEditNameInput.value;
    currentEditingPath.description = pathEditDescriptionInput.value;

    toSaveData = toSaveData.filter((path) => {
        return path.uuid !== currentEditingPath.uuid;
    });
    
    toSaveData.push(currentEditingPath);
    saveData('paths', toSaveData);

    pathEditDescriptionInput.value = '';
    pathEditNameInput.value = '';
    handleExitEditPathPanel();
    renderPathList();
}

function handleCreatePath() {
    console.log("Clicked create button!");
    const pathName = pathNameInput.value.trim();
    const pathDesc = pathDescriptionInput.value.trim();
    const pathUUID = uuidv4();

    const newPath = {
        name: pathName,
        description: pathDesc,
        uuid: pathUUID,
        stats: {
            masteryPercentage: 0,
        },
        path: [],
    };

    pathNameInput.value = '';
    pathEditDescriptionInput.value = '';
    handleExitCreatePathPanel();

    let toSaveData = loadData('paths') || [];
    toSaveData.push(newPath);
    saveData('paths', toSaveData);
    renderPathList();
}

function handlePathClick(path) {
    const pathUUID = path.id;
    const pathObj = loadData('paths').filter((pathO) => {
        return pathO.uuid === pathUUID;
    })[0];

    window.location.href = `http://127.0.0.1:5500/path.html?id=${pathUUID}`;
}

function renderPathList(searchTerm = '') {
    const data = loadData('paths');
    let pathListHTML = [];

    if (Array.isArray(data)) {
        // Filter paths based on search term
        let filteredData = data;
        if (searchTerm && searchTerm.length > 0) {
            filteredData = data.filter(path => 
                path.name.toLowerCase().includes(searchTerm) || 
                path.description.toLowerCase().includes(searchTerm)
            );
        }
        // If searchTerm is empty or undefined, filteredData remains as all data

        filteredData.forEach(object => {
            try {
                pathListHTML.push(`
                    <div class="learning-path" id='${object.uuid}'>
                        <div class="title">
                            <h3>${object.name}</h3>
                            <h5>${object.description}</h6>
                        </div>
                        <div class="statistics">
                            <span class="completion-percentage">${object.stats.masteryPercentage}%</span>
                            <button class="delete-path" data-id='${object.uuid}'>Delete</button>
                            <button class="edit-path" data-id='${object.uuid}'>Edit</button>
                        </div>
                    </div>
                `);
            } catch (err) {
                console.log(err);
            }
        });
    }

    if (pathListHTML.length) {
        numberOfPathsEl.textContent = `${pathListHTML.length} Paths`;
        pathContainerEl.innerHTML = pathListHTML.join('');
    } else {
        numberOfPathsEl.textContent = `0 Paths`;
        const noResultsMessage = searchTerm ? 
            `No paths found matching "${searchTerm}"` : 
            "if you didn't make a new learning path.....";
        
        pathContainerEl.innerHTML = `
            <div class="default-learning-path">
                <h3 class="default-text">${noResultsMessage}</h3>
                ${!searchTerm ? '<img src="Saturo.png" alt="Saturo.png" aria-label="an image of saturo gojo running in strange way." class="default-img">' : ''}
            </div>
        `;
    }
}