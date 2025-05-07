# Code Viewer & Executor

A web application that allows users to upload, view, and execute various types of code files. Built with HTML, CSS, and JavaScript.

## Features

- **File Upload Support**
  - Drag and drop interface
  - Multiple file selection
  - Supports `.ipynb`, `.py`, and `.md` files

- **GitHub Integration**
  - Import files directly from GitHub repositories
  - Paste GitHub raw file URLs to load content

- **Code Execution**
  - Python code execution using Pyodide
  - Real-time output display
  - Support for Jupyter notebook cells

- **Markdown Rendering**
  - Syntax highlighting for code blocks
  - Full Markdown support using marked.js
  - Clean and readable formatting

- **Theme Support**
  - Light and dark theme options
  - Theme preference saved in localStorage
  - Smooth theme transitions

- **File Management**
  - Local storage for saving files
  - File list with easy navigation
  - Persistent storage across sessions

## Usage

1. **Uploading Files**
   - Drag and drop files into the drop zone
   - Click "Choose Files" to select files manually
   - Paste a GitHub raw file URL and click "Import from GitHub"

2. **Viewing Files**
   - Click on any file in the file list to view its contents
   - Markdown files are rendered with proper formatting
   - Python files are displayed with syntax highlighting

3. **Executing Python Code**
   - Python files are automatically executed using Pyodide
   - Output is displayed below the code
   - Errors are shown in the output area

4. **Managing Files**
   - Click "Save Files" to store files in localStorage
   - Files are automatically loaded when you return to the page
   - Toggle between light and dark themes using the theme button

## Technical Details

- Built with vanilla JavaScript
- Uses Pyodide for Python execution
- Marked.js for Markdown rendering
- Highlight.js for code syntax highlighting
- LocalStorage for file persistence
- Responsive design for all screen sizes

## Browser Support

The application works best in modern browsers that support:
- ES6+ JavaScript features
- LocalStorage API
- File API
- Drag and Drop API

## Limitations

- Python execution is limited to Pyodide's capabilities
- Large files may impact performance
- LocalStorage has a size limit (usually 5-10 MB)
- GitHub imports require raw file URLs

## License

MIT License 