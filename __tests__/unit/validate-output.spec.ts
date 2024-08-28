import { isCodeValid } from '../../src/validate-output';

describe('isCodeValid', () => {
  it('should return isValid: true when no import/export statements are present', () => {
    const code = `
      // Some comment
      const x = 5;
      function myFunc() { /* ... */ }
    `;

    const result = isCodeValid(code);
    expect(result.isValid).toBe(true);
  });

  it('should return isValid: false and the match when an import statement is present', () => {
    const code = `
      import something from 'moduleA';
      // Other code
    `;

    const result = isCodeValid(code);
    expect(result.isValid).toBe(false);
    expect(result.match).toEqual(expect.arrayContaining([
      expect.stringMatching(/import something from 'moduleA'/)
    ]));
  });

  it('should return isValid: false and the match when an export statement is present', () => {
    const code = `
      // Comment
      export { default as MyComponent } from 'moduleB';
    `;

    const result = isCodeValid(code);
    expect(result.isValid).toBe(false);
    expect(result.match).toEqual(expect.arrayContaining([
      expect.stringMatching(/export { default as MyComponent } from 'moduleB'/)
    ]));
  });

  it('should handle multiple import/export statements', () => {
    const code = `
      import foo from 'moduleX';
      // Some comment
      export const bar = 10;
      export * from 'moduleY';
    `;

    const result = isCodeValid(code);
    expect(result.isValid).toBe(false);
    expect(result.match).toEqual(expect.arrayContaining([
      expect.stringMatching(/import foo from 'moduleX'/),
    ]));
  });

  it('should allow import/export statements within comments', () => {
    const code = `
      // This is a comment
      /* Multiline comment with an export:
         export const something = 5;
      */
      const x = 1;
    `;

    const result = isCodeValid(code);
    expect(result.isValid).toBe(true);
  });
});
