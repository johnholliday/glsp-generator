# PowerShell completion for glsp command
# 
# To use this completion script:
# 1. Run: . ./scripts/glsp-completion.ps1
# 2. Or add it to your PowerShell profile: notepad $PROFILE
#
# This provides tab completion for:
# - Command names (generate, validate, watch, new, clean)
# - Command aliases (gen, g, val, v, w)
# - Option names for each command
# - File paths for grammar files (.langium extension)

Register-ArgumentCompleter -CommandName glsp -ScriptBlock {
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameter)
    
    # Define available commands and their aliases
    $commands = @{
        'generate' = @('gen', 'g')
        'validate' = @('val', 'v')
        'watch' = @('w')
        'new' = @('init', 'create')
        'clean' = @()
        'help' = @()
    }
    
    # Define options for each command
    $commandOptions = @{
        'generate' = @('--config', '-c', '--watch', '-w', '--debug', '-d', '--validate-only', '--no-validate', '--force', '-f', '--help', '-h')
        'gen' = @('--config', '-c', '--watch', '-w', '--debug', '-d', '--validate-only', '--no-validate', '--force', '-f', '--help', '-h')
        'g' = @('--config', '-c', '--watch', '-w', '--debug', '-d', '--validate-only', '--no-validate', '--force', '-f', '--help', '-h')
        'validate' = @('--debug', '-d', '--help', '-h')
        'val' = @('--debug', '-d', '--help', '-h')
        'v' = @('--debug', '-d', '--help', '-h')
        'watch' = @('--serve', '-s', '--port', '-p', '--help', '-h')
        'w' = @('--serve', '-s', '--port', '-p', '--help', '-h')
        'new' = @('--template', '-t', '--no-git', '--no-install', '--help', '-h')
        'init' = @('--template', '-t', '--no-git', '--no-install', '--help', '-h')
        'create' = @('--template', '-t', '--no-git', '--no-install', '--help', '-h')
        'clean' = @('--force', '-f', '--help', '-h')
    }
    
    # Template choices for new command
    $templateChoices = @('basic', 'advanced', 'minimal')
    
    # Get the current command line tokens
    $tokens = $commandAst.CommandElements
    $currentCommand = $null
    $previousToken = $null
    
    # Find the current command
    for ($i = 1; $i -lt $tokens.Count; $i++) {
        $token = $tokens[$i].ToString()
        if ($commands.ContainsKey($token)) {
            $currentCommand = $token
            break
        }
        # Check aliases
        foreach ($cmd in $commands.Keys) {
            if ($commands[$cmd] -contains $token) {
                $currentCommand = $token
                break
            }
        }
        if ($currentCommand) { break }
    }
    
    # Track the previous token for context
    if ($tokens.Count -gt 1) {
        $previousToken = $tokens[$tokens.Count - 2].ToString()
    }
    
    # If we're completing the first argument (command name)
    if ($tokens.Count -le 2 -or (-not $currentCommand -and $wordToComplete)) {
        $allCommands = @()
        $allCommands += $commands.Keys
        foreach ($aliases in $commands.Values) {
            $allCommands += $aliases
        }
        
        $allCommands | Where-Object { $_ -like "$wordToComplete*" } | Sort-Object | ForEach-Object {
            $description = switch ($_) {
                'generate' { 'Generate GLSP extension from Langium grammar' }
                'gen' { 'Generate GLSP extension (alias for generate)' }
                'g' { 'Generate GLSP extension (short alias)' }
                'validate' { 'Validate Langium grammar' }
                'val' { 'Validate grammar (alias for validate)' }
                'v' { 'Validate grammar (short alias)' }
                'watch' { 'Watch grammar and regenerate on changes' }
                'w' { 'Watch grammar (short alias)' }
                'new' { 'Create new DSL project from template' }
                'init' { 'Create new project (alias for new)' }
                'create' { 'Create new project (alias for new)' }
                'clean' { 'Clean all generated files' }
                'help' { 'Show help information' }
                default { $_ }
            }
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $description)
        }
        return
    }
    
    # If we're completing after --template or -t
    if ($previousToken -eq '--template' -or $previousToken -eq '-t') {
        $templateChoices | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            $description = switch ($_) {
                'basic' { 'Basic project template with essential files' }
                'advanced' { 'Advanced template with full features' }
                'minimal' { 'Minimal template with bare essentials' }
            }
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $description)
        }
        return
    }
    
    # If we have a current command and the word starts with -, complete options
    if ($currentCommand -and $wordToComplete -like '-*') {
        $options = $commandOptions[$currentCommand]
        if ($options) {
            $options | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
                $description = switch ($_) {
                    '--config' { 'Configuration file' }
                    '-c' { 'Configuration file (short)' }
                    '--watch' { 'Watch for changes' }
                    '-w' { 'Watch for changes (short)' }
                    '--debug' { 'Enable debug output' }
                    '-d' { 'Enable debug output (short)' }
                    '--validate-only' { 'Only validate, don''t generate' }
                    '--no-validate' { 'Skip validation' }
                    '--force' { 'Overwrite existing files' }
                    '-f' { 'Force operation (short)' }
                    '--serve' { 'Start development server' }
                    '-s' { 'Start dev server (short)' }
                    '--port' { 'Development server port' }
                    '-p' { 'Server port (short)' }
                    '--template' { 'Template to use' }
                    '-t' { 'Template (short)' }
                    '--no-git' { 'Skip git initialization' }
                    '--no-install' { 'Skip dependency installation' }
                    '--help' { 'Show help' }
                    '-h' { 'Show help (short)' }
                    default { $_ }
                }
                [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $description)
            }
        }
        return
    }
    
    # For file completion (grammar files)
    if ($currentCommand -and ($currentCommand -match 'generate|gen|g|validate|val|v|watch|w')) {
        # Complete .langium files
        $files = Get-ChildItem -Path . -Filter "*.langium" -File -ErrorAction SilentlyContinue
        $files | Where-Object { $_.Name -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_.Name, $_.Name, 'ProviderItem', "Langium grammar file")
        }
        
        # Also complete directories
        $dirs = Get-ChildItem -Path . -Directory -ErrorAction SilentlyContinue
        $dirs | Where-Object { $_.Name -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_.Name + '/', $_.Name, 'ProviderContainer', "Directory")
        }
    }
}

# Also register for the alternate command name
Register-ArgumentCompleter -CommandName glsp-gen -ScriptBlock {
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameter)
    
    # Reuse the same completion logic
    & (Get-Command glsp -CommandType Application).ScriptBlock @PSBoundParameters
}

Write-Host "GLSP PowerShell completions loaded!" -ForegroundColor Green
Write-Host "Try typing: glsp <TAB>" -ForegroundColor Gray
Write-Host "Or: glsp gen <TAB>" -ForegroundColor Gray