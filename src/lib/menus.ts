import { supabase } from "@/integrations/supabase/client";

export type MenuLocation = "header" | "panel";

export interface MenuItem {
  id: string;
  location: MenuLocation;
  parentId: string | null;
  label: string;
  icon: string;
  path: string;
  external: boolean;
  requiresAuth: boolean;
  visible: boolean;
  sortOrder: number;
  children: MenuItem[];
}

interface RawMenu {
  id: string;
  location: string;
  parent_id: string | null;
  label: string;
  icon: string | null;
  path: string;
  external: boolean;
  requires_auth: boolean;
  visible: boolean;
  sort_order: number;
}

const table = () => supabase.from("nav_menus" as never);

function mapMenu(r: RawMenu): MenuItem {
  return {
    id: r.id,
    location: (r.location as MenuLocation) ?? "header",
    parentId: r.parent_id,
    label: r.label,
    icon: r.icon ?? "",
    path: r.path,
    external: r.external,
    requiresAuth: r.requires_auth,
    visible: r.visible,
    sortOrder: r.sort_order,
    children: [],
  };
}

/** Build a two-level tree (main items + drop-down children). */
export function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const nodes = new Map(items.map((i) => [i.id, { ...i, children: [] as MenuItem[] }]));
  const roots: MenuItem[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  const sort = (l: MenuItem[]) => {
    l.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
    l.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

export async function listMenus(location: MenuLocation): Promise<MenuItem[]> {
  const { data, error } = await table()
    .select("id,location,parent_id,label,icon,path,external,requires_auth,visible,sort_order")
    .eq("location", location)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawMenu[]).map(mapMenu);
}

export async function createMenuItem(input: Partial<MenuItem> & { location: MenuLocation; label: string; path: string }): Promise<void> {
  const { error } = await table().insert({
    location: input.location,
    parent_id: input.parentId ?? null,
    label: input.label,
    icon: input.icon ?? "",
    path: input.path,
    external: input.external ?? false,
    requires_auth: input.requiresAuth ?? false,
    visible: input.visible ?? true,
    sort_order: input.sortOrder ?? 0,
  } as never);
  if (error) throw new Error(error.message);
}

export async function updateMenuItem(id: string, patch: Partial<MenuItem>): Promise<void> {
  const db: Record<string, unknown> = {};
  if (patch.label !== undefined) db.label = patch.label;
  if (patch.icon !== undefined) db.icon = patch.icon;
  if (patch.path !== undefined) db.path = patch.path;
  if (patch.external !== undefined) db.external = patch.external;
  if (patch.requiresAuth !== undefined) db.requires_auth = patch.requiresAuth;
  if (patch.visible !== undefined) db.visible = patch.visible;
  if (patch.sortOrder !== undefined) db.sort_order = patch.sortOrder;
  if (patch.parentId !== undefined) db.parent_id = patch.parentId;
  const { error } = await table().update(db as never).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await table().delete().eq("id", id);
  if (error) throw new Error(error.message);
}
