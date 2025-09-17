import { loadData, saveData } from '../db/db.js';

document.addEventListener('DOMContentLoaded', () => {
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        headerTitle.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});

const containerEl = document.getElementById('container');
const addPanel = document.getElementById('add-panel');
const optionsBtn = document.getElementById('options-btn');
const createBtn = document.getElementById('create-btn');
const pathName = document.getElementById('name');
const pathTitle = document.getElementById('path-title');
const conceptInfo = document.getElementById('concept-info');
const pathDesc = document.getElementById('path-desc');
const resourcesAddPanel = document.getElementById('resources-add-panel');
const resourcesAddBtn = document.getElementById('add-resources-btn');
const selectDiff = document.getElementById('select-difficulity');
const validationMessage = document.getElementById('validation-message');
const nameCounter = document.getElementById('name-counter');
const descCounter = document.getElementById('desc-counter');

let pdfLink = document.getElementById('pdf-link');
let articleLink = document.getElementById('article-link');
let ytIntroLink = document.getElementById('yt-intro-link');
let ytPlaylistLink = document.getElementById('yt-playlist-link');
let ytFullvideoLink = document.getElementById('yt-fullvideo-link');
// const conceptName = document.getElementById('concept-name'); Must be done at the final edition

console.log(loadData('paths'))

let isAddingConcept = false;

const urlString = window.location.href;
let paramString = urlString.split('?')[1];
if (!paramString) window.location.href = "http://127.0.0.1:5500/index.html";
let queryString = new URLSearchParams(paramString);
for (let pair of queryString.entries()) {
    if (pair[0] === 'id') {
        sessionStorage.setItem('id', pair[1]);
        console.log(sessionStorage.getItem('id'));
    }
    else {
        window.location.href = "http://127.0.0.1:5500/index.html";
    }
}

const pathUUID = sessionStorage.getItem('id');
console.log(loadData('paths'));
let pathObj = loadData('paths').filter((path) => {
    return path.uuid === pathUUID;
})[0];

if (!pathObj) window.location.href = "http://127.0.0.1:5500/index.html";

let pathConcepts = pathObj.path;

renderPathConcepts();
handleOutsideClick();

document.addEventListener('click', (e) =>{
    if (e.target === optionsBtn) handleOptionClick();
    else if (e.target.closest('.container') && isAddingConcept) handleOutsideClick();
    else if (e.target === createBtn) {
        e.preventDefault();
        handleCreateBtnClick();
    }
    else if (e.target.matches('.concept') || e.target.matches('.sub-concept')) handleConceptClick(e.target);
    else if (e.target.matches('.close-concept-info')) handleCloseConceptInfo();
    else if (e.target === resourcesAddBtn) {
        console.log(resourcesAddPanel.style.display)
        resourcesAddPanel.style.display = resourcesAddPanel.style.display === 'none' || !resourcesAddPanel.style.display ? 'flex' : 'none';
        console.log(resourcesAddPanel.style.display)
    }
    else if (e.target.matches('.futuristic-panel')) {
        const conceptName = e.target.dataset.id;
        const conceptType = e.target.dataset.type;
        if (conceptType === 'concept') {
            window.open(`http://127.0.0.1:5500/futuristic-panel.html?id=${pathUUID}&conceptName=${conceptName}`, '_blank');
        } else {
            window.open(`http://127.0.0.1:5500/futuristic-panel.html?id=${pathUUID}&subconceptName=${conceptName}`, '_blank');
        }
    }
    else if (e.target.matches('.delete-concept')) handleDeleteConcept(e.target);
    else if (e.target.matches('.edit-concept')) handleEditConcept(e.target);
    else if (e.target.matches('.add-note')) handleAddNote(e.target);
});

pathName.addEventListener('input', () => {
    updateCharacterCounter(pathName, nameCounter, 50);
    if (validationMessage.classList.contains('show')) {
        hideValidationMessage();
    }
});

pathDesc.addEventListener('input', () => {
    updateCharacterCounter(pathDesc, descCounter, 200);
    if (validationMessage.classList.contains('show')) {
        hideValidationMessage();
    }
});

selectDiff.addEventListener('change', () => {
    if (validationMessage.classList.contains('show')) {
        hideValidationMessage();
    }
});

document.querySelectorAll('input[name="add-options"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (validationMessage.classList.contains('show')) {
            hideValidationMessage();
        }
    });
});

