// Minimal API handlers types for editor/typecheck support.

type PagesFunction<Env = Record<string, unknown>> = (context: {
  request: Request;
  env: Env;
  params?: Record<string, string | undefined>;
}) => Response | Promise<Response>;
