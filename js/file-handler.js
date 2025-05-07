/**
 * File handling module for managing file uploads and processing
 */
export class FileHandler {
    constructor() {
        this.files = new Map();
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.uploadButton = document.getElementById('uploadButton');
        this.fileList = document.getElementById('fileList');
        this.contentDisplay = document.getElementById('contentDisplay');
        this.outputDisplay = document.getElementById('outputDisplay');
        this.editor = null;
        
        this.initializeEventListeners();
        this.initializeMonacoEditor();
    }

    initializeEventListeners() {
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.uploadButton.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
    }

    async initializeMonacoEditor() {
        try {
            await new Promise((resolve, reject) => {
                require(['vs/editor/editor.main'], (monaco) => {
                    this.editor = monaco.editor.create(this.contentDisplay, {
                        value: '',
                        language: 'python',
                        theme: document.body.classList.contains('dark-theme') ? 'vs-dark' : 'vs',
                        automaticLayout: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        tabSize: 4,
                        wordWrap: 'on'
                    });
                    resolve();
                }, reject);
            });
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            // Fallback to basic text display
            this.contentDisplay.innerHTML = '<div class="error">Failed to load code editor. Using basic text display.</div>';
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave() {
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        this.handleFiles(e.dataTransfer.files);
    }

    async handleFiles(fileList) {
        for (const file of Array.from(fileList)) {
            if (this.files.has(file.name)) {
                const shouldOverwrite = await this.showDuplicateFileDialog(file.name);
                if (!shouldOverwrite) continue;
            }
            
            const content = await this.readFile(file);
            this.addFile(file.name, content);
        }
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    addFile(name, content) {
        this.files.set(name, content);
        this.updateFileList();
        this.displayFile(name);
    }

    updateFileList() {
        this.fileList.innerHTML = '';
        this.files.forEach((_, name) => {
            const li = document.createElement('li');
            li.textContent = name;
            li.addEventListener('click', () => this.displayFile(name));
            this.fileList.appendChild(li);
        });
    }

    async displayFile(name) {
        const content = this.files.get(name);
        if (!content) return;

        const extension = name.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'md':
                await this.displayMarkdown(content);
                break;
            case 'py':
                await this.displayPython(content);
                break;
            case 'ipynb':
                await this.displayNotebook(content);
                break;
            default:
                this.contentDisplay.textContent = content;
        }
    }

    async displayMarkdown(content) {
        this.contentDisplay.innerHTML = marked.parse(content);
        hljs.highlightAll();
    }

    async displayPython(content) {
        if (this.editor) {
            this.editor.setValue(content);
            this.editor.updateOptions({ language: 'python' });
        } else {
            this.contentDisplay.innerHTML = `<pre><code class="language-python">${content}</code></pre>`;
            hljs.highlightAll();
        }
        
        if (window.pyodide) {
            try {
                const result = await window.pyodide.runPythonAsync(content);
                this.outputDisplay.textContent = result !== undefined ? result : '';
            } catch (error) {
                this.outputDisplay.textContent = `Error: ${error.message}`;
            }
        }
    }

    async displayNotebook(content) {
        try {
            const notebook = JSON.parse(content);
            let html = '';
            
            for (const cell of notebook.cells) {
                const cellElement = document.createElement('div');
                cellElement.className = 'notebook-cell';
                
                if (cell.cell_type === 'markdown') {
                    cellElement.innerHTML = marked.parse(cell.source.join(''));
                } else if (cell.cell_type === 'code') {
                    const codeElement = document.createElement('pre');
                    codeElement.innerHTML = `<code class="language-python">${cell.source.join('')}</code>`;
                    
                    const runButton = document.createElement('button');
                    runButton.textContent = 'Run Cell';
                    runButton.className = 'run-cell-button';
                    runButton.onclick = () => this.runNotebookCell(cell.source.join(''));
                    
                    cellElement.appendChild(codeElement);
                    cellElement.appendChild(runButton);
                    
                    if (cell.outputs && cell.outputs.length > 0) {
                        const outputElement = document.createElement('div');
                        outputElement.className = 'notebook-output';
                        cell.outputs.forEach(output => {
                            if (output.text) {
                                outputElement.innerHTML += `<pre>${output.text.join('')}</pre>`;
                            }
                        });
                        cellElement.appendChild(outputElement);
                    }
                }
                
                html += cellElement.outerHTML;
            }
            
            this.contentDisplay.innerHTML = html;
            hljs.highlightAll();
        } catch (error) {
            this.contentDisplay.textContent = 'Error parsing notebook';
        }
    }

    async runNotebookCell(code) {
        if (!window.pyodide) return;
        
        try {
            const result = await window.pyodide.runPythonAsync(code);
            const outputElement = document.createElement('div');
            outputElement.className = 'notebook-output';
            outputElement.innerHTML = `<pre>${result !== undefined ? result : ''}</pre>`;
            
            const cellElement = event.target.closest('.notebook-cell');
            const existingOutput = cellElement.querySelector('.notebook-output');
            if (existingOutput) {
                existingOutput.remove();
            }
            cellElement.appendChild(outputElement);
        } catch (error) {
            const outputElement = document.createElement('div');
            outputElement.className = 'notebook-output error';
            outputElement.innerHTML = `<pre>Error: ${error.message}</pre>`;
            
            const cellElement = event.target.closest('.notebook-cell');
            const existingOutput = cellElement.querySelector('.notebook-output');
            if (existingOutput) {
                existingOutput.remove();
            }
            cellElement.appendChild(outputElement);
        }
    }

    async showDuplicateFileDialog(fileName) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>File Already Exists</h3>
                    <p>The file "${fileName}" already exists. What would you like to do?</p>
                    <div class="modal-buttons">
                        <button class="overwrite">Overwrite</button>
                        <button class="rename">Rename</button>
                        <button class="skip">Skip</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.overwrite').onclick = () => {
                modal.remove();
                resolve(true);
            };
            
            modal.querySelector('.rename').onclick = () => {
                const newName = prompt('Enter new file name:', fileName);
                if (newName) {
                    this.files.set(newName, this.files.get(fileName));
                    this.files.delete(fileName);
                }
                modal.remove();
                resolve(false);
            };
            
            modal.querySelector('.skip').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    }
} 