function updateCharacterCounter(input, counter, maxLength) {
    const currentLength = input.value.length;
    const percentage = (currentLength / maxLength) * 100;
    
    counter.textContent = `${currentLength}/${maxLength}`;
    
    counter.classList.remove('warning', 'danger', 'success');
    if (currentLength === 0) {
        // Default color
    } else if (percentage < 60) {
        counter.classList.add('success');
    } else if (percentage < 85) {
        counter.classList.add('warning');
    } else {
        counter.classList.add('danger');
    }
    
    input.style.borderColor = '';
    if (currentLength === 0) {
        input.style.borderColor = 'rgba(181, 109, 229, 0.3)';
    } else if (currentLength < 2 && input === pathName) {
        input.style.borderColor = '#f44336';
    } else if (currentLength < 10 && input === pathDesc) {
        input.style.borderColor = '#f44336';
    } else if (percentage >= 100) {
        input.style.borderColor = '#f44336';
    } else if (percentage >= 85) {
        input.style.borderColor = '#ff9800';
    } else {
        input.style.borderColor = '#4caf50';
    }
}

function handleDeleteConcept(conceptToBeDeleted) {
    const conceptName = conceptToBeDeleted.dataset.id;
    const conceptType = conceptToBeDeleted.dataset.type;
    
    if (conceptType === 'concept') {
        pathObj.path = pathConcepts.filter((concept) => {
            return concept.conceptName !== conceptName;
        });
    } else {
        pathObj.path = pathConcepts.map((concept) => {
            if (concept.subconcepts) {
                concept.subconcepts = concept.subconcepts.filter((subconcept) => {
                    return subconcept.subconceptName !== conceptName;
                });
            }
            return concept;
        });
    }
    
    let toSaveData = loadData('paths').map((path) => {
        return path.uuid === pathUUID ? path = pathObj : path = path;
    });
    saveData('paths', toSaveData);
    renderPathConcepts();
    handleCloseConceptInfo();
}

function handleEditConcept(conceptToBeEdited) {
    const conceptName = conceptToBeEdited.dataset.id;
    const conceptType = conceptToBeEdited.dataset.type;
    
    let conceptObj;
    
    if (conceptType === 'concept') {
        conceptObj = pathConcepts.filter((concept) => {
            return concept.conceptName === conceptName;
        })[0];
    } else {
        pathConcepts.forEach((concept) => {
            if (concept.subconcepts) {
                concept.subconcepts.forEach((subconcept) => {
                    if (subconcept.subconceptName === conceptName) {
                        conceptObj = subconcept;
                    }
                });
            }
        });
    }
    
    if (conceptObj) {
        const isConceptType = conceptType === 'concept';
        const name = isConceptType ? conceptObj.conceptName : conceptObj.subconceptName;
        const desc = isConceptType ? conceptObj.conceptDesc : conceptObj.subconceptDesc;
        const stats = isConceptType ? conceptObj.conceptStats : conceptObj.subconceptStats;
        
        pathName.value = name;
        pathDesc.value = desc;
        
        const levelMap = { 'Beginner': '1', 'Intermediate': '2', 'Advanced': '3', 'Extreme': '4' };
        selectDiff.value = levelMap[stats.level] || '1';
        
        const conceptRadio = document.getElementById('concept-radio');
        const subConceptRadio = document.getElementById('sub-concept-radio');
        if (isConceptType) {
            conceptRadio.checked = true;
        } else {
            subConceptRadio.checked = true;
        }
        
        if (stats.resources) {
            if (pdfLink) pdfLink.value = stats.resources.pdfLink || '';
            if (articleLink) articleLink.value = stats.resources.articleLink || '';
            if (ytIntroLink) ytIntroLink.value = stats.resources.ytIntroLink || '';
            if (ytPlaylistLink) ytPlaylistLink.value = stats.resources.ytPlaylistLink || '';
            if (ytFullvideoLink) ytFullvideoLink.value = stats.resources.ytFullvideoLink || '';
        }
        
        sessionStorage.setItem('editMode', 'true');
        sessionStorage.setItem('editConceptName', conceptName);
        sessionStorage.setItem('editConceptType', conceptType);
        
        handleOptionClick();
        handleCloseConceptInfo();
        
        setTimeout(() => {
            updateCharacterCounter(pathName, nameCounter, 50);
            updateCharacterCounter(pathDesc, descCounter, 200);
        }, 100);
    }
}

