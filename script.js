// Initialize Pyodide
let pyodide = null;
async function initPyodide() {
    pyodide = await loadPyodide();
    console.log('Pyodide loaded successfully');
}

// Theme management
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function toggleTheme() {
    body.classList.toggle('dark-theme');
    localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
}

themeToggle.addEventListener('click', toggleTheme);

// File management
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const fileList = document.getElementById('fileList');
const contentDisplay = document.getElementById('contentDisplay');
const outputDisplay = document.getElementById('outputDisplay');
const saveButton = document.getElementById('saveButton');

let files = new Map();

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
    handleFiles(e.dataTransfer.files);
});

uploadButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
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
        addFile(fileName, content);
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
            addFile(file.name, e.target.result);
        };
        reader.readAsText(file);
    });
}

function addFile(name, content) {
    files.set(name, content);
    updateFileList();
    displayFile(name);
}

function updateFileList() {
    fileList.innerHTML = '';
    files.forEach((_, name) => {
        const li = document.createElement('li');
        li.textContent = name;
        li.addEventListener('click', () => displayFile(name));
        fileList.appendChild(li);
    });
}

function displayFile(name) {
    const content = files.get(name);
    if (!content) return;

    const extension = name.split('.').pop().toLowerCase();
    
    switch (extension) {
        case 'md':
            displayMarkdown(content);
            break;
        case 'py':
            displayPython(content);
            break;
        case 'ipynb':
            displayNotebook(content);
            break;
        default:
            contentDisplay.textContent = content;
    }
}

function displayMarkdown(content) {
    contentDisplay.innerHTML = marked.parse(content);
    hljs.highlightAll();
}

async function displayPython(content) {
    contentDisplay.innerHTML = `<pre><code class="language-python">${content}</code></pre>`;
    hljs.highlightAll();
    
    if (pyodide) {
        try {
            const result = await pyodide.runPythonAsync(content);
            outputDisplay.textContent = result !== undefined ? result : '';
        } catch (error) {
            outputDisplay.textContent = `Error: ${error.message}`;
        }
    }
}

function displayNotebook(content) {
    try {
        const notebook = JSON.parse(content);
        let html = '';
        
        notebook.cells.forEach(cell => {
            if (cell.cell_type === 'markdown') {
                html += marked.parse(cell.source.join(''));
            } else if (cell.cell_type === 'code') {
                html += `<pre><code class="language-python">${cell.source.join('')}</code></pre>`;
                if (cell.outputs && cell.outputs.length > 0) {
                    html += '<div class="notebook-output">';
                    cell.outputs.forEach(output => {
                        if (output.text) {
                            html += `<pre>${output.text.join('')}</pre>`;
                        }
                    });
                    html += '</div>';
                }
            }
        });
        
        contentDisplay.innerHTML = html;
        hljs.highlightAll();
    } catch (error) {
        contentDisplay.textContent = 'Error parsing notebook';
    }
}

// Save files to localStorage
saveButton.addEventListener('click', () => {
    const filesObj = {};
    files.forEach((content, name) => {
        filesObj[name] = content;
    });
    localStorage.setItem('savedFiles', JSON.stringify(filesObj));
    alert('Files saved successfully!');
});

// Load saved files on startup
const savedFiles = localStorage.getItem('savedFiles');
if (savedFiles) {
    const filesObj = JSON.parse(savedFiles);
    Object.entries(filesObj).forEach(([name, content]) => {
        addFile(name, content);
    });
}

// Initialize Pyodide
initPyodide(); 