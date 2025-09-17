export function loadData(name) {
    try {
        const data = JSON.parse(localStorage.getItem(name));
        return data;
    } catch (err) {
        return `Error: ${err}`;
    }
}

export function saveData(name, item) {
    try {
        const data = JSON.stringify(item)
        localStorage.setItem(name, data);
        return 'Saved Successfully';
    } catch (err) {
        return `Error: ${err}`;
    }
}

//Example paths looking like

const paths = [
    {
        name: 'Anything seems good',
        description: 'description for anything seems good',
        uuid: '342234-423342-423342-324342-342423-342234',
        stats: {
            masteryPercentage: 76,
        },
        path: [
            {
                conceptName: 'Science',
                conceptDesc: '',
                conceptMindMap: ['MindMap'],
                conceptStats: {
                    masteryPercentage: 0,
                    level: 'Beginner',
                    estimatedTime: '30 min',
                    prerequisites: [],
                    conceptTags: [],
                    status: 'Not Started',
                    paracticeSessions: 0,
                    solvedQuizzes: 0,
                    flashCardsReviewed: 0,
                    resources: {
                        
                    },
                    notes: [],
                },
                subconcepts: [{
                    subconceptName: 'Chemistry',
                    subconceptMindMap: ['MindMap'],
                    subconceptStats: {
                        masteryPercentage: 24,
                    }
                }]
            }
        ],
    }
]