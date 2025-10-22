import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("api/transcribe-stream", "routes/api.transcribe-stream.ts"),
  route("api/transcribe-chunk", "routes/api.transcribe-chunk.ts"),
  route("api/agent", "routes/api.agent.ts"),
] satisfies RouteConfig;
