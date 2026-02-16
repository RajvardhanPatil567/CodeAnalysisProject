// contentScript.js - Injected into PDF viewer to handle highlighting
/* global chrome, browser, PDFViewerApplication */
// Use browser API if available, otherwise fall back to chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Keep track of highlights for cleanup
let highlights = [];

// Listen for messages from popup.js
browserAPI.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'highlight') {
        try {
            findAndHighlight(request.keywords);
            sendResponse({ success: true, count: highlights.length });
        } catch (error) {
            console.error('Highlighting error:', error);
            sendResponse({ success: false, error: error.message });
        }
    } else if (request.action === 'clear') {
        clearHighlights();
        sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async response
});

// Function to find and highlight keywords in the PDF
function findAndHighlight(keywords) {
    if (!keywords || !keywords.length) {
        console.warn('No keywords provided for highlighting');
        return;
    }

    // Clear any existing highlights first
    clearHighlights();
    
    // Try different methods to find text in PDF
    let foundMatches = false;
    
    // Method 1: Check for PDF.js viewer (common in Firefox and some Edge versions)
    if (typeof PDFViewerApplication !== 'undefined') {
        console.log('Using PDF.js viewer API');
        highlightWithPDFJS(keywords);
        foundMatches = true;
    }
    // Method 2: Check for Edge's built-in PDF viewer with different condition
    else if (document.querySelector('#viewer .textLayer')) {
        console.log('Using Edge PDF viewer API');
        highlightWithEdgeViewer(keywords);
        foundMatches = true;
    }
    // Method 3: Fallback to text layer search
    else {
        console.log('Using text layer search fallback');
        foundMatches = highlightWithTextLayer(keywords);
    }
    
    if (!foundMatches) {
        console.warn('No PDF viewer API detected. This extension requires a compatible PDF viewer.');
        throw new Error('Could not find a compatible PDF viewer. Try opening the PDF in Microsoft Edge.');
    }
}

// Highlight using PDF.js viewer API
function highlightWithPDFJS(keywords) {
    const pdfViewer = PDFViewerApplication.pdfViewer;
    const pages = pdfViewer._pages || [];
    
    keywords.forEach(keyword => {
        const searchTerm = keyword.trim();
        if (!searchTerm) return;
        
        pages.forEach(page => {
            const textLayer = page.textLayer;
            if (!textLayer) return;
            
            // Search for text in this page
            const textContent = textLayer.textContent;
            const searchResults = textContent.str.match(new RegExp(escapeRegExp(searchTerm), 'gi'));
            
            if (searchResults) {
                // Create highlight spans for each match
                const textDivs = textLayer.textDivs;
                textDivs.forEach((textDiv) => {
                    const text = textDiv.textContent || '';
                    if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
                        // Find the position of the match within this text node
                        const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
                        let match;
                        while ((match = regex.exec(text)) !== null) {
                            const before = text.substring(0, match.index);
                            const matchText = text.substring(match.index, match.index + searchTerm.length);
                            const after = text.substring(match.index + searchTerm.length);
                            
                            // Create a new span for the highlighted text
                            const highlightSpan = document.createElement('span');
                            highlightSpan.className = 'keyword-highlight';
                            highlightSpan.textContent = matchText;
                            highlightSpan.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
                            highlightSpan.style.borderRadius = '2px';
                            highlightSpan.style.pointerEvents = 'none';
                            highlightSpan.dataset.keyword = searchTerm;
                            
                            // Replace the text node with our highlighted version
                            const range = document.createRange();
                            range.selectNodeContents(textDiv);
                            range.deleteContents();
                            
                            if (before) range.insertNode(document.createTextNode(before));
                            range.insertNode(highlightSpan);
                            if (after) range.insertNode(document.createTextNode(after));
                            
                            highlights.push(highlightSpan);
                        }
                    }
                });
            }
        });
    });
}

// Highlight using Edge's built-in PDF viewer
function highlightWithEdgeViewer(keywords) {
    // This is a simplified version - Edge's PDF viewer API is not fully documented
    const viewer = document.querySelector('#viewer');
    if (!viewer) return false;
    
    keywords.forEach(keyword => {
        const searchTerm = keyword.trim().toLowerCase();
        if (!searchTerm) return;
        
        // Find all text elements that might contain our keyword
        const textElements = viewer.querySelectorAll('.textLayer > div');
        
        textElements.forEach(el => {
            const text = el.textContent || '';
            if (text.toLowerCase().includes(searchTerm)) {
                // Simple highlighting by wrapping the entire text node
                const highlightSpan = document.createElement('span');
                highlightSpan.className = 'keyword-highlight';
                highlightSpan.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
                highlightSpan.style.borderRadius = '2px';
                highlightSpan.style.pointerEvents = 'none';
                highlightSpan.dataset.keyword = searchTerm;
                
                // Replace the text node with our highlighted version
                el.parentNode.replaceChild(highlightSpan, el);
                highlightSpan.appendChild(el);
                
                highlights.push(highlightSpan);
            }
        });
    });
    
    return true;
}

// Fallback method using text layer search
function highlightWithTextLayer(keywords) {
    const textLayer = document.querySelector('.textLayer');
    if (!textLayer) return false;
    
    keywords.forEach(keyword => {
        const searchTerm = keyword.trim().toLowerCase();
        if (!searchTerm) return;
        
        // Create a tree walker to find all text nodes
        const walker = document.createTreeWalker(
            textLayer,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while ((node = walker.nextNode())) {
            const text = node.nodeValue;
            if (text.toLowerCase().includes(searchTerm)) {
                // Create a new span for the highlighted text
                const highlightSpan = document.createElement('span');
                highlightSpan.className = 'keyword-highlight';
                highlightSpan.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
                highlightSpan.style.borderRadius = '2px';
                highlightSpan.style.pointerEvents = 'none';
                highlightSpan.dataset.keyword = searchTerm;
                
                // Replace the text node with our highlighted version
                const parent = node.parentNode;
                const newText = document.createTextNode('');
                parent.replaceChild(newText, node);
                
                // Split the text and add the highlight
                const parts = text.split(new RegExp(`(${escapeRegExp(searchTerm)})`, 'i'));
                parts.forEach(part => {
                    if (part.toLowerCase() === searchTerm.toLowerCase()) {
                        const highlight = highlightSpan.cloneNode(false);
                        highlight.textContent = part;
                        newText.parentNode.insertBefore(highlight, newText.nextSibling);
                    } else if (part) {
                        newText.parentNode.insertBefore(document.createTextNode(part), newText.nextSibling);
                    }
                });
                
                // Remove the empty text node
                parent.removeChild(newText);
                
                highlights.push(highlightSpan);
            }
        }
    });
    
    return true;
}

// Helper function to escape regex special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to clear all highlights
function clearHighlights() {
    // Remove all highlight spans and restore original text
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
            // Move all children out of the highlight span
            while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
            }
            // Remove the now-empty highlight span
            parent.removeChild(highlight);
        }
    });
    
    // Clear the highlights array
    highlights = [];
    
    console.log('All highlights cleared');
}

// Add styles for highlights
const style = document.createElement('style');
style.textContent = `
    .keyword-highlight {
        background-color: rgba(255, 255, 0, 0.6) !important;
        border-radius: 2px;
        pointer-events: none;
    }
`;
document.head.appendChild(style);

console.log('PDF Keyword Highlighter content script loaded');
