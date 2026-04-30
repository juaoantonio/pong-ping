"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageInfo } from "@/lib/pagination";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  pageInfo: PageInfo;
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
  itemLabel?: string;
};

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | string[] | undefined,
) {
  if (value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item) {
        params.append(key, item);
      }
    });
    return;
  }

  if (value) {
    params.set(key, value);
  }
}

function buildParams(
  searchParams: PaginationControlsProps["searchParams"],
  page: number,
  pageSize: number,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (key === "page" || key === "pageSize") {
      return;
    }

    appendParam(params, key, value);
  });

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return params;
}

function pageHref(
  pathname: string,
  searchParams: PaginationControlsProps["searchParams"],
  page: number,
  pageSize: number,
) {
  return `${pathname}?${buildParams(searchParams, page, pageSize).toString()}`;
}

export function PaginationControls({
  pageInfo,
  pathname,
  searchParams,
  itemLabel = "itens",
}: PaginationControlsProps) {
  const router = useRouter();
  const previousHref = pageHref(
    pathname,
    searchParams,
    pageInfo.page - 1,
    pageInfo.pageSize,
  );
  const nextHref = pageHref(
    pathname,
    searchParams,
    pageInfo.page + 1,
    pageInfo.pageSize,
  );

  return (
    <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <p>
        Pagina {pageInfo.page} de {pageInfo.totalPages} ·{" "}
        {pageInfo.totalCount} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(value) => {
            router.push(pageHref(pathname, searchParams, 1, Number(value)));
          }}
          value={String(pageInfo.pageSize)}
        >
          <SelectTrigger
            aria-label="Itens por pagina"
            className="w-[150px]"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {pageSize} por pagina
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pageInfo.hasPreviousPage ? (
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={previousHref}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Link>
        ) : (
          <Button disabled size="sm" variant="outline">
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
        )}

        {pageInfo.hasNextPage ? (
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={nextHref}
          >
            Proxima
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <Button disabled size="sm" variant="outline">
            Proxima
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
