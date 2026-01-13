// Minimal runtime handler types for editor/typecheck support.

type ApiHandler<Env = Record<string, unknown>> = (context: {
  request: Request;
  env: Env;
  params?: Record<string, string | undefined>;
}) => Response | Promise<Response>;
