import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import archiver from 'archiver';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: '/tmp/uploads' });

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: process.env.npm_package_version || '2.1.171',
    endpoints: [
      'POST /generate/theia',
      'POST /validate',
      'GET /health'
    ]
  });
});

// Generate full Theia application
app.post('/generate/theia', upload.single('grammar'), async (req, res) => {
  const tempWorkspace = path.join('/tmp', `theia-gen-${Date.now()}`);
  let originalGrammarPath: string | undefined;
  
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No grammar file provided' });
      return;
    }

    originalGrammarPath = req.file.path;
    let grammarName = req.body.name || path.basename(req.file.originalname, '.langium');
    
    // Try to extract grammar name from content
    try {
      const grammarContent = await fs.readFile(originalGrammarPath, 'utf-8');
      const grammarMatch = grammarContent.match(/^\s*grammar\s+(\w+)/m);
      if (grammarMatch) {
        grammarName = grammarMatch[1];
        console.log(`Extracted grammar name from content: ${grammarName}`);
      }
    } catch (err) {
      console.warn('Could not extract grammar name from content, using filename');
    }
    
    // Copy grammar file with proper name
    const grammarPath = path.join(tempWorkspace, `${grammarName}.langium`);
    
    // Create temp workspace
    await fs.ensureDir(tempWorkspace);
    await fs.copy(originalGrammarPath, grammarPath);
    
    // Run generator
    const generatorProcess = spawn('node', [
      path.join(__dirname, 'cli.js'),
      'generate',
      grammarPath,
      '-o', tempWorkspace,
      '-n', grammarName
    ]);

    let output = '';
    let error = '';

    generatorProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    generatorProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    await new Promise((resolve, reject) => {
      generatorProcess.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          const fullOutput = output + error;
          reject(new Error(`Generator failed with code ${code}: ${fullOutput}`));
        }
      });
    });

    // Create zip of the generated Theia app
    const zipPath = path.join('/tmp', `${grammarName}-theia.zip`);
    await createZip(tempWorkspace, zipPath);
    
    res.download(zipPath, `${grammarName}-theia.zip`, async (err) => {
      // Cleanup
      await fs.remove(tempWorkspace);
      if (originalGrammarPath) await fs.remove(originalGrammarPath);
      await fs.remove(zipPath);
    });
    
  } catch (error: any) {
    // Cleanup on error
    await fs.remove(tempWorkspace).catch(() => {});
    if (originalGrammarPath) await fs.remove(originalGrammarPath).catch(() => {});
    
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
});

// Validate grammar
app.post('/validate', upload.single('grammar'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No grammar file provided' });
      return;
    }

    const grammarPath = req.file.path;
    const tempOutput = path.join('/tmp', `validate-${Date.now()}`);
    
    // Run generator with minimal output
    const generatorProcess = spawn('node', [
      path.join(__dirname, 'cli.js'),
      'generate',
      grammarPath,
      '-o', tempOutput,
      '--no-vscode',
      '--no-glsp',
      '--no-model-server'
    ]);

    let output = '';
    let error = '';

    generatorProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    generatorProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    await new Promise((resolve, reject) => {
      generatorProcess.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Validation failed: ${error}`));
        }
      });
    });

    // Cleanup
    await fs.remove(grammarPath);
    await fs.remove(tempOutput);
    
    res.json({ 
      valid: true,
      message: 'Grammar is valid',
      output: output 
    });
    
  } catch (error: any) {
    if (req.file) await fs.remove(req.file.path).catch(() => {});
    
    res.status(400).json({ 
      valid: false,
      error: error.message,
      details: error.stack 
    });
  }
});

// Helper functions
async function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Start server
const port = process.env.PORT || process.env.API_PORT || 51620;
app.listen(port, () => {
  console.log(`GLSP Generator API running on port ${port}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /generate/theia');
  console.log('  POST /validate');
});