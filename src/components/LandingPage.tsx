import { Box, Button, Container, Typography } from "@mui/material";
import TelegramIcon from "@mui/icons-material/Telegram";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          my: 4,
        }}>
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
        <Typography variant="h6" component="h3" gutterBottom>
          Features:
        </Typography>
        <ul style={{ textAlign: "left", marginBottom: "2rem" }}>
          <li>Upload and analyze Telegram chat exports</li>
          <li>View message statistics and trends</li>
          <li>Explore chat activity over time</li>
          <li>Compare participant contributions</li>
          <li>100% private - all processing happens in your browser</li>
        </ul>
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
      </Box>
    </Container>
  );
}

export default LandingPage;
