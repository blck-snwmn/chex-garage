import Marp from "@marp-team/marp-core";
import type { SlideResult } from "../types/index.ts";

export function convertToSlide(markdown: string): SlideResult {
  const marp = new Marp({
    html: true,
    math: true,
  });

  const { html, css } = marp.render(markdown);

  // Create a standalone HTML with embedded CSS
  const standaloneHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slides</title>
  <style>
    ${css}
    body {
      margin: 0;
      padding: 0;
      background: #333;
    }
    .marpit {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      gap: 20px;
    }
    .marpit > svg {
      max-width: 100%;
      height: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    @media print {
      body { background: white; }
      .marpit { padding: 0; gap: 0; }
      .marpit > svg {
        page-break-after: always;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  ${html}
  <script>
    // Print button functionality
    window.printSlides = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  return {
    markdown,
    html: standaloneHtml,
  };
}