function handleCloseConceptInfo() {
    conceptInfo.style.left = '-2000px';
}

function handleConceptClick(concept) {
    let conceptName = '';
    let conceptDesc = '';
    let conceptStat = {};
    let resourcesHTML = '';
    let isConcept = false;
    const conceptId = concept.id;
    if (concept.matches('.concept')) {
        const conceptObj = pathConcepts.filter((pathConcept) => {
            return pathConcept.conceptName === conceptId;
        })[0];
        conceptName = conceptObj.conceptName;
        conceptDesc = conceptObj.conceptDesc;
        conceptStat = conceptObj.conceptStats;
        isConcept = true;
    } else {
        let conceptObj;
        pathConcepts.forEach((pathConcept) => {
            pathConcept.subconcepts.forEach((pathSubconcept) => {
                if (pathSubconcept.subconceptName === conceptId) {
                    conceptObj = pathSubconcept;
                }
            });
        });
        conceptName = conceptObj.subconceptName;
        conceptDesc = conceptObj.subconceptDesc;
        conceptStat = conceptObj.subconceptStats;
    }
    
    Object.entries(conceptStat.resources).forEach(([key, value]) => {
        if (value) {
            if (key === 'pdfLink') {
                resourcesHTML += `
                    <li><a href="${value}" target="_blank">PDF Explanation</a></li>
                `
            } else if (key === 'articleLink') {
                resourcesHTML += `
                    <li><a href="${value}" target="_blank">Article Explanation</a></li>
                `
            }  else if (key === 'ytIntroLink') {
                resourcesHTML += `
                    <li><a href="${value}" target="_blank">Youtube Intro</a></li>
                `
            } else if (key === 'ytPlaylistLink') {
                resourcesHTML += `
                    <li><a href="${value}" target="_blank">Youtube Playlist</a></li>
                `
            } else if (key === "ytFullvideoLink") {
                resourcesHTML += `
                    <li><a href="${value}" target="_blank">Youtube FullVideo</a></li>
                `
            }
        }
    });

    conceptInfo.style.left = '0';
    conceptInfo.innerHTML = `
        <div class="concept-info-content">
            <div class="concept-header">
                <h3 class="concept-title">${toTitleCase(conceptName)}</h3>
                <span class="concept-level">${conceptStat.level}</span>
                <span class="concept-time">Est. Time: ${conceptStat.estimatedTime}</span>
            </div>

            <div class="concept-progress">
                <h4>Mastery Percentage: <span class="mastery-percentage" id="mastery-percentage">${conceptStat.masteryPercentage}</span>%</h4>
                <progress value="${conceptStat.masteryPercentage}" max="100"></progress>
            </div>

            <div class="concept-details">
                <p class="concept-description">
                    ${conceptDesc}
                </p>
            <div class="concept-prerequisites">
                <strong>Prerequisites:</strong> <span class="prerequisites" id="prerequisites">None (Coming Soon)</span>
            </div>
                <div class="concept-tags">
                    <span class="tag-item">#Coming Soon</span>
                </div>
            </div>

            <div class="concept-progress">
                <p>Status: <span class="concept-status">${conceptStat.status}</span></p>
                <p>Practice Sessions: <span class="concept-practice-count">${conceptStat.paracticeSessions}</span></p>
                <p>Solved Quizzes: <span class="concept-solved-quizzes">${conceptStat.solvedQuizzes}</span></p>
                <p>FlashCards Reviewed: <span class="concept-flashcards-reviewed-count">${conceptStat.flashCardsReviewed}</span></p>
            </div>

            <div class="concept-resources">
                <strong>Resources:</strong>
                <ul>
                    ${resourcesHTML}
                </ul>
            </div>
            <div class="concept-actions">
                <button class="futuristic-panel" id="futuristic-panel" data-id="${conceptName}" data-type="${isConcept ? 'concept' : 'subconcept'}">Concept Futuristic Panel</button>
                <div class="other-buttons">
                    <button class="edit-concept" id="edit-concept" data-id="${conceptName}" data-type="${isConcept ? 'concept' : 'subconcept'}">Edit</button>
                    <button class="delete-concept" id="delete-concept" data-id="${conceptName}" data-type="${isConcept ? 'concept' : 'subconcept'}">Delete</button>
                </div>
            </div>
        </div>
        <button class="close-concept-info" id="close-concept-info">X</button>
    `
    
    setTimeout(() => {
        const contentEl = conceptInfo.querySelector('.concept-info-content');
        if (contentEl && contentEl.scrollHeight > contentEl.clientHeight) {
            contentEl.classList.add('has-scroll');
        }
    }, 100);
}

