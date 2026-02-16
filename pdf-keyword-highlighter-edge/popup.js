// popup.js - Handles the popup UI logic
/* global chrome, browser */
// Use browser API if available, otherwise fall back to chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('keywords');
    const highlightBtn = document.getElementById('highlight');
    const clearBtn = document.getElementById('clear');
    const statusEl = document.createElement('div');
    statusEl.className = 'status';
    document.querySelector('.container').appendChild(statusEl);

    // Show status message
    function showStatus(message, isError = false) {
        statusEl.textContent = message;
        statusEl.className = `status ${isError ? 'error' : 'success'}`;
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status';
        }, 3000);
    }

    // Load saved keywords from storage on popup open
    browserAPI.storage.local.get(['keywords'], function(result) {
        if (result.keywords && Array.isArray(result.keywords)) {
            textarea.value = result.keywords.join('\n');
        }
    });

    // Handle highlight button click
    highlightBtn.addEventListener('click', async function() {
        const keywordsText = textarea.value.trim();
        if (!keywordsText) {
            showStatus('Please enter at least one keyword.', true);
            return;
        }

        // Parse keywords: split by newline, trim, filter empty
        const keywords = keywordsText.split('\n')
            .map(k => k.trim())
            .filter(k => k.length > 0);

        if (keywords.length === 0) {
            showStatus('Please enter at least one keyword.', true);
            return;
        }

        try {
            // Save keywords to storage for persistence
            await browserAPI.storage.local.set({ keywords: keywords });
            
            // Get the active tab
            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            // Check if it's likely a PDF (basic check)
            if (!isPdfUrl(tab.url)) {
                showStatus('Please navigate to a PDF document first.', true);
                return;
            }

            try {
                // Execute the content script
                await browserAPI.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['contentScript.js']
                });
                
                // Send message to content script
                const response = await browserAPI.tabs.sendMessage(tab.id, {
                    action: 'highlight',
                    keywords: keywords
                });
                
                if (response && response.success) {
                    showStatus(`Highlighted ${keywords.length} keywords!`);
                } else {
                    showStatus('Failed to highlight keywords. Try again.', true);
                }
            } catch (error) {
                console.error('Content script error:', error);
                showStatus('Error highlighting PDF. Make sure you are viewing a PDF in Edge.', true);
            }
        } catch (error) {
            console.error('Popup error:', error);
            showStatus('An error occurred. Check console for details.', true);
        }
    });

    // Handle clear button click
    clearBtn.addEventListener('click', async function() {
        try {
            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            try {
                // Execute the content script
                await browserAPI.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['contentScript.js']
                });
                
                // Send clear message
                await browserAPI.tabs.sendMessage(tab.id, { action: 'clear' });
                showStatus('Highlights cleared!');
            } catch (error) {
                console.error('Clear highlights error:', error);
                showStatus('Error clearing highlights', true);
            }
        } catch (error) {
            console.error('Tab query error:', error);
            showStatus('Error accessing tab', true);
        }
    });

    // Helper function to check if URL is likely a PDF
    function isPdfUrl(url) {
        if (!url) return false;
        
        // Check for PDF extension or PDF viewer URL
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.pdf') || 
               lowerUrl.includes('pdf') ||
               lowerUrl.startsWith('blob:') ||
               lowerUrl.includes('microsoft-edge:') ||
               lowerUrl.includes('chrome-extension://')
    }
});
