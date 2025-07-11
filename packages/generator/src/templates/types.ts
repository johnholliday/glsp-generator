import * as Handlebars from 'handlebars';

type HandlebarsTemplateDelegate = Handlebars.TemplateDelegate;

export interface TemplateSource {
    type: 'path' | 'package' | 'git' | 'registry';
    location: string;
    version?: string;
}

export interface TemplateOptions {
    templatesPath?: string;
    templatesPackage?: string;
    templatesRepo?: string;
    templatesRegistry?: string;
}

export interface TemplateConfig {
    name: string;
    version: string;
    description?: string;
    extends?: string;
    templates?: Record<string, TemplateDefinition>;
    helpers?: string[];
    partials?: Record<string, string>;
    features?: string[];
    targetDir?: string;
}

export interface TemplateDefinition {
    override?: boolean;
    description?: string;
    targetDir?: string;
    condition?: string;
}

export interface CompiledTemplate {
    name: string;
    template: HandlebarsTemplateDelegate;
    config: TemplateDefinition;
    source: string;
}

export interface TemplateSet {
    templates: Map<string, CompiledTemplate>;
    helpers: Map<string, Handlebars.HelperDelegate>;
    partials: Map<string, HandlebarsTemplateDelegate>;
    config: TemplateConfig;
}

export interface TemplatePackage {
    config: TemplateConfig;
    templates: Map<string, string>;
    helpers: Map<string, string>;
    partials: Map<string, string>;
    path: string;
}

export interface TemplateLoadResult {
    success: boolean;
    templateSet?: TemplateSet;
    errors?: string[];
    warnings?: string[];
}