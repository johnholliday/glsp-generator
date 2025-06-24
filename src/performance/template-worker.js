/**
 * Worker thread for parallel template processing
 */
import { parentPort, isMainThread } from 'worker_threads';
import * as path from 'path';

// Only run if this is a worker thread
if (!isMainThread && parentPort) {
    parentPort.on('message', async (task) => {
        try {
            const result = await processTemplateInWorker(task.data);
            parentPort.postMessage({ data: result });
        } catch (error) {
            parentPort.postMessage({
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
}

/**
 * Process template in worker thread
 */
async function processTemplateInWorker(data) {
    const startTime = Date.now();
    const { template, context } = data;

    try {
        // Simulate template processing (in real implementation, use Handlebars)
        const processedContent = await renderTemplate(template, context);
        const outputPath = generateOutputPath(template, context);

        return {
            templateName: template.name,
            outputPath,
            content: processedContent,
            size: processedContent.length,
            duration: Date.now() - startTime
        };
    } catch (error) {
        throw new Error(`Failed to process template ${template.name}: ${error}`);
    }
}

/**
 * Render template with context (simplified)
 */
async function renderTemplate(template, context) {
    // In real implementation, this would use Handlebars
    // For now, simple placeholder replacement
    let content = template.content;

    // Replace basic placeholders
    content = content.replace(/\{\{projectName\}\}/g, context.projectName);
    content = content.replace(/\{\{grammarName\}\}/g, context.grammar?.grammarName || 'Grammar');

    return content;
}

/**
 * Generate output path for template
 */
function generateOutputPath(template, context) {
    const baseName = template.name.replace(/\.hbs$/, '');
    return path.join(context.outputDir, `${baseName}.ts`);
}