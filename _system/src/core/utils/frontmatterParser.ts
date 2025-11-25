import matter from 'gray-matter';

export interface ParsedNote {
  frontmatter: Record<string, any>;
  content: string;
  rawContent: string;
}

/**
 * Parse markdown file with YAML frontmatter
 */
export function parseFrontmatter(fileContent: string): ParsedNote {
  const parsed = matter(fileContent);

  return {
    frontmatter: parsed.data,
    content: parsed.content.trim(),
    rawContent: fileContent,
  };
}

/**
 * Serialize frontmatter and content back to markdown
 */
export function serializeFrontmatter(
  frontmatter: Record<string, any>,
  content: string
): string {
  return matter.stringify(content, frontmatter);
}

/**
 * Update specific frontmatter field without parsing entire file
 */
export function updateFrontmatterField(
  fileContent: string,
  field: string,
  value: any
): string {
  const parsed = parseFrontmatter(fileContent);
  parsed.frontmatter[field] = value;
  return serializeFrontmatter(parsed.frontmatter, parsed.content);
}

/**
 * Validate required frontmatter fields
 */
export function validateFrontmatter(
  frontmatter: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => !(field in frontmatter));
  return {
    valid: missing.length === 0,
    missing,
  };
}
