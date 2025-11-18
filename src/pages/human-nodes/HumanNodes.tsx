import {
  Box,
  Button,
  Card,
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
} from "@mui/material";

const results = [
  {
    id: "Mozgiii",
    name: "Mozgiii",
    role: "Legate · Protocol Engineering",
    acm: 182,
    c: 164,
    m: 92,
    tags: ["Protocol", "Security", "Research"],
  },
  {
    id: "Raamara",
    name: "Raamara",
    role: "Consul · Economics",
    acm: 168,
    c: 150,
    m: 80,
    tags: ["Treasury", "Formation", "Community"],
  },
];

const HumanNodes: React.FC = () => {
  return (
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <TextField
        fullWidth
        placeholder="Search Human nodes by handle, address, chamber, or focus…"
        InputProps={{
          endAdornment: (
            <Button variant="outlined" size="small">
              Search
            </Button>
          ),
        }}
      />

      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} md={7}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography className="eyebrow" component="p">
              Results
            </Typography>
            <Button size="small" variant="outlined">
              Toggle list view
            </Button>
          </Stack>
          <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
            <InputLabel>Sort by</InputLabel>
            <Select defaultValue="acm-desc" label="Sort by">
              <MenuItem value="acm-desc">ACM (desc)</MenuItem>
              <MenuItem value="acm-asc">ACM (asc)</MenuItem>
              <MenuItem value="tier">Tier</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>

          <Stack spacing={2}>
            {results.map((node) => (
              <Card key={node.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <div>
                      <Typography variant="h6">{node.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {node.role}
                      </Typography>
                    </div>
                  </Stack>
                  <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                    <Typography variant="body2">ACM: {node.acm}</Typography>
                    <Typography variant="body2">C-score: {node.c}</Typography>
                    <Typography variant="body2">M-score: {node.m}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={1.5}>
                    {node.tags.map((tag) => (
                      <Chip key={tag} label={tag} variant="outlined" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography className="eyebrow" component="p">
                Filters
              </Typography>
              <Typography variant="h6">Refine directory</Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tier</InputLabel>
                    <Select defaultValue="any" label="Tier">
                      <MenuItem value="any">Any</MenuItem>
                      <MenuItem value="nominee">Nominee</MenuItem>
                      <MenuItem value="ecclesiast">Ecclesiast</MenuItem>
                      <MenuItem value="legate">Legate</MenuItem>
                      <MenuItem value="consul">Consul</MenuItem>
                      <MenuItem value="citizen">Citizen</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Chamber</InputLabel>
                    <Select defaultValue="all" label="Chamber">
                      <MenuItem value="all">All specializations</MenuItem>
                      <MenuItem value="protocol">Protocol Engineering</MenuItem>
                      <MenuItem value="research">Research</MenuItem>
                      <MenuItem value="finance">Finance</MenuItem>
                      <MenuItem value="social">Social</MenuItem>
                      <MenuItem value="formation">Formation Logistics</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="C-score ≥" type="number" defaultValue={150} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="M-score ≥" type="number" defaultValue={80} />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
                {["Protocol", "Security", "Economics", "Social", "Formation", "Research", "High quorum"].map(
                  (chip) => (
                    <Chip key={chip} label={chip} variant="outlined" />
                  ),
                )}
              </Stack>

              <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
                <Button variant="outlined" size="small">
                  Reset
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

export default HumanNodes;
