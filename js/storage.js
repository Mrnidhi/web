/**
 * Storage module for handling file persistence and theme preferences
 */
export class Storage {
    constructor(fileHandler) {
        this.fileHandler = fileHandler;
        this.saveButton = document.getElementById('saveButton');
        this.themeToggle = document.getElementById('themeToggle');
        this.body = document.body;
        
        this.initializeEventListeners();
        this.loadSavedState();
    }

    initializeEventListeners() {
        this.saveButton.addEventListener('click', () => this.saveFiles());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Add tooltip to theme toggle
        this.themeToggle.title = this.body.classList.contains('dark-theme') 
            ? 'Switch to light mode' 
            : 'Switch to dark mode';
    }

    loadSavedState() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.body.classList.add('dark-theme');
            this.themeToggle.title = 'Switch to light mode';
        }

        // Load saved files
        const savedFiles = localStorage.getItem('savedFiles');
        if (savedFiles) {
            try {
                const filesObj = JSON.parse(savedFiles);
                Object.entries(filesObj).forEach(([name, content]) => {
                    this.fileHandler.addFile(name, content);
                });
            } catch (error) {
                console.error('Error loading saved files:', error);
            }
        }
    }

    saveFiles() {
        const filesObj = {};
        this.fileHandler.files.forEach((content, name) => {
            filesObj[name] = content;
        });
        
        try {
            localStorage.setItem('savedFiles', JSON.stringify(filesObj));
            this.showSuccess('Files saved successfully!');
        } catch (error) {
            console.error('Error saving files:', error);
            this.showError('Failed to save files: ' + error.message);
        }
    }

    toggleTheme() {
        this.body.classList.toggle('dark-theme');
        const isDark = this.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }

    showSuccess(message) {
        const modal = document.createElement('div');
        modal.className = 'modal success';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Success</h3>
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