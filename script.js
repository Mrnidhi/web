import { FileHandler } from './js/file-handler.js';
import { GitHubImporter } from './js/github-import.js';
import { Storage } from './js/storage.js';

// Initialize Pyodide
async function initPyodide() {
    try {
        // Show loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.hidden = false;
        }

        // Configure Pyodide
        const pyodideConfig = {
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
            fullStdLib: true,
            stdout: (msg) => {
                const outputDisplay = document.getElementById('outputDisplay');
                if (outputDisplay) {
                    outputDisplay.textContent += msg;
                }
            },
            stderr: (msg) => {
                const outputDisplay = document.getElementById('outputDisplay');
                if (outputDisplay) {
                    outputDisplay.textContent += `Error: ${msg}`;
                }
            }
        };

        // Load Pyodide
        window.pyodide = await loadPyodide(pyodideConfig);

        // Load required Python packages
        await window.pyodide.loadPackage(['numpy', 'matplotlib']);

        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.hidden = true;
        }

        console.log('Pyodide loaded successfully');
    } catch (error) {
        console.error('Failed to load Pyodide:', error);
        const outputDisplay = document.getElementById('outputDisplay');
        if (outputDisplay) {
            outputDisplay.textContent = 'Failed to load Python environment. Some features may be limited.';
        }
        
        // Hide loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.hidden = true;
        }
    }
}

// Initialize application
async function initApp() {
    try {
        await initPyodide();
        const fileHandler = new FileHandler();
        const githubImporter = new GitHubImporter(fileHandler);
        const storage = new Storage();
        
        // Initialize theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // Load saved files
        const savedFiles = localStorage.getItem('savedFiles');
        if (savedFiles) {
            try {
                const filesObj = JSON.parse(savedFiles);
                Object.entries(filesObj).forEach(([name, content]) => {
                    fileHandler.addFile(name, content);
                });
            } catch (error) {
                console.error('Failed to load saved files:', error);
            }
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Start the application
initApp();

// Theme management
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function toggleTheme() {
    body.classList.toggle('dark-theme');
    localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
    
    // Update Monaco Editor theme if it exists
    if (window.monaco) {
        const isDark = body.classList.contains('dark-theme');
        monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    }
}

themeToggle.addEventListener('click', toggleTheme);

// File management
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const saveButton = document.getElementById('saveButton');
const clearButton = document.getElementById('clearButton');

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.handleFiles(e.dataTransfer.files);
    }
});

uploadButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.handleFiles(e.target.files);
    }
});

// Save files
saveButton.addEventListener('click', () => {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.saveFiles();
    }
});

// Clear all files
clearButton.addEventListener('click', async () => {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        const confirmed = await fileHandler.showConfirmation(
            'Clear All Files',
            'Are you sure you want to clear all files? This action cannot be undone.'
        );
        if (confirmed) {
            fileHandler.clearFiles();
        }
    }
});

// GitHub import
const githubUrl = document.getElementById('githubUrl');
const importButton = document.getElementById('importButton');

importButton.addEventListener('click', async () => {
    const url = githubUrl.value.trim();
    if (!url) return;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const content = await response.text();
        const fileName = url.split('/').pop();
        const fileHandler = window.fileHandler;
        if (fileHandler) {
            fileHandler.addFile(fileName, content);
        }
    } catch (error) {
        console.error('Error importing from GitHub:', error);
        alert('Failed to import file from GitHub');
    }
});

// File handling functions
function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileHandler = window.fileHandler;
            if (fileHandler) {
                fileHandler.addFile(file.name, e.target.result);
            }
        };
        reader.readAsText(file);
    });
}

function addFile(name, content) {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.addFile(name, content);
    }
}

function updateFileList() {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.updateFileList();
    }
}

function displayFile(name) {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.displayFile(name);
    }
}

function displayMarkdown(content) {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.displayMarkdown(content);
    }
}

async function displayPython(content) {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.displayPython(content);
    }
}

function displayNotebook(content) {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.displayNotebook(content);
    }
}

// Save files to localStorage
saveButton.addEventListener('click', () => {
    const fileHandler = window.fileHandler;
    if (fileHandler) {
        fileHandler.saveFiles();
    }
});

// Load saved files on startup
const savedFiles = localStorage.getItem('savedFiles');
if (savedFiles) {
    const filesObj = JSON.parse(savedFiles);
    Object.entries(filesObj).forEach(([name, content]) => {
        addFile(name, content);
    });
} 