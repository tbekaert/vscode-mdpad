import { cpp } from '@codemirror/lang-cpp'
import { css } from '@codemirror/lang-css'
import { go } from '@codemirror/lang-go'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { less } from '@codemirror/lang-less'
import { markdown } from '@codemirror/lang-markdown'
import { php } from '@codemirror/lang-php'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { sass } from '@codemirror/lang-sass'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import { LanguageDescription } from '@codemirror/language'

export const codeLanguages = [
  LanguageDescription.of({
    name: 'JavaScript',
    alias: ['js', 'javascript', 'ecmascript', 'node'],
    support: javascript(),
  }),
  LanguageDescription.of({
    name: 'TypeScript',
    alias: ['ts', 'typescript'],
    support: javascript({ typescript: true }),
  }),
  LanguageDescription.of({
    name: 'JSX',
    alias: ['jsx'],
    support: javascript({ jsx: true }),
  }),
  LanguageDescription.of({
    name: 'TSX',
    alias: ['tsx'],
    support: javascript({ jsx: true, typescript: true }),
  }),
  LanguageDescription.of({
    name: 'Python',
    alias: ['python', 'py'],
    support: python(),
  }),
  LanguageDescription.of({
    name: 'JSON',
    alias: ['json', 'json5'],
    support: json(),
  }),
  LanguageDescription.of({
    name: 'HTML',
    alias: ['html', 'xhtml'],
    support: html(),
  }),
  LanguageDescription.of({
    name: 'CSS',
    alias: ['css'],
    support: css(),
  }),
  LanguageDescription.of({
    name: 'LESS',
    alias: ['less'],
    support: less(),
  }),
  LanguageDescription.of({
    name: 'Sass',
    alias: ['sass', 'scss'],
    support: sass(),
  }),
  LanguageDescription.of({
    name: 'SQL',
    alias: ['sql'],
    support: sql(),
  }),
  LanguageDescription.of({
    name: 'XML',
    alias: ['xml', 'rss', 'wsdl', 'xsd'],
    support: xml(),
  }),
  LanguageDescription.of({
    name: 'Rust',
    alias: ['rust', 'rs'],
    support: rust(),
  }),
  LanguageDescription.of({
    name: 'Java',
    alias: ['java'],
    support: java(),
  }),
  LanguageDescription.of({
    name: 'C++',
    alias: ['cpp', 'c++', 'c'],
    support: cpp(),
  }),
  LanguageDescription.of({
    name: 'PHP',
    alias: ['php'],
    support: php(),
  }),
  LanguageDescription.of({
    name: 'Go',
    alias: ['go', 'golang'],
    support: go(),
  }),
  LanguageDescription.of({
    name: 'YAML',
    alias: ['yaml', 'yml'],
    support: yaml(),
  }),
  LanguageDescription.of({
    name: 'Markdown',
    alias: ['markdown', 'md'],
    support: markdown(),
  }),
]
