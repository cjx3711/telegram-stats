import { Box, Button, Container, Stack, Typography } from "@mui/material";
import TelegramIcon from "@mui/icons-material/Telegram";
import { Link } from "react-router-dom";
import { GitHub } from "@mui/icons-material";

function LandingPage() {
  return (
    <Container maxWidth="md">
      <Stack
        spacing={2}
        marginY={4}
        gap={2}
        direction="column"
        alignItems="center"
        textAlign="center">
        <img
          src="/icon.png"
          alt="Telegram Stats Viewer"
          width="128"
          height="128"
        />
        <Typography variant="h2" component="h1" gutterBottom>
          Telegram Stats Viewer
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Analyze your Telegram chat history with ease
        </Typography>
        <Typography variant="body1" paragraph>
          Telegram Stats Viewer is a powerful tool for personal use that allows
          you to gain insights from your Telegram chat exports.
        </Typography>
        <Box>
          <Typography variant="h6" component="h3">
            Features:
          </Typography>
          <ul style={{ textAlign: "left", marginBottom: "2rem" }}>
            <li>100% private - all processing happens in your browser</li>
            <li>Load and analyze Telegram chat exports</li>
            <li>View message statistics and trends</li>
            <li>Compare participant contributions (coming soon)</li>
          </ul>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          This project is for personal use only. We do not save or transmit any
          of your information. All data processing occurs locally in your
          browser.
        </Typography>
        <Button
          component={Link}
          to="/start"
          variant="contained"
          size="large"
          startIcon={<TelegramIcon />}>
          Get Started
        </Button>

        <Button
          href="https://github.com/cjx3711/telegram-stats"
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          size="large"
          startIcon={<GitHub />}
          sx={{ mt: 2 }}>
          View on GitHub
        </Button>
      </Stack>
    </Container>
  );
}

export default LandingPage;
