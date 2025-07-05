#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Debug script for GLSP extension generation and testing
.DESCRIPTION
    Generates a GLSP extension from the statemachine.langium grammar and optionally launches VSCode for debugging
.PARAMETER Watch
    Enable watch mode to regenerate on template changes
.PARAMETER NoLaunch
    Skip launching VSCode after generation
.PARAMETER Clean
    Clean output directory before generation
.EXAMPLE
    .\debug.ps1
    .\debug.ps1 -Watch
    .\debug.ps1 -Clean -NoLaunch
#>

param(
    [switch]$Watch,
    [switch]$NoLaunch,
    [switch]$Clean = $true
)

# Colors for output
$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n==> $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠ $Message" "Yellow"
}

# Configuration
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "../..")
$grammarFile = Join-Path $scriptDir "statemachine.langium"
$outputDir = Join-Path $scriptDir "output"
$generatorCli = Join-Path $projectRoot "dist/cli.js"

# Check prerequisites
Write-Step "Checking prerequisites..."

if (-not (Test-Path $generatorCli)) {
    Write-Error "Generator CLI not found at: $generatorCli"
    Write-Warning "Please run 'yarn build' in the project root first"
    exit 1
}

if (-not (Test-Path $grammarFile)) {
    Write-Error "Grammar file not found at: $grammarFile"
    exit 1
}

# Check if node is available
try {
    $nodeVersion = node --version
    Write-Success "Node.js $nodeVersion found"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

# Clean output directory if requested
if ($Clean -and (Test-Path $outputDir)) {
    Write-Step "Cleaning output directory..."
    try {
        Remove-Item -Recurse -Force $outputDir
        Write-Success "Output directory cleaned"
    } catch {
        Write-Warning "Failed to clean output directory: $_"
    }
}

# Function to generate the extension
function Invoke-Generate {
    Write-Step "Generating GLSP extension..."
    Write-Host "Grammar: $grammarFile"
    Write-Host "Output: $outputDir"
    
    try {
        # Run the generator
        $generateProcess = Start-Process -FilePath "node" `
            -ArgumentList @($generatorCli, "generate", $grammarFile, "-o", $outputDir) `
            -NoNewWindow -PassThru -Wait `
            -RedirectStandardOutput "$scriptDir/generate-output.log" `
            -RedirectStandardError "$scriptDir/generate-error.log"
        
        if ($generateProcess.ExitCode -eq 0) {
            Write-Success "Generation completed successfully"
            
            # Show generated files count
            $fileCount = (Get-ChildItem -Path $outputDir -Recurse -File | Measure-Object).Count
            Write-Host "Generated $fileCount files"
            
            return $true
        } else {
            Write-Error "Generation failed with exit code: $($generateProcess.ExitCode)"
            
            # Show error output if available
            if (Test-Path "$scriptDir/generate-error.log") {
                $errorContent = Get-Content "$scriptDir/generate-error.log" -Raw
                if ($errorContent) {
                    Write-Host "`nError output:" -ForegroundColor Red
                    Write-Host $errorContent
                }
            }
            
            return $false
        }
    } catch {
        Write-Error "Failed to run generator: $_"
        return $false
    } finally {
        # Clean up log files
        Remove-Item -Path "$scriptDir/generate-*.log" -Force -ErrorAction SilentlyContinue
    }
}

# Function to launch VSCode
function Invoke-VSCodeDebug {
    Write-Step "Launching VSCode for debugging..."
    
    # Check if code command is available
    try {
        $codeVersion = code --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw }
    } catch {
        Write-Warning "VSCode 'code' command not found in PATH"
        Write-Host "You can manually open the output directory in VSCode: $outputDir"
        return
    }
    
    # Create a simple launch.json if it doesn't exist
    $vscodeDir = Join-Path $outputDir ".vscode"
    $launchJson = Join-Path $vscodeDir "launch.json"
    
    if (-not (Test-Path $vscodeDir)) {
        New-Item -ItemType Directory -Path $vscodeDir -Force | Out-Null
    }
    
    if (-not (Test-Path $launchJson)) {
        $launchConfig = @'
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug GLSP Server",
            "skipFiles": ["<node_internals>/**"],
            "program": "${workspaceFolder}/server/server-module.js",
            "outFiles": ["${workspaceFolder}/**/*.js"],
            "sourceMaps": true,
            "console": "integratedTerminal"
        }
    ]
}
'@
        Set-Content -Path $launchJson -Value $launchConfig
    }
    
    # Open in VSCode
    try {
        code $outputDir
        Write-Success "VSCode launched"
    } catch {
        Write-Warning "Failed to launch VSCode: $_"
    }
}

# Function to watch for changes
function Start-WatchMode {
    Write-Step "Starting watch mode..."
    Write-Host "Watching for changes in:"
    Write-Host "  - Grammar file: $grammarFile"
    Write-Host "  - Templates directory: $projectRoot/templates"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop watching"
    
    # Create file watcher
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $projectRoot
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    
    # Define what to watch
    $watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite
    
    # Define the action
    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $changeType = $Event.SourceEventArgs.ChangeType
        
        # Check if the change is relevant
        if ($path -like "*statemachine.langium" -or $path -like "*templates*") {
            Write-Host "`n"
            Write-ColorOutput "File changed: $path" "Yellow"
            
            # Small delay to ensure file write is complete
            Start-Sleep -Milliseconds 500
            
            # Regenerate
            if (Invoke-Generate) {
                Write-Success "Regeneration complete"
            }
        }
    }
    
    # Register event handlers
    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
    
    try {
        # Keep the script running
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } finally {
        # Clean up
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
        Get-EventSubscriber | Unregister-Event
    }
}

# Main execution
Write-ColorOutput @"
GLSP Extension Debug Script
==========================
Project Root: $projectRoot
Grammar: $grammarFile
Output: $outputDir
"@ "Magenta"

# Generate the extension
$generateSuccess = Invoke-Generate

if ($generateSuccess) {
    # Launch VSCode if not disabled
    if (-not $NoLaunch) {
        Invoke-VSCodeDebug
    }
    
    # Start watch mode if requested
    if ($Watch) {
        Start-WatchMode
    }
} else {
    Write-Error "Generation failed. Please check the error messages above."
    exit 1
}

Write-Host "`nDone!" -ForegroundColor Green