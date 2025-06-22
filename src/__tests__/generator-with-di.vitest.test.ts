// Quick fix for your specific test file - properly typed for Vitest
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import fs from 'fs-extra'
import { GLSPGenerator } from '../generator.js'
import { IGrammarParser } from '../types/parser-interface.js'
import { ParsedGrammar } from '../types/grammar.js'

// ES Module mocking - no more issues!
vi.mock('chalk')
vi.mock('../performance/index.js')
vi.mock('../performance/grammar-converter.js')

describe('GLSPGenerator with Dependency Injection', () => {
  let mockParser: IGrammarParser
  let generator: GLSPGenerator
  let tempDir: string

  beforeEach(async () => {
    // Create a mock parser
    mockParser = {
      parseGrammarFile: vi.fn(),
      parseGrammar: vi.fn(),
      validateGrammarFile: vi.fn()
    } as IGrammarParser

    // Set up default mock implementations - return ParsedGrammar directly
    const mockParsedGrammar: ParsedGrammar = {
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'x', type: 'number', optional: false, array: false },
            { name: 'y', type: 'number', optional: false, array: false }
          ],
          superTypes: ['Element']
        },
        {
          name: 'Edge',
          properties: [
            { name: 'id', type: 'string', optional: false, array: false },
            { name: 'source', type: 'Node', optional: false, array: false },
            { name: 'target', type: 'Node', optional: false, array: false }
          ],
          superTypes: ['Element']
        }
      ],
      types: [
        {
          name: 'EdgeType',
          definition: 'association | dependency | inheritance',
          unionTypes: ['association', 'dependency', 'inheritance']
        }
      ],
      projectName: 'test-project'
    }

    vi.mocked(mockParser.parseGrammarFile).mockResolvedValue(mockParsedGrammar)
    vi.mocked(mockParser.validateGrammarFile).mockResolvedValue(true)
    vi.mocked(mockParser.parseGrammar).mockResolvedValue({
      $type: 'Grammar',
      rules: []
    })

    // Create generator with mock parser - cast to IGrammarParser
    generator = new GLSPGenerator(undefined, mockParser as IGrammarParser)

    tempDir = path.join(process.cwd(), 'src', '__tests__', 'temp-output-di')
    await fs.ensureDir(tempDir)

    // Fix: Use vi.spyOn instead of vi.spyOn
    vi.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(async () => {
    await fs.remove(tempDir)
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  test('should use injected parser for grammar parsing', async () => {
    const grammarPath = 'test-grammar.langium'

    await generator.generateExtension(grammarPath, tempDir)

    expect(mockParser.parseGrammarFile).toHaveBeenCalledWith(grammarPath)
    expect(mockParser.parseGrammarFile).toHaveBeenCalledTimes(1)
  })

  test('should generate files based on mock parser output', async () => {
    const grammarPath = 'test-grammar.langium'

    await generator.generateExtension(grammarPath, tempDir)

    const extensionDir = path.join(tempDir, 'test-project-glsp-extension')

    expect(await fs.pathExists(extensionDir)).toBe(true)
    expect(await fs.pathExists(path.join(extensionDir, 'src/common/test-project-model.ts'))).toBe(true)
  })

  test('should use injected parser for validation', async () => {
    const grammarPath = path.join(tempDir, 'test-grammar.langium')

    await fs.writeFile(grammarPath, 'grammar TestGrammar')

    const isValid = await generator.validateGrammar(grammarPath)

    expect(mockParser.parseGrammar).toHaveBeenCalled()
    expect(isValid).toBe(true)
  })

  test('should handle parser errors gracefully', async () => {
    const grammarPath = 'test-grammar.langium'
    const errorMessage = 'Failed to parse grammar'

    vi.mocked(mockParser.parseGrammarFile).mockRejectedValue(new Error(errorMessage))

    await expect(generator.generateExtension(grammarPath, tempDir))
      .rejects.toThrow(errorMessage)
  })

  test('should handle validation failures from parser', async () => {
    const grammarPath = path.join(tempDir, 'test-grammar.langium')

    await fs.writeFile(grammarPath, 'grammar TestGrammar')

    vi.mocked(mockParser.parseGrammar).mockRejectedValue(new Error('Invalid grammar'))

    const isValid = await generator.validateGrammar(grammarPath)

    expect(isValid).toBe(false)
  })

  test('should allow custom parser implementations', async () => {
    // Create a custom parser implementation
    const customParser: IGrammarParser = {
      parseGrammarFile: vi.fn().mockResolvedValue({
        interfaces: [{
          name: 'CustomInterface',
          properties: [
            { name: 'customProp', type: 'string', optional: true, array: false }
          ],
          superTypes: []
        }],
        types: [],
        projectName: 'custom-project'
      }),
      parseGrammar: vi.fn().mockResolvedValue({ $type: 'Grammar', rules: [] }),
      validateGrammarFile: vi.fn().mockResolvedValue(true)
    }

    const customGenerator = new GLSPGenerator(undefined, customParser)

    await customGenerator.generateExtension('custom.langium', tempDir)

    const extensionDir = path.join(tempDir, 'custom-project-glsp-extension')
    expect(await fs.pathExists(extensionDir)).toBe(true)
  })
})
