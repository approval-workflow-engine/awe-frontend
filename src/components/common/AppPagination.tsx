import { Box, TablePagination } from "@mui/material";
import type { Pagination } from "../../api/schemas/common";

type Props = {
  pagination: Pagination | null;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
};

export default function AppPagination({
  pagination,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 20, 50, 100],
}: Props) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={pagination.total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={{
          ".MuiTablePagination-toolbar": {
            minHeight: 44,
            px: 1.5,
          },
          ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
            fontSize: 12,
            color: "text.secondary",
          },
          ".MuiTablePagination-actions button": {
            borderRadius: "8px",
          },
        }}
      />
    </Box>
  );
}
