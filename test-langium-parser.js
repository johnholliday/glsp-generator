import { createLangiumGrammarServices } from 'langium/grammar';
import { EmptyFileSystem, URI } from 'langium';

const services = createLangiumGrammarServices(EmptyFileSystem).grammar;

const grammarContent = `
grammar Test

interface Node {
    name: string
}

type NodeType = 'start' | 'end'
`;

const document = services.shared.workspace.LangiumDocumentFactory.fromString(
    grammarContent, 
    URI.parse('memory://test.langium')
);

await services.shared.workspace.DocumentBuilder.build([document], { validation: true });

console.log('Parse result:', document.parseResult?.value);
console.log('Rules:', document.parseResult?.value?.rules);

if (document.parseResult?.value?.rules) {
    for (const rule of document.parseResult.value.rules) {
        console.log(`Rule: ${rule.$type} - ${rule.name}`);
        if (rule.definition) {
            console.log(`  Definition: ${rule.definition.$type}`);
        }
    }
}