function handleOptionClick() {
    containerEl.classList.add('blur');
    addPanel.style.display = 'flex';
    isAddingConcept = true;
}

function handleOutsideClick() {
    containerEl.classList.remove('blur');
    addPanel.style.display = 'none';
    isAddingConcept = false;
    
    hideValidationMessage();
    
    if (sessionStorage.getItem('editMode') === 'true') {
        sessionStorage.removeItem('editMode');
        sessionStorage.removeItem('editConceptName');
        sessionStorage.removeItem('editConceptType');
        
        pathName.value = '';
        pathDesc.value = '';
        selectDiff.value = '0';
        if (pdfLink) pdfLink.value = '';
        if (articleLink) articleLink.value = '';
        if (ytIntroLink) ytIntroLink.value = '';
        if (ytPlaylistLink) ytPlaylistLink.value = '';
        if (ytFullvideoLink) ytFullvideoLink.value = '';
        
        if (nameCounter) nameCounter.textContent = '0/50';
        if (descCounter) descCounter.textContent = '0/200';
        
        pathName.style.borderColor = 'rgba(181, 109, 229, 0.3)';
        pathDesc.style.borderColor = 'rgba(181, 109, 229, 0.3)';
    }
}

let validationTimeout = null;

function showValidationMessage(message, type = 'error') {
    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }
    
    validationMessage.textContent = message;
    validationMessage.className = `validation-message ${type} show`;
    
    validationTimeout = setTimeout(() => {
        hideValidationMessage();
    }, 5000);
}

function hideValidationMessage() {
    if (validationMessage.classList.contains('show')) {
        validationMessage.classList.remove('show');
        setTimeout(() => {
            // Only reset the className if the message is still hidden
            if (!validationMessage.classList.contains('show')) {
                validationMessage.className = 'validation-message';
            }
        }, 300);
    }
}

function validateForm() {
    const errors = [];
    
    const nameValue = pathName.value.trim();
    if (!nameValue) {
        errors.push('❌ Name field is required - Please enter a name for your concept/subconcept');
    } else if (nameValue.length < 2) {
        errors.push(`📏 Name too short - Minimum 2 characters required (currently ${nameValue.length})`);
    } else if (nameValue.length > 50) {
        errors.push(`📏 Name too long - Maximum 50 characters allowed (currently ${nameValue.length})`);
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(nameValue)) {
        errors.push('🔤 Invalid characters in name - Only letters, numbers, spaces, hyphens, and underscores are allowed');
    }
    
    const descValue = pathDesc.value.trim();
    if (!descValue) {
        errors.push('❌ Description field is required - Please provide a description');
    } else if (descValue.length < 10) {
        errors.push(`📝 Description too short - Minimum 10 characters required (currently ${descValue.length})`);
    } else if (descValue.length > 200) {
        errors.push(`📝 Description too long - Maximum 200 characters allowed (currently ${descValue.length})`);
    }
    
    const difficultyValue = selectDiff.value;
    if (!difficultyValue || difficultyValue === '0') {
        errors.push('⚡ Difficulty level required - Please select a difficulty level (Beginner, Intermediate, Advanced, or Extreme)');
    }
    
    const selectedChoice = document.querySelector('input[name="add-options"]:checked');
    if (!selectedChoice) {
        errors.push('🎯 Type selection required - Please choose either "Concept" or "Sub-Concept"');
    }
    
    if (selectedChoice && selectedChoice.value === 'sub-concept' && pathConcepts.length === 0) {
        errors.push('🏗️ Cannot create Sub-Concept - You must create at least one main Concept first before adding Sub-Concepts');
    }
    
    if (selectedChoice && selectedChoice.value === 'sub-concept' && pathConcepts.length > 0) {
        const lastConcept = pathConcepts[pathConcepts.length - 1];
        if (lastConcept.subconcepts && lastConcept.subconcepts.length >= 10) {
            errors.push('📊 Sub-Concept limit reached - Each concept can have maximum 10 sub-concepts');
        }
    }
    
    return errors;
}

