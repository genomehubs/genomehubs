import { expect, screen, within } from "@storybook/test";

import Highlight from "./Highlight";

const meta = {
  component: Highlight,
  tags: ["autodocs"],
  title: "Utilities/Highlight",
};

export default meta;

export const MarkdownHighlight = {
  args: {
    children: [
      {
        props: {
          children: [
            `# This is a markdown heading

Some **bold text** and *italic text*.

\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`
`,
          ],
        },
      },
    ],
  },
};

export const WithInteraction = {
  args: {
    children: [
      {
        props: {
          children: [
            `## Configuration Example

\`\`\`yaml
database:
  host: localhost
  port: 5432
  name: mydb
\`\`\`

See the syntax highlighting above.
`,
          ],
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the code is highlighted
    const highlighter = canvas.getByText(/database:/);
    expect(highlighter).toBeInTheDocument();

    // Verify the component renders markdown content
    const heading = canvas.getByText(/Configuration Example/);
    expect(heading).toBeInTheDocument();
  },
};

export const CodeBlock = {
  args: {
    children: [
      {
        props: {
          children: [
            `\`\`\`python
def hello():
    print("Hello, World!")
    return 42
\`\`\`
`,
          ],
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify Python code is rendered
    const pythonCode = canvas.getByText(/def hello/);
    expect(pythonCode).toBeInTheDocument();
  },
};
