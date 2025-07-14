/**
 * Copies a given string of text to the user's clipboard.
 *
 * @param {string} text The text string to copy.
 * @returns {Promise<void>} A promise that resolves if the text was successfully copied,
 *                          or rejects if an error occurred (e.g., permissions denied).
 */
export async function copyText(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Text successfully copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy text:', err);
        throw new Error('Failed to copy text to clipboard');
    }
}

/**
 * Downloads a string of text content as a file to the user's device.
 *
 * @param {string} content The text content to be downloaded.
 * @param {string} filename The desired name of the file (e.g., "my_document.txt", "data.json").
 * @param {string} [mimeType='text/plain'] The MIME type of the file (e.g., 'text/plain', 'application/json', 'text/csv').
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    // Create a Blob from the content with the specified MIME type
    const blob = new Blob([content], { type: mimeType });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; // Set the download filename

    // Append the anchor to the body (required for Firefox to click it programmatically)
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Clean up: remove the anchor and revoke the object URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`File "${filename}" download initiated.`);
}

/**
 * Formats a chat session for export as plain text
 */
export function formatChatForExport(messages: any[], title: string, agent: string): string {
    const timestamp = new Date().toLocaleString();
    let content = `Chat Export: ${title}\n`;
    content += `Agent: ${agent}\n`;
    content += `Exported: ${timestamp}\n`;
    content += `${'='.repeat(50)}\n\n`;

    messages.forEach((message, index) => {
        const role = message.role === 'user' ? 'User' : message.role === 'model' ? 'AI' : 'Error';
        content += `${role}:\n${message.content}\n\n`;
        
        if (message.imageUrls && message.imageUrls.length > 0) {
            content += `[Images: ${message.imageUrls.length} image(s) generated]\n\n`;
        }
    });

    return content;
}

/**
 * Formats a chat session for export as JSON
 */
export function formatChatForJsonExport(session: any, agent: string): string {
    const exportData = {
        title: session.title,
        agent: agent,
        exportedAt: new Date().toISOString(),
        messageCount: session.messages.length,
        messages: session.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            agent: msg.agent,
            imageUrls: msg.imageUrls || [],
            timestamp: new Date().toISOString()
        }))
    };

    return JSON.stringify(exportData, null, 2);
}