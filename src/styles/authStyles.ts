// Layout-only — colors come from the MUI theme (Paper, OutlinedInput, Button)
export const cardStyle = {
  width: "100%",
  maxWidth: 400,
  p: "28px 32px 24px",
};

// Input field overrides — theme handles colors, this controls only shape
export const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
  },
};

// Button overrides — variant="contained" picks up primary.main from theme
export const buttonStyle = {
  mt: 1,
  height: "40px",
  fontWeight: 600,
  fontSize: "14px",
};
