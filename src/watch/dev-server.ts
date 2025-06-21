import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

export class DevServer {
    private app: express.Application;
    private server?: Server;
    private wss?: WebSocketServer;
    private clients: Set<WebSocket> = new Set();
    private lastError?: string;

    constructor(
        private rootDir: string,
        private port: number = 3000
    ) {
        this.app = express();
        this.setupMiddleware();
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Create HTTP server
                this.server = createServer(this.app);
                
                // Create WebSocket server for live reload
                this.wss = new WebSocketServer({ server: this.server });
                
                this.wss.on('connection', (ws) => {
                    this.clients.add(ws);
                    
                    // Send current status
                    if (this.lastError) {
                        ws.send(JSON.stringify({ type: 'error', message: this.lastError }));
                    } else {
                        ws.send(JSON.stringify({ type: 'connected' }));
                    }
                    
                    ws.on('close', () => {
                        this.clients.delete(ws);
                    });
                    
                    ws.on('error', (error) => {
                        console.error('WebSocket error:', error);
                        this.clients.delete(ws);
                    });
                });
                
                // Start server
                this.server.listen(this.port, () => {
                    console.log(chalk.green(`✅ Development server started on port ${this.port}`));
                    resolve();
                });
                
                this.server.on('error', (error: any) => {
                    if (error.code === 'EADDRINUSE') {
                        console.error(chalk.red(`❌ Port ${this.port} is already in use`));
                    } else {
                        console.error(chalk.red('Server error:'), error);
                    }
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async stop(): Promise<void> {
        // Close all WebSocket connections
        this.clients.forEach(client => {
            client.close();
        });
        this.clients.clear();
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.server) {
            return new Promise((resolve) => {
                this.server!.close(() => {
                    console.log(chalk.yellow('Development server stopped'));
                    resolve();
                });
            });
        }
    }

    notifyReload(): void {
        this.lastError = undefined;
        this.broadcast({ type: 'reload' });
    }

    notifyError(message: string): void {
        this.lastError = message;
        this.broadcast({ type: 'error', message });
    }

    private broadcast(data: any): void {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    private setupMiddleware(): void {
        // Serve static files from the output directory
        this.app.use(express.static(this.rootDir));
        
        // Inject live reload script
        this.app.use((req, res, next) => {
            if (req.path.endsWith('.html')) {
                const filePath = path.join(this.rootDir, req.path);
                
                fs.readFile(filePath, 'utf-8', (err, content) => {
                    if (err) {
                        next();
                        return;
                    }
                    
                    // Inject live reload script before </body>
                    const script = this.getLiveReloadScript();
                    const modifiedContent = content.replace('</body>', `${script}</body>`);
                    
                    res.type('html').send(modifiedContent);
                });
            } else {
                next();
            }
        });
        
        // Error overlay endpoint
        this.app.get('/__dev-server/overlay.js', (req, res) => {
            res.type('application/javascript').send(this.getErrorOverlayScript());
        });
        
        // Health check
        this.app.get('/__dev-server/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                error: this.lastError || null,
                clients: this.clients.size 
            });
        });
        
        // Fallback to index.html for SPA routing
        this.app.get('*', (req, res) => {
            const indexPath = path.join(this.rootDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).send('Not found');
            }
        });
    }

    private getLiveReloadScript(): string {
        return `
<script>
(function() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(protocol + '//' + window.location.host);
    let errorOverlay = null;
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'reload') {
            console.log('🔄 Reloading...');
            window.location.reload();
        } else if (data.type === 'error') {
            showError(data.message);
        } else if (data.type === 'connected') {
            console.log('✅ Connected to development server');
            hideError();
        }
    };
    
    ws.onclose = function() {
        console.log('❌ Lost connection to development server');
        setTimeout(() => window.location.reload(), 2000);
    };
    
    function showError(message) {
        if (!errorOverlay) {
            errorOverlay = document.createElement('div');
            errorOverlay.id = 'dev-server-error';
            errorOverlay.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                color: #ff6b6b;
                padding: 20px;
                font-family: monospace;
                font-size: 14px;
                overflow: auto;
                z-index: 999999;
                white-space: pre-wrap;
            \`;
            document.body.appendChild(errorOverlay);
        }
        
        errorOverlay.innerHTML = \`
            <h2 style="color: #ff6b6b; margin-top: 0;">⚠️ Generation Error</h2>
            <pre style="color: #fff;">\${message}</pre>
            <p style="color: #aaa; margin-top: 20px;">Fix the error and save to reload.</p>
        \`;
    }
    
    function hideError() {
        if (errorOverlay) {
            errorOverlay.remove();
            errorOverlay = null;
        }
    }
})();
</script>
`;
    }

    private getErrorOverlayScript(): string {
        // Additional error overlay functionality if needed
        return '';
    }
}