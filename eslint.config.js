//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export default [
  {
    ignores: [
      '.agents/**',
      '.output/**',
      '.tanstack/**',
      '.nitro/**',
      'skills/**',
      'dist/**',
      'src/routeTree.gen.ts',
    ],
  },
  ...tanstackConfig,
  {
    files: [
      'src/routes/**/*.{ts,tsx}',
      'src/components/layout/**/*.{ts,tsx}',
    ],
    ignores: ['**/lib/i18n/**', '**/eslint/**'],
    plugins: {
      'no-hardcoded-english': {
        rules: {
          'no-hardcoded-english': {
            meta: {
              type: 'problem',
              docs: {
                description:
                  'Disallow hard-coded English strings - use t() instead',
              },
              messages: {
                noHardcodedEnglish:
                  'Hard-coded English detected. Use t() from react-i18next instead of hard-coded strings.',
              },
              schema: [],
            },
            create(context) {
              return {
                JSXText(node) {
                  const text = node.value.trim()
                  if (
                    text.length > 0 &&
                    /^[a-zA-Z\s.,!?'"()-]+$/.test(text) &&
                    !text.includes('{{') &&
                    !text.includes('i18n') &&
                    !text.includes('.') &&
                    !/[áéíóúýþæø]/.test(text)
                  ) {
                    context.report({
                      node,
                      messageId: 'noHardcodedEnglish',
                    })
                  }
                },
                Literal(node) {
                  if (
                    typeof node.value === 'string' &&
                    node.value.length > 0 &&
                    /^[a-zA-Z\s.,!?'"()-]+$/.test(node.value) &&
                    !node.value.includes('{{') &&
                    !node.value.includes('.') &&
                    !/[áéíóúýþæø]/.test(node.value) &&
                    node.value.trim().length > 0
                  ) {
                    const parent = node.parent
                    // Skip import declarations
                    if (
                      parent?.type === AST_NODE_TYPES.ImportDeclaration ||
                      parent?.type === AST_NODE_TYPES.Literal
                    ) {
                      return
                    }
                    // Skip JSX attributes
                    if (parent?.type === AST_NODE_TYPES.JSXAttribute) {
                      return
                    }
                    if (
                      parent?.type === AST_NODE_TYPES.Property &&
                      parent.key.type === AST_NODE_TYPES.Identifier &&
                      (parent.key.name === 'placeholder' ||
                        parent.key.name === 'title' ||
                        parent.key.name === 'alt' ||
                        parent.key.name === 'aria-label' ||
                        parent.key.name === 'id' ||
                        parent.key.name === 'type' ||
                        parent.key.name === 'autoComplete' ||
                        parent.key.name === 'name' ||
                        parent.key.name === 'minLength' ||
                        parent.key.name === 'maxLength' ||
                        parent.key.name === 'autoFocus' ||
                        parent.key.name === 'rel' ||
                        parent.key.name === 'method')
                    ) {
                      return
                    }
                    if (
                      parent?.type === AST_NODE_TYPES.CallExpression &&
                      parent.callee.type === AST_NODE_TYPES.Identifier &&
                      (parent.callee.name === 't' ||
                        parent.callee.name === 'translate')
                    ) {
                      return
                    }
                    // Skip TypeScript type annotations
                    if (
                      parent?.type === AST_NODE_TYPES.TSTypeAnnotation ||
                      parent?.type === AST_NODE_TYPES.TSStringKeyword ||
                      parent?.type === AST_NODE_TYPES.TSNumberKeyword ||
                      parent?.type === AST_NODE_TYPES.TSBooleanKeyword ||
                      parent?.type === AST_NODE_TYPES.TSTypeReference ||
                      parent?.type === AST_NODE_TYPES.TSArrayType ||
                      parent?.type === AST_NODE_TYPES.TSUnionType ||
                      parent?.type === AST_NODE_TYPES.TSLiteralType ||
                      parent?.type ===
                        AST_NODE_TYPES.TSTypeParameterInstantiation ||
                      parent?.type === AST_NODE_TYPES.TSTypeParameter
                    ) {
                      return
                    }
                    // Skip useState with literal type parameters and default values
                    if (
                      parent?.type === AST_NODE_TYPES.CallExpression &&
                      parent.callee.type === AST_NODE_TYPES.Identifier &&
                      parent.callee.name === 'useState'
                    ) {
                      return
                    }
                    // Skip variable declarators with type annotations (including useState)
                    if (
                      (parent?.type === AST_NODE_TYPES.VariableDeclarator ||
                        parent?.type === AST_NODE_TYPES.CallExpression) &&
                      parent.id?.type === AST_NODE_TYPES.Identifier &&
                      parent.id.typeAnnotation?.type ===
                        AST_NODE_TYPES.TSTypeAnnotation
                    ) {
                      return
                    }
                    // Skip variable declarators with type annotations
                    if (
                      parent?.type === AST_NODE_TYPES.VariableDeclarator &&
                      parent.id?.type === AST_NODE_TYPES.Identifier &&
                      parent.id.typeAnnotation?.type ===
                        AST_NODE_TYPES.TSTypeAnnotation
                    ) {
                      return
                    }
                    // Skip object property values in devtools config
                    if (
                      parent?.type === AST_NODE_TYPES.Property &&
                      parent.value === node &&
                      parent.parent?.type === AST_NODE_TYPES.ObjectExpression &&
                      parent.parent?.parent?.type === AST_NODE_TYPES.Property &&
                      parent.parent?.parent?.key?.name === 'config'
                    ) {
                      return
                    }
                    // Skip variable declarators with type annotations
                    if (
                      parent?.type === AST_NODE_TYPES.VariableDeclarator &&
                      parent.id?.type === AST_NODE_TYPES.Identifier &&
                      parent.id.typeAnnotation?.type ===
                        AST_NODE_TYPES.TSTypeAnnotation
                    ) {
                      return
                    }
                    // Skip object property values in devtools config
                    if (
                      parent?.type === AST_NODE_TYPES.Property &&
                      parent.value === node &&
                      parent.parent?.type === AST_NODE_TYPES.ObjectExpression &&
                      parent.parent?.parent?.type === AST_NODE_TYPES.Property &&
                      parent.parent?.parent?.key?.name === 'config'
                    ) {
                      return
                    }
                    // Skip switch case statements
                    if (parent?.type === AST_NODE_TYPES.SwitchCase) {
                      return
                    }
                    // Skip Tailwind CSS class strings
                    if (
                      typeof node.value === 'string' &&
                      (node.value.includes('border-') ||
                        node.value.includes('text-') ||
                        node.value.includes('bg-') ||
                        node.value.includes('px-') ||
                        node.value.includes('py-') ||
                        node.value.includes('mx-') ||
                        node.value.includes('my-') ||
                        node.value.includes('w-') ||
                        node.value.includes('h-') ||
                        node.value.includes('gap-') ||
                        node.value.includes('rounded') ||
                        node.value.includes('flex') ||
                        node.value.includes('grid') ||
                        node.value.includes('absolute') ||
                        node.value.includes('fixed') ||
                        node.value.includes('relative'))
                    ) {
                      return
                    }
                    // Skip locale codes like 'is', 'en'
                    if (
                      typeof node.value === 'string' &&
                      (node.value === 'is' ||
                        node.value === 'en' ||
                        node.value === 'en-GB' ||
                        node.value === 'en-US')
                    ) {
                      return
                    }
                    // Skip function call arguments for setters and common methods
                    if (
                      parent?.type === AST_NODE_TYPES.CallExpression &&
                      parent.arguments?.includes(node) &&
                      (parent.callee.type === AST_NODE_TYPES.Identifier ||
                        parent.callee.type ===
                          AST_NODE_TYPES.MemberExpression) &&
                      (parent.callee.type === AST_NODE_TYPES.Identifier
                        ? parent.callee.name.startsWith('set') ||
                          parent.callee.name === 'join' ||
                          parent.callee.name === 'split' ||
                          parent.callee.name === 'trim' ||
                          parent.callee.name === 'filter' ||
                          parent.callee.name === 'map'
                        : parent.callee.property.name === 'join' ||
                          parent.callee.property.name === 'split' ||
                          parent.callee.property.name === 'trim' ||
                          parent.callee.property.name === 'filter' ||
                          parent.callee.property.name === 'map')
                    ) {
                      return
                    }
                    // Skip object property values that are clearly internal config
                    if (
                      parent?.type === AST_NODE_TYPES.Property &&
                      parent.value === node &&
                      parent.parent?.type === AST_NODE_TYPES.ObjectExpression &&
                      parent.key.type === AST_NODE_TYPES.Identifier &&
                      (parent.key.name === 'position' ||
                        parent.key.name === 'name' ||
                        parent.key.name === 'method' ||
                        parent.key.name === 'position')
                    ) {
                      return
                    }
                    // Skip conditional className expressions (Tailwind classes)
                    if (parent?.type === AST_NODE_TYPES.LogicalExpression) {
                      return
                    }
                    // Skip locale identifiers like 'en-GB', 'is', etc.
                    if (
                      parent?.type === AST_NODE_TYPES.CallExpression &&
                      parent.callee.type === AST_NODE_TYPES.MemberExpression &&
                      (parent.callee.property.name === 'toLocaleDateString' ||
                        parent.callee.property.name === 'toLocaleString')
                    ) {
                      return
                    }
                    // Skip object property keys in common API options (day, month, year, etc.)
                    if (
                      parent?.type === AST_NODE_TYPES.Property &&
                      parent.key.type === AST_NODE_TYPES.Identifier &&
                      (parent.key.name === 'day' ||
                        parent.key.name === 'month' ||
                        parent.key.name === 'year' ||
                        parent.key.name === 'hour' ||
                        parent.key.name === 'minute' ||
                        parent.key.name === 'second' ||
                        parent.key.name === 'weekday' ||
                        parent.key.name === 'era' ||
                        parent.key.name === 'timeZoneName' ||
                        parent.key.name === 'formatMatcher')
                    ) {
                      return
                    }
                    // Skip array elements (internal identifiers like tab keys)
                    if (parent?.type === AST_NODE_TYPES.ArrayExpression) {
                      return
                    }
                    // Skip binary expression right-hand sides (for comparisons like tab === 'constraints')
                    if (
                      parent?.type === AST_NODE_TYPES.BinaryExpression &&
                      parent.right === node
                    ) {
                      return
                    }
                    context.report({
                      node,
                      messageId: 'noHardcodedEnglish',
                    })
                  }
                },
              }
            },
          },
        },
      },
    },
    rules: {
      'no-hardcoded-english/no-hardcoded-english': 'error',
    },
  },
]
