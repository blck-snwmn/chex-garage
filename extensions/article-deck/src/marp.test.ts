import { describe, it, expect } from "vitest";
import { convertToSlide } from "./marp";

describe("convertToSlide", () => {
  it("should convert basic marp markdown to HTML", () => {
    const markdown = `---
marp: true
---

# Slide 1

This is the first slide.

---

# Slide 2

This is the second slide.
`;

    const result = convertToSlide(markdown);

    expect(result.markdown).toBe(markdown);
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<html>");
    expect(result.html).toContain("Slide 1");
    expect(result.html).toContain("Slide 2");
  });

  it("should include CSS in the output HTML", () => {
    const markdown = `---
marp: true
---

# Test Slide
`;

    const result = convertToSlide(markdown);

    expect(result.html).toContain("<style>");
    expect(result.html).toContain("</style>");
  });

  it("should handle bullet points", () => {
    const markdown = `---
marp: true
---

# Features

- Feature 1
- Feature 2
- Feature 3
`;

    const result = convertToSlide(markdown);

    expect(result.html).toContain("Feature 1");
    expect(result.html).toContain("Feature 2");
    expect(result.html).toContain("Feature 3");
  });

  it("should handle code blocks", () => {
    const markdown = `---
marp: true
---

# Code Example

\`\`\`javascript
const greeting = "Hello";
console.log(greeting);
\`\`\`
`;

    const result = convertToSlide(markdown);

    // Marp renders code, check for code-related elements
    expect(result.html).toContain("Code Example");
    // Code content may be HTML-escaped
    expect(result.html).toMatch(/greeting|Hello/);
  });

  it("should include print styles for PDF export", () => {
    const markdown = `---
marp: true
---

# Print Test
`;

    const result = convertToSlide(markdown);

    expect(result.html).toContain("@media print");
    expect(result.html).toContain("page-break-after");
  });

  it("should include printSlides function", () => {
    const markdown = `---
marp: true
---

# Test
`;

    const result = convertToSlide(markdown);

    expect(result.html).toContain("window.printSlides");
    expect(result.html).toContain("window.print()");
  });

  it("should handle multiple slides with different content types", () => {
    const markdown = `---
marp: true
theme: default
---

# Introduction

Welcome to the presentation.

---

## Agenda

1. First topic
2. Second topic
3. Third topic

---

## Details

| Column A | Column B |
|----------|----------|
| Value 1  | Value 2  |

---

# Conclusion

Thank you!
`;

    const result = convertToSlide(markdown);

    expect(result.html).toContain("Introduction");
    expect(result.html).toContain("Agenda");
    expect(result.html).toContain("First topic");
    expect(result.html).toContain("Conclusion");
  });

  it("should preserve markdown in result", () => {
    const markdown = `---
marp: true
---

# Original Content
`;

    const result = convertToSlide(markdown);

    expect(result.markdown).toBe(markdown);
  });
});