function checkForDuplicates(nameValue, isEditMode, editConceptName) {
    if (isEditMode && nameValue.toLowerCase() === editConceptName) {
        return { isDuplicate: false };
    }
    
    let duplicateInfo = { isDuplicate: false, type: '', name: '' };
    
    pathConcepts.forEach((concept) => {
        if (concept.conceptName === nameValue.toLowerCase()) {
            duplicateInfo = { 
                isDuplicate: true, 
                type: 'main concept', 
                name: concept.conceptName 
            };
        }
        if (concept.subconcepts) {
            concept.subconcepts.forEach((subconcept) => {
                if (subconcept.subconceptName === nameValue.toLowerCase()) {
                    duplicateInfo = { 
                        isDuplicate: true, 
                        type: 'sub-concept', 
                        name: subconcept.subconceptName,
                        parentConcept: concept.conceptName
                    };
                }
            });
        }
    });
    
    return duplicateInfo;
}

function handleCreateBtnClick() {
    const selectedChoiceElement = document.querySelector('input[name="add-options"]:checked');
    const selectedChoice = selectedChoiceElement ? selectedChoiceElement.value : null;
    const pathNameValue = pathName.value.trim();
    const isEditMode = sessionStorage.getItem('editMode') === 'true';
    const editConceptName = sessionStorage.getItem('editConceptName');
    const editConceptType = sessionStorage.getItem('editConceptType');
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
        if (validationErrors.length === 1) {
            showValidationMessage(validationErrors[0], 'error');
        } else {
            const errorList = validationErrors.map((error, index) => `${index + 1}. ${error}`).join('\n');
            showValidationMessage(`Multiple issues found:\n${errorList}`, 'error');
        }
        return;
    }
    
    const duplicateCheck = checkForDuplicates(pathNameValue, isEditMode, editConceptName);
    if (duplicateCheck.isDuplicate) {
        let duplicateMessage = '';
        if (duplicateCheck.type === 'main concept') {
            duplicateMessage = `🚫 Name already exists - A main concept named "${duplicateCheck.name}" already exists. Please choose a different name.`;
        } else if (duplicateCheck.type === 'sub-concept') {
            duplicateMessage = `🚫 Name already exists - A sub-concept named "${duplicateCheck.name}" already exists under the concept "${duplicateCheck.parentConcept}". Please choose a different name.`;
        }
        showValidationMessage(duplicateMessage, 'error');
        return;
    }
    
    let selectedOption = selectDiff.options[selectDiff.selectedIndex].value;
    switch (selectedOption) {
        case '0':
            console.log('You must select a difficulity');
            return;
        case '1':
            selectedOption = 'Beginner';
            break;
        case '2':
            selectedOption = 'Intermediate';
            break;
        case '3':
            selectedOption = 'Advanced';
            break;
        case '4':
            selectedOption = 'Extreme';
            break;
        default:
            showValidationMessage('Please select a valid difficulty level', 'error');
            return;
    }

    const resources = {
        pdfLink: pdfLink.value || '',
        articleLink: articleLink.value || '',
        ytIntroLink: ytIntroLink.value || '',
        ytPlaylistLink: ytPlaylistLink.value || '',
        ytFullvideoLink: ytFullvideoLink.value || ''
    };

    if (isEditMode) {
        if (editConceptType === 'concept') {
            const conceptIndex = pathConcepts.findIndex(concept => concept.conceptName === editConceptName);
            if (conceptIndex !== -1) {
                pathConcepts[conceptIndex].conceptName = pathNameValue.toLowerCase();
                pathConcepts[conceptIndex].conceptDesc = pathDesc.value;
                pathConcepts[conceptIndex].conceptStats.level = selectedOption;
                pathConcepts[conceptIndex].conceptStats.resources = resources;
            }
        } else {
            pathConcepts.forEach((concept) => {
                if (concept.subconcepts) {
                    const subconceptIndex = concept.subconcepts.findIndex(subconcept => subconcept.subconceptName === editConceptName);
                    if (subconceptIndex !== -1) {
                        concept.subconcepts[subconceptIndex].subconceptName = pathNameValue.toLowerCase();
                        concept.subconcepts[subconceptIndex].subconceptDesc = pathDesc.value;
                        concept.subconcepts[subconceptIndex].subconceptStats.level = selectedOption;
                        concept.subconcepts[subconceptIndex].subconceptStats.resources = resources;
                    }
                }
            });
        }
        
        sessionStorage.removeItem('editMode');
        sessionStorage.removeItem('editConceptName');
        sessionStorage.removeItem('editConceptType');
    } else {
        if (selectedChoice === 'concept') {
            pathConcepts.push({
                conceptName: pathNameValue.toLowerCase(),
                conceptDesc: pathDesc.value,
                conceptMindMap: '',
                conceptStats: {
                    masteryPercentage: 0,
                    level: selectedOption,
                    estimatedTime: '30 min',
                    prerequisites: [],
                    conceptTags: [],
                    status: 'Not Started',
                    paracticeSessions: 0,
                    solvedQuizzes: 0,
                    flashCardsReviewed: 0,
                    resources: resources,
                    notes: [],
                },
                subconcepts: []
            });
        } else {
            if (pathConcepts.length === 0) {
                console.log('You must create a concept first before adding subconcepts');
                return;
            }
            pathConcepts[pathConcepts.length - 1].subconcepts.push({
                subconceptName: pathNameValue.toLowerCase(),
                subconceptDesc: pathDesc.value,
                subconceptMindMap: '',
                subconceptStats: {
                    masteryPercentage: 0,
                    level: selectedOption,
                    estimatedTime: '30 min',
                    prerequisites: [],
                    conceptTags: [],
                    status: 'Not Started',
                    paracticeSessions: 0,
                    solvedQuizzes: 0,
                    flashCardsReviewed: 0,
                    resources: resources,
                    notes: [],
                }
            });
        }
    }

    pathName.value = '';
    pathDesc.value = '';
    selectDiff.value = '0';
    pdfLink.value = '';
    articleLink.value = '';
    ytIntroLink.value = '';
    ytPlaylistLink.value = '';
    ytFullvideoLink.value = '';

    pathObj.path = pathConcepts;
    let toSaveData = loadData('paths').map((path) => {
        return path.uuid === pathUUID ? path = pathObj : path = path;
    });
    saveData('paths', toSaveData);
    
    const actionText = isEditMode ? 'updated' : 'created';
    const itemType = selectedChoice === 'concept' ? 'Concept' : 'Sub-Concept';
    showValidationMessage(`${itemType} "${pathNameValue}" ${actionText} successfully!`, 'success');
    
    handleOutsideClick();
    renderPathConcepts();
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

