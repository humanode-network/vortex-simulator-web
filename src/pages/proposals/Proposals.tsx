import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Button,
} from "@mui/material";

const Proposals: React.FC = () => {
  return (
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <div>
              <Typography className="eyebrow" component="p">
                Filters
              </Typography>
              <Typography variant="h6">Search proposals</Typography>
            </div>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Keyword search" placeholder="Proposal, hash, proposer…" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select defaultValue="any" label="Status">
                  <MenuItem value="any">Any</MenuItem>
                  <MenuItem value="pool">Proposal pool</MenuItem>
                  <MenuItem value="vote">Chamber vote</MenuItem>
                  <MenuItem value="build">Formation build</MenuItem>
                  <MenuItem value="final">Final vote</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Chamber</InputLabel>
                <Select defaultValue="all" label="Chamber">
                  <MenuItem value="all">All chambers</MenuItem>
                  <MenuItem value="protocol">Protocol Engineering</MenuItem>
                  <MenuItem value="economics">Economics</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="social">Social</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select defaultValue="newest" label="Sort by">
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
            <Chip label="Infrastructure" />
            <Chip label="Formation" />
            <Chip label="Security" />
            <Chip label="Research" />
            <Chip label="Community" />
            <Chip label="High quorum" />
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <div>
                <Typography variant="body2" color="text.secondary">
                  Protocol Engineering · Legate tier
                </Typography>
                <Typography variant="h6">Orbital Mesh Sequencer Upgrade</Typography>
              </div>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label="Proposal pool" color="primary" variant="outlined" />
                <Chip label="Protocol chamber" variant="outlined" />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              Introduce redundant biometric sequencer nodes to lower latency inside human-node verification flow and
              enable inter-era checkpoints.
            </Typography>
          </CardContent>
          <CardActions sx={{ paddingX: 2, paddingBottom: 2 }}>
            <Button variant="contained" color="primary" size="small">
              Open proposal
            </Button>
            <Button variant="outlined" size="small">
              Watch
            </Button>
          </CardActions>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <div>
                <Typography variant="body2" color="text.secondary">
                  Economics &amp; Treasury · Consul
                </Typography>
                <Typography variant="h6">Adaptive Fee Shaping</Typography>
              </div>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label="Chamber vote" color="primary" variant="outlined" />
                <Chip label="Economics chamber" variant="outlined" />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={1.5}>
              Tune transaction fees dynamically based on network load to improve determinism for quorum settlement while
              protecting user experience.
            </Typography>
          </CardContent>
          <CardActions sx={{ paddingX: 2, paddingBottom: 2 }}>
            <Button variant="contained" color="primary" size="small">
              Open proposal
            </Button>
            <Button variant="outlined" size="small">
              Watch
            </Button>
          </CardActions>
        </Card>
      </Stack>
    </Box>
  );
};

export default Proposals;
