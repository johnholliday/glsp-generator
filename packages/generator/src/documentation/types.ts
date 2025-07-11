export interface DocumentationOptions {
    /**
     * Generate README.md file
     */
    readme?: boolean;
    
    /**
     * Generate API documentation
     */
    api?: boolean;
    
    /**
     * Generate railroad diagrams
     */
    diagrams?: boolean;
    
    /**
     * Generate example model files
     */
    examples?: boolean;
    
    /**
     * Theme for diagrams ('light' or 'dark')
     */
    theme?: 'light' | 'dark';
    
    /**
     * Include screenshots placeholder
     */
    screenshots?: boolean;
    
    /**
     * Output directory for documentation
     */
    outputDir?: string;
}

export interface DocumentationResult {
    success: boolean;
    filesGenerated: string[];
    errors?: string[];
}