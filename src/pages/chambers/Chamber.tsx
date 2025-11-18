import { useParams, Link } from "react-router";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  Button,
} from "@mui/material";

const Chamber: React.FC = () => {
  const { id } = useParams();
  const title = id ? id.replace(/-/g, " ") : "Unknown";

  return (
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <Typography variant="h5">Chamber: {title}</Typography>
      <Typography variant="body2" color="text.secondary">
        Overview and key metrics for this chamber.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">Scope</Typography>
              <Typography variant="body2" color="text.secondary">
                This chamber governs decisions related to its specialization. Add charter, mandates, and focuses here.
              </Typography>
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                <Chip label="Mandate" variant="outlined" />
                <Chip label="Procedures" variant="outlined" />
                <Chip label="Contacts" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Leads & members</Typography>
              <Typography variant="body2" color="text.secondary">
                Lead: TBD
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active members: —
              </Typography>
              <Stack direction="row" spacing={1} mt={2}>
                <Button component={Link} to="/chambers" variant="outlined" size="small">
                  Back to chambers
                </Button>
                <Button variant="contained" size="small">
                  Apply
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Chamber;
