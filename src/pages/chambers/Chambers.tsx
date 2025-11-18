import { Link } from "react-router";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Grid,
  Stack,
  Typography,
  Button,
} from "@mui/material";

const chambers = [
  {
    id: "protocol-engineering",
    name: "Protocol Engineering",
    lead: "Mozgiii",
    meta: "Core protocol, network stability, clients.",
    summary:
      "Oversees upgrades to validator stack, biometric verification flow, and consensus tuning.",
  },
  {
    id: "economics",
    name: "Economics & Treasury",
    lead: "Raamara",
    meta: "Token economics, fees, program budgets.",
    summary:
      "Shapes fee policy, treasury distributions, and incentive design across programs.",
  },
  {
    id: "security",
    name: "Security & Infra",
    lead: "TBD",
    meta: "Audits, monitoring, deterrence.",
    summary:
      "Handles preventative controls, incident drills, and operational security posture.",
  },
];

const Chambers: React.FC = () => {
  return (
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <Box>
        <Typography variant="h5">Chambers</Typography>
        <Typography variant="body2" color="text.secondary">
          Browse active governance chambers.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {chambers.map((chamber) => (
          <Grid key={chamber.id} item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">{chamber.name}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {chamber.meta}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {chamber.summary}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%"
                >
                  <Typography variant="body2" color="text.secondary">
                    Lead: {chamber.lead}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/chambers/${chamber.id}`}
                    variant="contained"
                    size="small"
                  >
                    Open chamber
                  </Button>
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Chambers;
