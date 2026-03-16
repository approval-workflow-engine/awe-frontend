import { Box, Typography, TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  chip?: ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  onBack,
  chip,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search…",
  action,
}: Props) {
  const titleBlock = (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={0.25}>
        <Typography
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: onBack ? 20 : 22,
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {chip}
      </Box>
      {subtitle && (
        <Typography
          sx={{
            fontSize: 13,
            color: "text.secondary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box
      display="flex"
      alignItems={onBack ? "center" : "flex-start"}
      justifyContent="space-between"
      mb={3}
    >
      {onBack ? (
        <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0} mr={2}>
          <IconButton
            size="small"
            onClick={onBack}
            sx={{ color: "text.secondary", flexShrink: 0 }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          {titleBlock}
        </Box>
      ) : (
        titleBlock
      )}

      {(onSearchChange !== undefined || action !== undefined) && (
        <Box display="flex" alignItems="center" gap={1.5} flexShrink={0}>
          {onSearchChange !== undefined && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              sx={{
                width: 240,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: 13,
                  "& fieldset": { borderColor: "divider" },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => onSearchChange("")}
                        sx={{ p: 0.25, color: "text.disabled" }}
                      >
                        <ClearIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          )}
          {action}
        </Box>
      )}
    </Box>
  );
}
