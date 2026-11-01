import { describe, it, expect } from 'vitest'
import { slugify, lexicalToPlainText, readingTimeMinutes } from '../src/lib/text'

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })
  it('removes special characters', () => {
    expect(slugify('IPO Allotment: Why You Did Not Get Shares!')).toBe('ipo-allotment-why-you-did-not-get-shares')
  })
  it('collapses multiple hyphens', () => {
    expect(slugify('a  --  b')).toBe('a-b')
  })
  it('strips accents', () => {
    expect(slugify('Nisha Shah')).toBe('nisha-shah')
  })
  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})

describe('lexicalToPlainText', () => {
  it('extracts text from nested children', () => {
    const state = {
      root: {
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'Hello' }, { type: 'text', text: ' world' }] },
        ],
      },
    }
    expect(lexicalToPlainText(state)).toBe('Hello world')
  })
  it('returns empty string for null', () => {
    expect(lexicalToPlainText(null)).toBe('')
  })
  it('returns empty string for non-object', () => {
    expect(lexicalToPlainText('string')).toBe('')
  })
})

describe('readingTimeMinutes', () => {
  it('returns 1 for short text', () => {
    expect(readingTimeMinutes('hello world')).toBe(1)
  })
  it('returns correct minutes for 400 words', () => {
    const text = Array(400).fill('word').join(' ')
    expect(readingTimeMinutes(text)).toBe(2)
  })
  it('rounds up', () => {
    const text = Array(201).fill('word').join(' ')
    expect(readingTimeMinutes(text)).toBe(2)
  })
})
