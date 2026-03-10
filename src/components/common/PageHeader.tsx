import { Box, Typography } from "@mui/material";

interface Props {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <Box mb={3}>
      <Typography
        sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "text.primary",
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            fontSize: 13,
            color: "text.secondary",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}