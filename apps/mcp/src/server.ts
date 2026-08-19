import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "aethermind",
  version: "1.0.0",
});

server.registerTool(
  "hello",
  {
    description: "Test that the AetherMind MCP server is working.",
    inputSchema: {
      name: z.string().optional(),
    },
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello ${name ?? "from AetherMind"}! MCP is working.`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();

await server.connect(transport);