function renderPathConcepts() {
    // The shape of the path array in the database inside the learning path
    // path: [
    //         {
    //             conceptName: 'Science',
    //             conceptMindMap: ['MindMap'],
    //             conceptStats: {
    //                 masteryPercentage: 55,
    //             },
    //             subconcepts: [{
    //                 subconceptName: 'Chemistry',
    //                 subconceptMindMap: ['MindMap'],
    //                 subconceptStats: {
    //                     masteryPercentage: 24,
    //                 }
    //             }]
    //         }
    //     ],
    pathObj = loadData('paths').filter((path) => {
        return path.uuid === pathUUID;
    })[0];
    pathConcepts = pathObj.path;

    pathTitle.textContent = pathObj.name;
    if (pathConcepts.length) {
        let innerHTML = []
        let iConcept = 0;
        pathConcepts.forEach((concept) => {
            if (iConcept > 0) innerHTML.push('<div class="line"></div>')
            innerHTML.push(`
                <div class="concept" id="${concept.conceptName}" role="button">
                    ${toTitleCase(concept.conceptName)}
                </div>
                `)
            concept.subconcepts.forEach((subconcept) => {
                innerHTML.push('<div class="line"></div>')
                innerHTML.push(`
                <div class="sub-concept" id="${subconcept.subconceptName}" role="button">
                    ${toTitleCase(subconcept.subconceptName)}
                </div>
                `)
            });
            iConcept++;
        });
        containerEl.innerHTML = innerHTML.join('');
    } else {
        containerEl.innerHTML = `
            <div class="default">
                <img src="AOTSquad.png">
                <div class="default-text">You have no Concepts, start by creating one!</div>
            </div>
        `
    }
    handleCloseConceptInfo();
}
