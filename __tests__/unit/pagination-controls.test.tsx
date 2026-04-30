import { render, screen } from "@testing-library/react";
import { PaginationControls } from "@/components/pagination-controls";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("PaginationControls", () => {
  it("preserves query params in previous and next links", () => {
    render(
      <PaginationControls
        itemLabel="rodadas"
        pageInfo={{
          page: 2,
          pageSize: 25,
          totalCount: 70,
          totalPages: 3,
          hasPreviousPage: true,
          hasNextPage: true,
        }}
        pathname="/admin/rounds"
        searchParams={{
          q: "mesa",
          status: "rollback_available",
          page: "2",
          pageSize: "25",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /anterior/i })).toHaveAttribute(
      "href",
      "/admin/rounds?q=mesa&status=rollback_available&page=1&pageSize=25",
    );
    expect(screen.getByRole("link", { name: /proxima/i })).toHaveAttribute(
      "href",
      "/admin/rounds?q=mesa&status=rollback_available&page=3&pageSize=25",
    );
  });

  it("disables previous navigation on the first page", () => {
    render(
      <PaginationControls
        pageInfo={{
          page: 1,
          pageSize: 10,
          totalCount: 15,
          totalPages: 2,
          hasPreviousPage: false,
          hasNextPage: true,
        }}
        pathname="/tables"
      />,
    );

    expect(screen.getByRole("button", { name: /anterior/i })).toBeDisabled();
  });
});
