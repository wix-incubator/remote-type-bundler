const importsRegex = /^(?:\s*(?:\/\/.*\s*)*)*(import .* from '.*'| export .* from '.*')/;

export const isCodeValid = (code: string) => {
  const match = code.match(importsRegex);
  return {
    isValid: !match?.length,
    match,
  }
}
