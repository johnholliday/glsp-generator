import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import * as https from 'https';
import * as http from 'http';

export interface ApiGeneratorResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

export class ApiClient {
    private apiUrl: string;
    private outputChannel: vscode.OutputChannel;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
        this.outputChannel = vscode.window.createOutputChannel('GLSP Generator API');
    }

    async generateTheiaApp(grammarPath: string, outputPath: string): Promise<ApiGeneratorResult> {
        try {
            const grammarContent = await fs.readFile(grammarPath);
            const grammarName = path.basename(grammarPath, '.langium');
            
            const formData = await this.createFormData({
                grammar: {
                    filename: path.basename(grammarPath),
                    content: grammarContent,
                    contentType: 'text/plain'
                },
                name: grammarName
            });

            const response = await this.postRequest('/generate/theia', formData.buffer, {
                'Content-Type': `multipart/form-data; boundary=${formData.boundary}`
            });

            if (response.statusCode === 200) {
                const zipPath = path.join(outputPath, `${grammarName}-theia.zip`);
                await fs.writeFile(zipPath, response.data);
                
                // Extract the zip file
                const extractPath = path.join(outputPath, `${grammarName}.theia`);
                await this.extractZip(zipPath, extractPath);
                await fs.unlink(zipPath); // Remove the zip file
                
                return { success: true, filePath: extractPath };
            } else {
                const error = JSON.parse(response.data.toString());
                return { success: false, error: error.error || 'Unknown error' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async validateGrammar(grammarPath: string): Promise<ApiGeneratorResult> {
        try {
            const grammarContent = await fs.readFile(grammarPath);
            
            const formData = await this.createFormData({
                grammar: {
                    filename: path.basename(grammarPath),
                    content: grammarContent,
                    contentType: 'text/plain'
                }
            });

            const response = await this.postRequest('/validate', formData.buffer, {
                'Content-Type': `multipart/form-data; boundary=${formData.boundary}`
            });

            const result = JSON.parse(response.data.toString());
            
            if (response.statusCode === 200 && result.valid) {
                this.outputChannel.appendLine('Grammar is valid');
                this.outputChannel.appendLine(result.output || '');
                return { success: true };
            } else {
                return { success: false, error: result.error || 'Validation failed' };
            }
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.getRequest('/health');
            return response.statusCode === 200;
        } catch {
            return false;
        }
    }

    private async createFormData(fields: Record<string, any>): Promise<{ buffer: Buffer; boundary: string }> {
        const boundary = `----WebKitFormBoundary${Math.random().toString(16).substring(2)}`;
        const parts: string[] = [];

        for (const [key, value] of Object.entries(fields)) {
            if (value && typeof value === 'object' && 'content' in value) {
                // File field
                parts.push(`--${boundary}`);
                parts.push(`Content-Disposition: form-data; name="${key}"; filename="${value.filename}"`);
                parts.push(`Content-Type: ${value.contentType || 'application/octet-stream'}`);
                parts.push('');
                parts.push(value.content.toString());
            } else {
                // Regular field
                parts.push(`--${boundary}`);
                parts.push(`Content-Disposition: form-data; name="${key}"`);
                parts.push('');
                parts.push(String(value));
            }
        }
        
        parts.push(`--${boundary}--`);
        
        return {
            buffer: Buffer.from(parts.join('\r\n')),
            boundary
        };
    }

    private async postRequest(path: string, data: Buffer, headers: Record<string, string> = {}): Promise<{ statusCode: number; data: Buffer }> {
        return new Promise((resolve, reject) => {
            const url = new URL(this.apiUrl + path);
            const protocol = url.protocol === 'https:' ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Length': data.length,
                    ...headers
                }
            };

            const req = protocol.request(options, (res) => {
                const chunks: Buffer[] = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode || 0,
                        data: Buffer.concat(chunks)
                    });
                });
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    private async getRequest(path: string): Promise<{ statusCode: number; data: Buffer }> {
        return new Promise((resolve, reject) => {
            const url = new URL(this.apiUrl + path);
            const protocol = url.protocol === 'https:' ? https : http;

            protocol.get(url, (res) => {
                const chunks: Buffer[] = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode || 0,
                        data: Buffer.concat(chunks)
                    });
                });
            }).on('error', reject);
        });
    }

    private async extractZip(zipPath: string, extractPath: string): Promise<void> {
        // For now, we'll save the zip and let the user extract it
        // In a real implementation, we'd use a zip library
        this.outputChannel.appendLine(`Theia app saved as zip: ${zipPath}`);
        this.outputChannel.appendLine(`Please extract it to: ${extractPath}`);
    }

    dispose() {
        this.outputChannel.dispose();
    }
}