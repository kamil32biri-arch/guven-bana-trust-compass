import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("keeps home separate from the authenticated layout", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes('/').map(match => match.routeId)).toEqual(['__root__', '/']);
  });

  it("matches business management directly under the authenticated layout", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes('/isletmem/12345678-1234-1234-1234-123456789abc');
    expect(matches.map(match => match.routeId)).toEqual([
      '__root__', '/_authenticated', '/_authenticated/isletmem_/$id',
    ]);
    expect(matches.at(-1)?.params).toMatchObject({ id: '12345678-1234-1234-1234-123456789abc' });
  });

  it("resolves the administrator link to a protected page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes('/yonetim').map(match => match.routeId)).toEqual([
      '__root__', '/_authenticated', '/_authenticated/yonetim',
    ]);
  });
});
