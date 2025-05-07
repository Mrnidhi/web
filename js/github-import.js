/**
 * GitHub import module for handling repository and file imports
 */
export class GitHubImporter {
    constructor(fileHandler) {
        this.fileHandler = fileHandler;
        this.githubUrl = document.getElementById('githubUrl');
        this.importButton = document.getElementById('importButton');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.importButton.addEventListener('click', () => this.handleImport());
    }

    async handleImport() {
        const url = this.githubUrl.value.trim();
        if (!url) return;

        try {
            if (url.includes('/blob/')) {
                await this.importFile(url);
            } else if (url.includes('/tree/')) {
                await this.importDirectory(url);
            } else {
                throw new Error('Invalid GitHub URL format');
            }
        } catch (error) {
            console.error('Error importing from GitHub:', error);
            this.showError('Failed to import from GitHub: ' + error.message);
        }
    }

    async importFile(url) {
        const rawUrl = this.convertToRawUrl(url);
        const response = await fetch(rawUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const content = await response.text();
        const fileName = url.split('/').pop();
        
        // Show preview before importing
        const shouldImport = await this.showPreview(fileName, content);
        if (shouldImport) {
            this.fileHandler.addFile(fileName, content);
        }
    }

    async importDirectory(url) {
        const apiUrl = this.convertToApiUrl(url);
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch directory contents');
        
        const data = await response.json();
        const files = data.filter(item => 
            item.type === 'file' && 
            ['.ipynb', '.py', '.md'].includes(this.getFileExtension(item.name))
        );

        for (const file of files) {
            const rawUrl = file.download_url;
            const content = await fetch(rawUrl).then(r => r.text());
            
            // Show preview before importing
            const shouldImport = await this.showPreview(file.name, content);
            if (shouldImport) {
                this.fileHandler.addFile(file.name, content);
            }
        }
    }

    convertToRawUrl(url) {
        return url.replace('/blob/', '/raw/');
    }

    convertToApiUrl(url) {
        const parts = url.split('/');
        const owner = parts[3];
        const repo = parts[4];
        const branch = parts[6];
        const path = parts.slice(7).join('/');
        return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    }

    getFileExtension(filename) {
        return '.' + filename.split('.').pop().toLowerCase();
    }

    async showPreview(fileName, content) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            
            const extension = this.getFileExtension(fileName);
            let previewContent = '';
            
            if (extension === '.md') {
                previewContent = marked.parse(content);
            } else if (extension === '.py') {
                previewContent = `<pre><code class="language-python">${content}</code></pre>`;
            } else if (extension === '.ipynb') {
                try {
                    const notebook = JSON.parse(content);
                    previewContent = this.previewNotebook(notebook);
                } catch (error) {
                    previewContent = 'Error parsing notebook';
                }
            }
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Preview: ${fileName}</h3>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${previewContent}
                    </div>
                    <div class="modal-footer">
                        <button class="import-button">Import</button>
                        <button class="cancel-button">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.close-button').onclick = () => {
                modal.remove();
                resolve(false);
            };
            
            modal.querySelector('.import-button').onclick = () => {
                modal.remove();
                resolve(true);
            };
            
            modal.querySelector('.cancel-button').onclick = () => {
                modal.remove();
                resolve(false);
            };
            
            hljs.highlightAll();
        });
    }

    previewNotebook(notebook) {
        let html = '';
        notebook.cells.slice(0, 3).forEach(cell => {
            if (cell.cell_type === 'markdown') {
                html += marked.parse(cell.source.join(''));
            } else if (cell.cell_type === 'code') {
                html += `<pre><code class="language-python">${cell.source.join('')}</code></pre>`;
            }
        });
        
        if (notebook.cells.length > 3) {
            html += '<p>... (more cells not shown)</p>';
        }
        
        return html;
    }

    showError(message) {
        const modal = document.createElement('div');
        modal.className = 'modal error';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Error</h3>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="ok-button">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-button').onclick = () => modal.remove();
        modal.querySelector('.ok-button').onclick = () => modal.remove();
    }
} 