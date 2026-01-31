import { Plugin, PluginEndpoint } from "./types";

const plugins: Map<string, Plugin> = new Map();

export function registerPlugin(plugin: Plugin): Plugin {
  const routeKey = `${plugin.category}/${plugin.slug}`;
  plugins.set(routeKey, plugin);
  return plugin;
}

export function getPlugin(category: string, slug: string): Plugin | undefined {
  return plugins.get(`${category}/${slug}`);
}

export function getPluginByRoute(route: string): Plugin | undefined {
  return plugins.get(route);
}

export function getAllPlugins(): Plugin[] {
  return Array.from(plugins.values());
}

export function getPluginsByCategory(category: string): Plugin[] {
  return getAllPlugins().filter(p => p.category === category);
}

export function getCategories(): string[] {
  const categories = new Set<string>();
  plugins.forEach(p => categories.add(p.category));
  return Array.from(categories);
}

export function getCategoryPlugins(): Map<string, Plugin[]> {
  const grouped = new Map<string, Plugin[]>();
  plugins.forEach(plugin => {
    const existing = grouped.get(plugin.category) || [];
    existing.push(plugin);
    grouped.set(plugin.category, existing);
  });
  return grouped;
}

export function hasPlugin(category: string, slug: string): boolean {
  return plugins.has(`${category}/${slug}`);
}

export function removePlugin(category: string, slug: string): boolean {
  return plugins.delete(`${category}/${slug}`);
}

export function clearPlugins(): void {
  plugins.clear();
}

export function getPluginCount(): number {
  return plugins.size;
}

export function getRouteHandler(category: string, slug: string): PluginEndpoint["run"] | undefined {
  const plugin = getPlugin(category, slug);
  return plugin?.endpoint.run;
}

export function getAllRoutes(): string[] {
  return Array.from(plugins.keys());
}

export type { Plugin, PluginEndpoint };
