import { Link } from "react-router";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const Formation: React.FC = () => {
  return (
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <Typography variant="h5">Formation</Typography>

      <Grid container spacing={2}>
        {[
          { label: "Total funded HMND", value: "210k" },
          { label: "Active projects", value: "12" },
          { label: "Open team slots", value: "9" },
          { label: "Milestones delivered", value: "46" },
        ].map((metric) => (
          <Grid key={metric.label} item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h6">{metric.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label="All" color="primary" variant="outlined" />
          <Chip label="Research" variant="outlined" />
          <Chip label="Development" variant="outlined" />
          <Chip label="Social" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label="Live" variant="outlined" />
          <Chip label="Upcoming" variant="outlined" />
          <Chip label="Completed" variant="outlined" />
        </Stack>
      </Stack>

      <Box component="section">
        <Typography className="eyebrow" component="p">
          Search projects
        </Typography>
        <TextField fullWidth placeholder="Search by project, proposer, focus…" />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Node Health Kit</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Formation Logistics · Live
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tooling bundle to automate node diagnostics and recovery workflows for operators.
              </Typography>
              <Stack direction="row" spacing={1} mt={2}>
                <Chip label="Budget: 80k HMND" variant="outlined" />
                <Chip label="Milestones: 6 / 9" variant="outlined" />
                <Chip label="Team slots: 2 open" variant="outlined" />
              </Stack>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body2" color="text.secondary">
                  Proposer: <Link to="/human-nodes/Mozgiii">Mozgiii</Link>
                </Typography>
                <Button component={Link} to="/formation/node-health-kit" variant="contained" size="small">
                  Open project
                </Button>
              </Stack>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Identity Risk Lab</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Research · Upcoming
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Experimental track exploring threat modeling for biometric verification attacks.
              </Typography>
              <Stack direction="row" spacing={1} mt={2}>
                <Chip label="Budget: 45k HMND" variant="outlined" />
                <Chip label="Milestones: 0 / 5" variant="outlined" />
                <Chip label="Team slots: 3 open" variant="outlined" />
              </Stack>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body2" color="text.secondary">
                  Proposer: <Link to="/human-nodes/Raamara">Raamara</Link>
                </Typography>
                <Button component={Link} to="/formation/identity-risk-lab" variant="contained" size="small">
                  Open project
                </Button>
              </Stack>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Formation;
