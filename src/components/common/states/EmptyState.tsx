import { Box, Typography } from "@mui/material";
import { InboxOutlined } from "@mui/icons-material";

export function EmptyState({
  title = "No data found",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={4}
      textAlign="center"
      sx={{
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          bgcolor: "action.hover",
          color: "text.disabled",
          p: 2,
          borderRadius: "50%",
          mb: 2,
          display: "flex",
        }}
      >
        <InboxOutlined sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h6" fontWeight="500" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ maxWidth: 350, mb: 3 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
