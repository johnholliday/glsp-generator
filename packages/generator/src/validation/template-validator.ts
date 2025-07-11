// This is a wrapper to expose the validation functions for testing
// The actual implementation remains in scripts/validate-templates.js

export interface ValidationError {
  file: string;
  line: number;
  pattern: string;
  message: string;
  context?: string;
}

export interface ValidationWarning {
  file: string;
  line: number | 0;
  pattern: string;
  message: string;
  context?: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ProhibitedPattern {
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

export interface PackageJsonCheck {
  check: (content: string) => boolean;
  message: string;
  severity: 'error' | 'warning';
}

// Re-export the validation patterns for testing
export const prohibitedPatterns: ProhibitedPattern[] = [
  {
    pattern: /workspace:\*/g,
    message: 'Workspace protocol is not supported in Yarn 1.22',
    severity: 'error'
  },
  {
    pattern: /\.yarnrc\.yml/g,
    message: 'Berry config file (.yarnrc.yml) reference found',
    severity: 'error'
  },
  {
    pattern: /yarn dlx/g,
    message: 'Berry-specific command "yarn dlx" found (use npx instead)',
    severity: 'error'
  },
  {
    pattern: /pnpMode/g,
    message: 'PnP configuration found',
    severity: 'error'
  },
  {
    pattern: /pnpIgnorePattern/g,
    message: 'PnP specific pattern found',
    severity: 'error'
  },
  {
    pattern: /packageManager/g,
    message: 'Corepack field "packageManager" found',
    severity: 'error'
  },
  {
    pattern: /nodeLinker:/g,
    message: 'Yarn Berry nodeLinker configuration found',
    severity: 'error'
  },
  {
    pattern: /enableGlobalCache:/g,
    message: 'Yarn Berry cache configuration found',
    severity: 'error'
  },
  {
    pattern: /nmMode:/g,
    message: 'Yarn Berry nmMode configuration found',
    severity: 'error'
  },
  {
    pattern: /\.pnp\.cjs/g,
    message: 'PnP loader reference found',
    severity: 'error'
  },
  {
    pattern: /\.pnp\.mjs/g,
    message: 'PnP ESM loader reference found',
    severity: 'error'
  },
  {
    pattern: /yarn workspaces/g,
    message: 'Yarn workspaces command found (verify compatibility)',
    severity: 'warning'
  }
];

export const packageJsonChecks: PackageJsonCheck[] = [
  {
    check: (content: string) => content.includes('"workspaces"'),
    message: 'Workspaces field found - ensure it uses Yarn 1.x syntax',
    severity: 'warning'
  },
  {
    check: (content: string) => content.includes('"resolutions"'),
    message: 'Resolutions field found - verify Yarn 1.x compatibility',
    severity: 'warning'
  }
];

// Mock implementations for testing
export async function scanFile(filePath: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  try {
    const fs = await import('fs-extra');
    const path = await import('path');
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check each prohibited pattern
    prohibitedPatterns.forEach(({ pattern, message, severity }) => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern);
        if (matches) {
          const issue = {
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            pattern: pattern.source,
            message,
            context: line.trim()
          };
          
          if (severity === 'error') {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      });
    });
    
    // Additional checks for package.json templates
    if (filePath.endsWith('package-json.hbs') || filePath.endsWith('package.json.hbs')) {
      packageJsonChecks.forEach(({ check, message, severity }) => {
        if (check(content)) {
          const issue = {
            file: path.relative(process.cwd(), filePath),
            line: 0,
            pattern: 'custom check',
            message
          };
          
          if (severity === 'error') {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      });
    }
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, (error as Error).message);
  }
  
  return { errors, warnings };
}

export async function findTemplateFiles(dir: string): Promise<string[]> {
  const fs = await import('fs-extra');
  const path = await import('path');
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.hbs')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}