"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileSearch, PackageSearch, ShoppingCart, Users2 } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { type AppRole, getCommandItemsByRole } from "@/lib/navigation";
import { useUiStore } from "@/stores/ui-store";

type SearchHit = {
  type: "customer" | "invoice" | "product" | "supplier";
  id: string;
  name: string;
  subtitle: string;
  href: string;
};

async function searchGlobal(query: string) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const payload = await response.json();
  return (payload.data ?? []) as SearchHit[];
}

const iconMap = {
  customer: Users2,
  invoice: FileSearch,
  product: PackageSearch,
  supplier: ShoppingCart,
};

export function CommandPalette({ role }: { role: AppRole }) {
  const router = useRouter();
  const commandOpen = useUiStore((state) => state.commandOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  const [query, setQuery] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => searchGlobal(query),
    enabled: query.trim().length >= 2,
  });

  const staticItems = useMemo(() => getCommandItemsByRole(role), [role]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandOpen, setCommandOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden h-10 w-64 items-center justify-between rounded-2xl border border-border/70 bg-panel/50 px-3 text-sm text-muted-foreground md:flex"
      >
        <span>Pencarian global...</span>
        <span className="rounded-md border border-border/70 px-1.5 py-0.5 text-xs">Ctrl/Cmd + K</span>
      </button>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Cari halaman, pelanggan, invoice, produk, supplier..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          <CommandGroup heading="Quick Navigation">
            {staticItems.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => {
                  router.push(item.href);
                  setCommandOpen(false);
                }}
              >
                {item.label}
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Global Search">
            {results.map((result) => {
              const Icon = iconMap[result.type];
              return (
                <CommandItem
                  key={result.id}
                  value={`${result.name} ${result.subtitle}`}
                  onSelect={() => {
                    router.push(result.href);
                    setCommandOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                  <div className="flex flex-col">
                    <span>{result.name}</span>
                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
